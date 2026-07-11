"""Attack simulation schemas."""

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field


class AttackPreset(BaseModel):
    id: str
    name: str
    payload: str
    description: str


class AttackSimulateRequest(BaseModel):
    attack_name: str = Field(default="custom_attack", max_length=120)
    payload: str = Field(..., min_length=3, max_length=4000)
    defense_enabled: bool = True


class AttackLogPublic(BaseModel):
    id: str
    attack_name: str
    payload: str
    defense_enabled: bool
    blocked: bool
    attack_succeeded: bool
    risk_score: float
    unprotected_output: Optional[dict[str, Any]] = None
    protected_output: Optional[dict[str, Any]] = None
    findings: list[dict[str, Any]] = Field(default_factory=list)
    latency_ms: float
    actor_name: str
    created_at: datetime


class AttackSimulateResponse(BaseModel):
    log: AttackLogPublic
    comparison: dict[str, Any]


class AttackLogListResponse(BaseModel):
    items: list[AttackLogPublic]
    total: int
