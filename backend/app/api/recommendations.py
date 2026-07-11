"""AI recommendation routes — run pipeline, list, approve/reject."""

from typing import Optional

from fastapi import APIRouter, Query, status

from app.api.deps import ClinicianUser, DoctorUser
from app.models.enums import RecommendationStatus
from app.schemas.recommendation import (
    RecommendationListResponse,
    RecommendationPublic,
    ReviewRecommendationRequest,
    RunRecommendationRequest,
)
from app.services import agent_pipeline

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.post(
    "/patients/{patient_id}/run",
    response_model=RecommendationPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Run multi-agent recommendation pipeline",
)
async def run_pipeline(
    patient_id: str,
    current_user: ClinicianUser,
    body: RunRecommendationRequest | None = None,
) -> RecommendationPublic:
    """
    Security → Intake → Reasoning → Recommendation → Verification
    → Human Approval → Logger → Database.
    """
    return await agent_pipeline.run_recommendation_pipeline(
        patient_id,
        current_user,
        body or RunRecommendationRequest(),
    )


@router.get(
    "",
    response_model=RecommendationListResponse,
    summary="List recommendations",
)
async def list_recommendations(
    _current_user: ClinicianUser,
    patient_id: Optional[str] = None,
    status_filter: Optional[RecommendationStatus] = Query(default=None, alias="status"),
    limit: int = Query(default=50, ge=1, le=100),
) -> RecommendationListResponse:
    items = await agent_pipeline.list_recommendations(
        patient_id=patient_id,
        status_filter=status_filter,
        limit=limit,
    )
    return RecommendationListResponse(items=items, total=len(items))


@router.get(
    "/{recommendation_id}",
    response_model=RecommendationPublic,
    summary="Get recommendation",
)
async def get_recommendation(
    recommendation_id: str,
    _current_user: ClinicianUser,
) -> RecommendationPublic:
    return await agent_pipeline.get_recommendation(recommendation_id)


@router.post(
    "/{recommendation_id}/review",
    response_model=RecommendationPublic,
    summary="Doctor approve or reject",
)
async def review_recommendation(
    recommendation_id: str,
    body: ReviewRecommendationRequest,
    current_user: DoctorUser,
) -> RecommendationPublic:
    """Human-in-the-loop gate — doctors/admins only."""
    return await agent_pipeline.review_recommendation(
        recommendation_id,
        current_user,
        approve=body.approve,
        notes=body.notes,
    )
