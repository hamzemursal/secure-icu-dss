"""Audit log document — AI and security event trail."""

from datetime import datetime, timezone
from typing import Any, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class AuditLog(Document):
    """Immutable-style audit entry for compliance and evaluation."""

    action: Indexed(str)  # type: ignore[valid-type]
    actor_id: Optional[PydanticObjectId] = None
    actor_name: str = "system"
    actor_role: str = "system"
    patient_id: Optional[PydanticObjectId] = None
    resource_type: str = "general"
    resource_id: Optional[str] = None
    details: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "audit_logs"
        indexes = ["created_at", "patient_id"]
