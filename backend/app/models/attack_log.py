"""Attack simulation log — prompt injection experiments for evaluation."""

from datetime import datetime, timezone
from typing import Any, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field


class AttackLog(Document):
    """Records each attack simulation run (with/without defense)."""

    attack_name: str = Field(..., max_length=120)
    payload: str = Field(..., max_length=4000)
    defense_enabled: bool
    blocked: bool
    attack_succeeded: bool
    risk_score: float = 0.0
    unprotected_output: Optional[dict[str, Any]] = None
    protected_output: Optional[dict[str, Any]] = None
    findings: list[dict[str, Any]] = Field(default_factory=list)
    latency_ms: float = 0.0
    actor_id: Optional[PydanticObjectId] = None
    actor_name: str = "system"
    created_at: Indexed(datetime) = Field(  # type: ignore[valid-type]
        default_factory=lambda: datetime.now(timezone.utc)
    )

    class Settings:
        name = "attack_logs"
        indexes = ["defense_enabled", "blocked", "attack_succeeded"]
