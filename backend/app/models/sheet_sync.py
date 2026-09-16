from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON
from app.core.database import Base


class SheetConfig(Base):
    __tablename__ = "sheet_configs"

    id = Column(String(64), primary_key=True, index=True)
    sheet_type = Column(String(32), unique=True, index=True, nullable=False)  # "student" | "faculty"
    url = Column(String(512), nullable=True)
    sync_interval_minutes = Column(Integer, default=0, nullable=False)  # 0: manual, 15, 60, 360
    auto_apply = Column(Boolean, default=False, nullable=False)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    last_sync_status = Column(String(32), default="idle", nullable=False)  # "idle" | "success" | "warning" | "error" | "pending_review"
    last_sync_summary = Column(JSON, nullable=True)
    pending_preview = Column(JSON, nullable=True)
    created_by = Column(String(64), nullable=True)
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )
