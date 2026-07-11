"""AI recommendation document produced by the multi-agent pipeline."""

from datetime import datetime, timezone
from typing import Any, Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from app.models.enums import RecommendationStatus, RiskLevel


class Recommendation(Document):
    """Decision-support recommendation awaiting / after human approval."""

    patient_id: Indexed(PydanticObjectId)  # type: ignore[valid-type]
    patient_mrn: str
    patient_name: str
    status: RecommendationStatus = RecommendationStatus.PENDING_APPROVAL
    suggested_risk_level: RiskLevel = RiskLevel.MEDIUM
    actions: list[str] = Field(default_factory=list)
    monitoring: list[str] = Field(default_factory=list)
    rationale: str = ""
    disclaimer: str = (
        "AI recommendation only. Final medical decision belongs to the doctor."
    )
    reasoning_summary: Optional[str] = None
    clinical_flags: list[str] = Field(default_factory=list)
    pipeline_trace: list[dict[str, Any]] = Field(default_factory=list)
    security: dict[str, Any] = Field(default_factory=dict)
    verification: dict[str, Any] = Field(default_factory=dict)
    source: str = "heuristic"
    created_by: PydanticObjectId
    created_by_name: str
    reviewed_by: Optional[PydanticObjectId] = None
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    blocked: bool = False
    block_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "recommendations"
        indexes = ["status", "created_at", "blocked"]
