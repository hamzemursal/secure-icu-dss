"""Attack simulation routes."""

from fastapi import APIRouter, Query

from app.api.deps import ClinicianUser
from app.schemas.attack import (
    AttackLogListResponse,
    AttackPreset,
    AttackSimulateRequest,
    AttackSimulateResponse,
)
from app.services import attack_service

router = APIRouter(prefix="/attacks", tags=["Attack Simulation"])


@router.get("/presets", response_model=list[AttackPreset], summary="Attack presets")
async def get_presets(_current_user: ClinicianUser) -> list[AttackPreset]:
    return attack_service.list_presets()


@router.post(
    "/simulate",
    response_model=AttackSimulateResponse,
    summary="Simulate prompt injection (with/without defense)",
)
async def simulate(
    body: AttackSimulateRequest,
    current_user: ClinicianUser,
) -> AttackSimulateResponse:
    return await attack_service.simulate_attack(body, current_user)


@router.get(
    "/logs",
    response_model=AttackLogListResponse,
    summary="List attack simulation logs",
)
async def attack_logs(
    _current_user: ClinicianUser,
    limit: int = Query(default=50, ge=1, le=200),
) -> AttackLogListResponse:
    items = await attack_service.list_attack_logs(limit=limit)
    return AttackLogListResponse(items=items, total=len(items))
