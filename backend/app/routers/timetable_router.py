import io
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import pandas as pd

from app.core.deps import get_db, require_role
from app.models.user import User, Faculty, RoleEnum
from app.models.academic import TimetableSlot, Course, Room, ClassSection
from app.models.sheet_sync import SheetConfig
from app.schemas.sheet_sync import SheetConfigItem, SheetConfigSaveRequest
from app.schemas.timetable_sync import (
    TimetableSlotDetail,
    TimetableSyncPreviewResponse,
    TimetableApplyRequest,
    TimetableApplyResponse,
)
from app.services.sheet_sync import validate_and_normalize_sheet_url, fetch_sheet_csv
from app.services.timetable_sync import (
    parse_and_validate_timetable,
    apply_timetable_sync_rows,
    generate_timetable_csv_template,
)

router = APIRouter(prefix="/admin/timetable", tags=["Admin Timetable Sheet Sync"])


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


@router.get("/all", response_model=List[TimetableSlotDetail])
async def get_all_timetable_slots(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Returns all assigned weekly timetable slots with resolved Course, Faculty, Room, and ClassSection details.
    Uses resilient outer joins and fallback mapping so slots are never dropped due to loose identifiers.
    """
    from sqlalchemy import or_
    import re
    stmt = (
        select(TimetableSlot, Course, Faculty, User, Room, ClassSection)
        .outerjoin(Course, or_(TimetableSlot.course_id == Course.id, TimetableSlot.course_id == Course.code, TimetableSlot.course_id == Course.name))
        .outerjoin(Faculty, or_(TimetableSlot.faculty_id == Faculty.id, TimetableSlot.faculty_id == Faculty.employee_id, TimetableSlot.faculty_id == Faculty.user_id))
        .outerjoin(User, or_(Faculty.user_id == User.id, TimetableSlot.faculty_id == User.id, TimetableSlot.faculty_id == User.name))
        .outerjoin(Room, or_(TimetableSlot.room_id == Room.id, TimetableSlot.room_id == Room.name))
        .outerjoin(ClassSection, or_(TimetableSlot.section_id == ClassSection.id, TimetableSlot.section_id == ClassSection.name, TimetableSlot.section_id == ClassSection.section))
        .order_by(TimetableSlot.day_of_week, TimetableSlot.start_time)
    )
    res = await db.execute(stmt)
    slots = []
    for slot, course, fac, u, room, section in res.all():
        raw_fac_name = u.name if u else (slot.faculty_id or "Faculty Staff")
        clean_fac_name = re.sub(r'^[.\s,]+', '', str(raw_fac_name)).strip()
        if not clean_fac_name:
            clean_fac_name = "Faculty Staff"

        slots.append(
            TimetableSlotDetail(
                id=slot.id,
                day=slot.day_of_week,
                startTime=slot.start_time,
                endTime=slot.end_time,
                subjectId=course.id if course else (slot.course_id or ""),
                subjectCode=course.code if course else (slot.course_id or "SUB"),
                subjectName=course.name if course else (slot.course_id or "Class Lecture"),
                facultyId=fac.id if fac else (slot.faculty_id or ""),
                facultyName=clean_fac_name,
                classSectionId=section.id if section else (slot.section_id or ""),
                classSectionName=section.name if section else (slot.section_id or "Class Section"),
                room=room.name if room else (slot.room_id or "LH-201"),
                color=slot.color or "indigo",
            )
        )
    return slots


def _get_config_id_and_type(target: Optional[str] = None, sheet_type: Optional[str] = None) -> tuple[str, str]:
    t = (target or "").lower().strip()
    st = (sheet_type or "").lower().strip()
    if t in ("teacher", "faculty", "teacher_timetable", "faculty_timetable") or st in ("teacher", "faculty", "teacher_timetable", "faculty_timetable"):
        return "sheet-config-teacher-timetable", "teacher_timetable"
    return "sheet-config-student-timetable", "student_timetable"


@router.get("/config", response_model=SheetConfigItem)
async def get_timetable_sheet_config(
    target: Optional[str] = Query("student", description="Target schedule: 'student' or 'teacher'"),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves Google Sheet sync configuration and status for Student or Teacher Timetables.
    """
    config_id, s_type = _get_config_id_and_type(target)
    stmt = select(SheetConfig).where(SheetConfig.id == config_id)
    res = await db.execute(stmt)
    cfg = res.scalar_one_or_none()

    if not cfg:
        # Fallback to legacy config if student config does not exist yet
        if config_id == "sheet-config-student-timetable":
            fallback_stmt = select(SheetConfig).where(SheetConfig.id == "sheet-config-timetable")
            f_res = await db.execute(fallback_stmt)
            fallback_cfg = f_res.scalar_one_or_none()
            if fallback_cfg:
                cfg = SheetConfig(
                    id=config_id,
                    sheet_type=s_type,
                    url=fallback_cfg.url,
                    sync_interval_minutes=fallback_cfg.sync_interval_minutes,
                    auto_apply=fallback_cfg.auto_apply,
                    last_synced_at=fallback_cfg.last_synced_at,
                    last_sync_status=fallback_cfg.last_sync_status,
                    last_sync_summary=fallback_cfg.last_sync_summary,
                    pending_preview=fallback_cfg.pending_preview,
                )
                db.add(cfg)
                await db.commit()
                await db.refresh(cfg)
                return _format_config_item(cfg)

        cfg = SheetConfig(
            id=config_id,
            sheet_type=s_type,
            sync_interval_minutes=0,
            auto_apply=False,
            last_sync_status="idle",
        )
        db.add(cfg)
        await db.commit()
        await db.refresh(cfg)

    return _format_config_item(cfg)


@router.get("/configs")
async def get_all_timetable_configs(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves sheet sync configurations for both student and teacher timetables in one call.
    """
    student_cfg = await get_timetable_sheet_config(target="student", current_user=current_user, db=db)
    teacher_cfg = await get_timetable_sheet_config(target="teacher", current_user=current_user, db=db)
    return {"student": student_cfg, "teacher": teacher_cfg}


@router.post("/config", response_model=SheetConfigItem)
async def save_timetable_sheet_config(
    payload: SheetConfigSaveRequest,
    target: Optional[str] = Query(None, description="Target schedule: 'student' or 'teacher'"),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Saves or updates the Google Sheet URL, sync interval, and auto-apply setting for Student or Teacher Timetables.
    Performs SSRF validation on the submitted URL.
    """
    normalized_url = None
    if payload.url and payload.url.strip():
        try:
            normalized_url = validate_and_normalize_sheet_url(payload.url.strip())
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))

    config_id, s_type = _get_config_id_and_type(target, payload.sheet_type)
    stmt = select(SheetConfig).where(SheetConfig.id == config_id)
    res = await db.execute(stmt)
    cfg = res.scalar_one_or_none()

    if not cfg:
        cfg = SheetConfig(
            id=config_id,
            sheet_type=s_type,
            url=normalized_url,
            sync_interval_minutes=payload.sync_interval_minutes,
            auto_apply=payload.auto_apply,
            created_by=current_user.id,
        )
        db.add(cfg)
    else:
        cfg.url = normalized_url
        cfg.sync_interval_minutes = payload.sync_interval_minutes
        cfg.auto_apply = payload.auto_apply
        cfg.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(cfg)
    return _format_config_item(cfg)


