"""Recommendation API schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field

from app.models.enums import RecommendationStatus, RiskLevel


class RunRecommendationRequest(BaseModel):
    extra_notes: Optional[str] = Field(
        default=None,
        max_length=2000,
        description="Optional clinician notes (scanned by Security Agent)",
    )


class ReviewRecommendationRequest(BaseModel):
    approve: bool
    notes: Optional[str] = Field(default=None, max_length=2000)


class RecommendationPublic(BaseModel):
    id: str
    patient_id: str
    patient_mrn: str
    patient_name: str
    status: RecommendationStatus
    suggested_risk_level: RiskLevel
    actions: list[str]
    monitoring: list[str]
    rationale: str
    disclaimer: str
    reasoning_summary: Optional[str] = None
    clinical_flags: list[str] = Field(default_factory=list)
    pipeline_trace: list[dict[str, Any]] = Field(default_factory=list)
    security: dict[str, Any] = Field(default_factory=dict)
    verification: dict[str, Any] = Field(default_factory=dict)
    source: str
    created_by_name: str
    reviewed_by_name: Optional[str] = None
    review_notes: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    blocked: bool = False
    block_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class RecommendationListResponse(BaseModel):
    items: list[RecommendationPublic]
    total: int
