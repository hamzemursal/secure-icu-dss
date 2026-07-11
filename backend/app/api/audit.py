"""Audit log and evaluation / dashboard routes."""

from typing import Any, Optional

from fastapi import APIRouter, Query

from app.api.deps import ClinicianUser
from app.schemas.evaluation import DashboardStats, EvaluationMetrics
from app.services import evaluation_service

router = APIRouter(tags=["Audit & Evaluation"])


@router.get(
    "/dashboard/stats",
    response_model=DashboardStats,
    summary="Dashboard statistics",
)
async def dashboard_stats(_current_user: ClinicianUser) -> DashboardStats:
    return await evaluation_service.get_dashboard_stats()


@router.get(
    "/evaluation/metrics",
    response_model=EvaluationMetrics,
    summary="Security evaluation metrics",
)
async def evaluation_metrics(_current_user: ClinicianUser) -> EvaluationMetrics:
    return await evaluation_service.get_evaluation_metrics()


@router.get(
    "/audit-logs",
    summary="List audit logs",
)
async def audit_logs(
    _current_user: ClinicianUser,
    limit: int = Query(default=100, ge=1, le=500),
    action: Optional[str] = None,
) -> dict[str, Any]:
    items = await evaluation_service.list_audit_logs(limit=limit, action=action)
    return {"items": items, "total": len(items)}