@router.post("/sync", response_model=TimetableSyncPreviewResponse)
async def trigger_timetable_sync(
    custom_url: Optional[str] = Query(None, description="Optional override Google Sheet URL"),
    target: Optional[str] = Query("student", description="Target schedule: 'student' or 'teacher'"),
    file: Optional[UploadFile] = File(None, description="Optional direct CSV or Excel timetable file"),
    auto_apply: bool = Query(False, description="Optionally commit valid slots to database immediately"),
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Parses timetable data from either an uploaded Excel/CSV file or a live Google Sheet URL.
    Validates courses, sections, rooms, and faculty, runs collision detection (room double-booking,
    faculty concurrency, section collisions), and returns preview items staged for review.
    If auto_apply=True and valid slots exist, automatically applies slots to student/faculty portals.
    """
    df: Optional[pd.DataFrame] = None
    resolved_norm_url: Optional[str] = None

    if file:
        filename = (file.filename or "").lower()
        contents = await file.read()
        if not contents:
            raise HTTPException(status_code=400, detail="The uploaded file is empty.")

        try:
            if filename.endswith(".xlsx") or filename.endswith(".xls"):
                df = pd.read_excel(io.BytesIO(contents), dtype=str)
            else:
                # CSV fallback with encoding detection
                try:
                    df = pd.read_csv(io.BytesIO(contents), dtype=str, encoding="utf-8-sig")
                except UnicodeDecodeError:
                    df = pd.read_csv(io.BytesIO(contents), dtype=str, encoding="latin-1")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse uploaded file: {str(e)}")

    else:
        target_url = None
        if custom_url and custom_url.strip():
            target_url = custom_url.strip()
        else:
            config_id, _ = _get_config_id_and_type(target)
            stmt = select(SheetConfig).where(SheetConfig.id == config_id)
            res = await db.execute(stmt)
            cfg = res.scalar_one_or_none()
            if (not cfg or not cfg.url) and config_id == "sheet-config-student-timetable":
                fallback_res = await db.execute(select(SheetConfig).where(SheetConfig.id == "sheet-config-timetable"))
                cfg = fallback_res.scalar_one_or_none()
            if cfg and cfg.url:
                target_url = cfg.url

        if not target_url:
            label = "Teacher" if (target or "").lower() == "teacher" else "Student"
            raise HTTPException(
                status_code=400,
                detail=f"No {label} Timetable Google Sheet URL provided or saved. Please enter a URL or upload a file."
            )

        try:
            resolved_norm_url = validate_and_normalize_sheet_url(target_url)
            csv_text = await fetch_sheet_csv(resolved_norm_url)
            df = pd.read_csv(io.StringIO(csv_text), dtype=str, skip_blank_lines=True)
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to fetch Google Sheet: {str(e)}")

    if df is None or df.empty:
        raise HTTPException(status_code=400, detail="Timetable dataset is empty.")

    try:
        preview_data = await parse_and_validate_timetable(df, db)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse timetable data: {str(e)}")

    # Stage preview into SheetConfig and persist the normalized URL
    config_id, s_type = _get_config_id_and_type(target)
    stmt = select(SheetConfig).where(SheetConfig.id == config_id)
    res = await db.execute(stmt)
    cfg = res.scalar_one_or_none()
    if not cfg:
        cfg = SheetConfig(
            id=config_id,
            sheet_type=s_type,
            sync_interval_minutes=0,
            auto_apply=False,
            created_by=current_user.id,
        )
        db.add(cfg)

    if resolved_norm_url:
        cfg.url = resolved_norm_url

    cfg.last_synced_at = datetime.now(timezone.utc)
    cfg.last_sync_summary = {
        "total": preview_data["total_slots"],
        "valid": preview_data["valid_slots_count"],
        "warnings": preview_data["warning_slots_count"],
        "errors": preview_data["error_slots_count"],
        "conflicts": preview_data["conflict_count"],
        "sections": len(preview_data["unique_sections"]),
        "faculty": len(preview_data["unique_faculty"]),
        "courses": len(preview_data["unique_courses"]),
    }

    # Handle auto-apply if requested and valid slots exist
    if auto_apply and (preview_data["valid_slots_count"] + preview_data["warning_slots_count"]) > 0:
        try:
            apply_res = await apply_timetable_sync_rows(
                rows=preview_data["preview_rows"],
                replace_existing=True,
                actor_id=current_user.id,
                actor_role=current_user.role,
                db=db,
            )
            preview_data["applied_result"] = apply_res
            cfg.pending_preview = None
            cfg.last_sync_status = "success"
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to auto-apply timetable slots: {str(e)}")
    else:
        cfg.pending_preview = preview_data
        cfg.last_sync_status = "pending_review" if preview_data["error_slots_count"] == 0 else "warning"

    await db.commit()
    await db.refresh(cfg)

    return TimetableSyncPreviewResponse(**preview_data)


@router.post("/apply", response_model=TimetableApplyResponse)
async def apply_timetable_slots(
    payload: TimetableApplyRequest,
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
    db: AsyncSession = Depends(get_db),
):
    """
    Commits validated timetable slots to the database:
    - Auto-creates any missing courses, rooms, or class sections.
    - If replace_existing is True, clears existing timetable slots for the affected sections.
    - Inserts new TimetableSlot entries.
    - Links faculty to subjects via SectionSubjectFaculty.
    - Writes immutable audit log and updates sheet sync status.
    """
    if not payload.rows:
        raise HTTPException(status_code=400, detail="No timetable slots provided to apply.")

    try:
        result = await apply_timetable_sync_rows(
            rows=payload.rows,
            replace_existing=payload.replace_existing,
            actor_id=current_user.id,
            actor_role=current_user.role,
            db=db,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to apply timetable slots: {str(e)}")

    return TimetableApplyResponse(**result)


@router.get("/template")
async def download_timetable_template(
    current_user: User = Depends(require_role([RoleEnum.ADMIN, RoleEnum.FACULTY, RoleEnum.STUDENT])),
):
    """
    Returns an official CSV template with standard timetable column headers and sample data rows.
    """
    csv_content = generate_timetable_csv_template()
    filename = "academic_timetable_template.csv"

    return StreamingResponse(
        io.BytesIO(csv_content.encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-cache",
        },
    )
