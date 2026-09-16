from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, JSON
from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, index=True)
    actor_id = Column(String(64), nullable=False, index=True)
    actor_role = Column(String(32), nullable=False)
    action_type = Column(String(64), nullable=False, index=True)  # e.g. "attendance_override", "leave_approval", "substitute_assigned"
    target_entity = Column(String(64), nullable=False)
    metadata_json = Column(JSON, nullable=True)  # PostgreSQL JSONB / JSON column
    ip_address = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
