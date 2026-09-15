import io
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.deps import get_db, require_role
from app.models.user import User, RoleEnum
from app.models.sheet_sync import SheetConfig
from app.schemas.sheet_sync import (
    SheetConfigItem,
    SheetConfigsResponse,
    SheetConfigSaveRequest,
    SheetSyncPreviewResponse,
    SheetApplyRequest,
    SheetApplyResponse,
)
from app.services.sheet_sync import (
    validate_and_normalize_sheet_url,
    fetch_sheet_csv,
    validate_and_diff_sheet_data,
    apply_sheet_sync_rows,
    generate_csv_template,
)

router = APIRouter(prefix="/admin/sheets", tags=["Admin Live Google Sheet Sync"])


async def _ensure_sheet_config_table(db: AsyncSession):
    try:
        await db.execute(select(SheetConfig).limit(1))
    except Exception:
        await db.rollback()
        try:
            from app.core.database import engine, Base
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        except Exception:
            pass


def _format_config_item(cfg: SheetConfig) -> SheetConfigItem:
    return SheetConfigItem(
        id=cfg.id,
        sheet_type=cfg.sheet_type,
        url=cfg.url,
        sync_interval_minutes=cfg.sync_interval_minutes,
        auto_apply=cfg.auto_apply,
        last_synced_at=cfg.last_synced_at.isoformat() if cfg.last_synced_at else None,
        last_sync_status=cfg.last_sync_status,
        last_sync_summary=cfg.last_sync_summary,
        pending_preview=cfg.pending_preview,
        created_by=cfg.created_by,
        updated_at=cfg.updated_at.isoformat() if cfg.updated_at else None,
    )


@router.get("/config", response_model=SheetConfigsResponse)
async def get_sheet_configs(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves current Google Sheet sync configurations and statuses for Student & Faculty rosters.
    """
    await _ensure_sheet_config_table(db)

    try:
        stmt = select(SheetConfig)
        res = await db.execute(stmt)
        configs = {c.sheet_type: c for c in res.scalars().all()}
    except Exception:
        await db.rollback()
        configs = {}

    # Ensure student config exists
    stu_cfg = configs.get("student")
    if not stu_cfg:
        stu_cfg = SheetConfig(
            id="sheet-config-student",
            sheet_type="student",
            sync_interval_minutes=0,
            auto_apply=False,
            last_sync_status="idle",
            updated_at=datetime.utcnow(),
        )
        db.add(stu_cfg)

    # Ensure faculty config exists
    fac_cfg = configs.get("faculty")
    if not fac_cfg:
        fac_cfg = SheetConfig(
            id="sheet-config-faculty",
            sheet_type="faculty",
            sync_interval_minutes=0,
            auto_apply=False,
            last_sync_status="idle",
            updated_at=datetime.utcnow(),
        )
        db.add(fac_cfg)

    try:
        await db.commit()
        await db.refresh(stu_cfg)
        await db.refresh(fac_cfg)
    except Exception:
        await db.rollback()

    return SheetConfigsResponse(
        student=_format_config_item(stu_cfg),
        faculty=_format_config_item(fac_cfg),
    )


@router.post("/config", response_model=SheetConfigItem)
async def save_sheet_config(
    payload: SheetConfigSaveRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Saves or updates the Google Sheet published URL, sync interval, and auto-apply setting.
    Performs SSRF validation on the submitted URL.
    """
    sheet_type = payload.sheet_type.lower().strip()
    if sheet_type not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid sheet_type. Must be 'student' or 'faculty'.")

    normalized_url = None
    if payload.url and payload.url.strip():
        try:
            normalized_url = validate_and_normalize_sheet_url(payload.url.strip())
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

    await _ensure_sheet_config_table(db)

    config_id = f"sheet-config-{sheet_type}"
    try:
        stmt = select(SheetConfig).where(SheetConfig.id == config_id)
        res = await db.execute(stmt)
        cfg = res.scalar_one_or_none()
    except Exception:
        await db.rollback()
        cfg = None

    if not cfg:
        cfg = SheetConfig(
            id=config_id,
            sheet_type=sheet_type,
            url=normalized_url,
            sync_interval_minutes=payload.sync_interval_minutes,
            auto_apply=payload.auto_apply,
            created_by=str(current_user.id or "admin"),
            updated_at=datetime.utcnow(),
        )
        db.add(cfg)
    else:
        cfg.url = normalized_url
        cfg.sync_interval_minutes = payload.sync_interval_minutes
        cfg.auto_apply = payload.auto_apply
        cfg.updated_at = datetime.utcnow()

    try:
        await db.commit()
        await db.refresh(cfg)
    except Exception:
        await db.rollback()

    return _format_config_item(cfg)


@router.post("/sync/{sheet_type}", response_model=SheetSyncPreviewResponse)
async def trigger_live_sync(
    sheet_type: str,
    custom_url: Optional[str] = Query(None, description="Optional override Google Sheet URL"),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches the live Google Sheet CSV, parses rows, matches existing DB users by email,
    calculates diffs (updates), checks uniqueness (creates), and flags missing records.
    Returns preview data and stages it for admin approval.
    """
    st_clean = sheet_type.lower().strip()
    if st_clean not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid sheet_type. Must be 'student' or 'faculty'.")

    # Determine URL
    target_url = None
    if custom_url and custom_url.strip():
        target_url = custom_url.strip()
    else:
        config_id = f"sheet-config-{st_clean}"
        stmt = select(SheetConfig).where(SheetConfig.id == config_id)
        res = await db.execute(stmt)
        cfg = res.scalar_one_or_none()
        if cfg and cfg.url:
            target_url = cfg.url

    if not target_url:
        raise HTTPException(
            status_code=400,
            detail=f"No Google Sheet URL configured for {st_clean}. Please configure the URL first."
        )

    try:
        norm_url = validate_and_normalize_sheet_url(target_url)
        csv_text = await fetch_sheet_csv(norm_url)
        preview_data = await validate_and_diff_sheet_data(csv_text, st_clean, db)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync Google Sheet: {str(e)}")

    # Stage preview into SheetConfig
    config_id = f"sheet-config-{st_clean}"
    stmt = select(SheetConfig).where(SheetConfig.id == config_id)
    res = await db.execute(stmt)
    cfg = res.scalar_one_or_none()
    if cfg:
        cfg.pending_preview = preview_data
        cfg.last_synced_at = datetime.utcnow()
        cfg.last_sync_status = "pending_review" if preview_data["error_rows_count"] == 0 else "warning"
        cfg.last_sync_summary = {
            "total": preview_data["total_rows"],
            "valid": preview_data["valid_rows_count"],
            "warnings": preview_data["warning_rows_count"],
            "errors": preview_data["error_rows_count"],
            "created": preview_data["create_count"],
            "updated": preview_data["update_count"],
            "missing": preview_data["missing_count"],
        }
        await db.commit()

    return SheetSyncPreviewResponse(**preview_data)


@router.post("/apply", response_model=SheetApplyResponse)
async def apply_sheet_rows(
    payload: SheetApplyRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Applies validated sheet rows to the MySQL database:
    - Updates existing records by email without overwriting biometric templates or attendance logs.
    - Creates newly registered accounts with secure random temporary passwords and must_change_password=True.
    - Emits immutable audit log.
    - Returns execution summary and generated credentials list.
    """
    sheet_type = payload.sheet_type.lower().strip()
    if sheet_type not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid sheet_type. Must be 'student' or 'faculty'.")

    if not payload.rows:
        raise HTTPException(status_code=400, detail="No rows provided to apply.")

    try:
        result = await apply_sheet_sync_rows(
            sheet_type=sheet_type,
            rows=payload.rows,
            actor_id=current_user.id,
            actor_role=current_user.role,
            db=db,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to apply sheet changes: {str(e)}")

    return SheetApplyResponse(**result)


@router.get("/template/{sheet_type}")
async def download_sheet_csv_template(
    sheet_type: str,
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
):
    """
    Returns an official CSV template with standard column headers and sample data rows.
    """
    st_clean = sheet_type.lower().strip()
    if st_clean not in ["student", "faculty"]:
        raise HTTPException(status_code=400, detail="Invalid sheet_type. Must be 'student' or 'faculty'.")

    csv_content = generate_csv_template(st_clean)
    filename = f"{st_clean}_roster_template.csv"

    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )
