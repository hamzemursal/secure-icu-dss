"""Aggregate API v1 router."""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.patients import router as patients_router
from app.api.recommendations import router as recommendations_router
from app.api.attacks import router as attacks_router
from app.api.audit import router as audit_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(patients_router)
api_router.include_router(recommendations_router)
api_router.include_router(attacks_router)
api_router.include_router(audit_router)
