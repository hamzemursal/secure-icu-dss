"""Evaluation and dashboard schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DashboardStats(BaseModel):
    patients: int
    critical_patients: int
    doctors: int
    recommendations: int
    blocked_attacks: int
    system_status: str = "operational"
    recent_logs: list[dict[str, Any]] = Field(default_factory=list)


class EvaluationMetrics(BaseModel):
    attack_success_before: float
    attack_success_after: float
    false_positive_rate: float
    false_negative_rate: float
    avg_latency_ms: float
    recovery_time_ms: float
    unsafe_tool_reduction: float
    human_approval_accuracy: float
    total_attacks: int
    total_blocked: int
    total_recommendations: int
    attack_success_series: list[dict[str, Any]] = Field(default_factory=list)
    latency_series: list[dict[str, Any]] = Field(default_factory=list)
    generated_at: datetime
