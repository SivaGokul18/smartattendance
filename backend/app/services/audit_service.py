import json
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog


async def log_audit_event(
    db: AsyncSession,
    actor_id: str,
    actor_role: str,
    action_type: str,
    target_entity: str,
    metadata: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None
) -> AuditLog:
    """
    Creates an immutable audit log record for security, overrides, and administrative actions.
    """
    audit_entry = AuditLog(
        id=f"audit-{uuid.uuid4().hex[:12]}",
        actor_id=actor_id,
        actor_role=actor_role,
        action_type=action_type,
        target_entity=target_entity,
        metadata_json=metadata or {},
        ip_address=ip_address
    )
    db.add(audit_entry)
    await db.commit()
    return audit_entry
