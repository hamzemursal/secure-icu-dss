"""Patient management routes — CRUD, vitals, medical history."""

from typing import Optional

from fastapi import APIRouter, Query, status

from app.api.deps import ClinicianUser, DoctorUser
from app.models.enums import PatientStatus
from app.schemas.patient import (
    MedicalHistoryResponse,
    MedicalRecordCreate,
    MedicalRecordPublic,
    PatientCreate,
    PatientListResponse,
    PatientPublic,
    PatientUpdate,
    VitalsSchema,
)
from app.schemas.auth import MessageResponse
from app.services import patient_service

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post(
    "",
    response_model=PatientPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create patient",
)
async def create_patient(
    body: PatientCreate,
    current_user: ClinicianUser,
) -> PatientPublic:
    """Admit a new patient. Doctors, nurses, and admins may create."""
    return await patient_service.create_patient(body, current_user)


@router.get(
    "",
    response_model=PatientListResponse,
    summary="List patients",
)
async def list_patients(
    _current_user: ClinicianUser,
    status_filter: Optional[PatientStatus] = Query(default=None, alias="status"),
    search: Optional[str] = Query(default=None, min_length=1, max_length=80),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
) -> PatientListResponse:
    return await patient_service.list_patients(
        status_filter=status_filter,
        search=search,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{patient_id}",
    response_model=PatientPublic,
    summary="Get patient details",
)
async def get_patient(
    patient_id: str,
    _current_user: ClinicianUser,
) -> PatientPublic:
    return await patient_service.get_patient(patient_id)


@router.patch(
    "/{patient_id}",
    response_model=PatientPublic,
    summary="Update patient",
)
async def update_patient(
    patient_id: str,
    body: PatientUpdate,
    current_user: ClinicianUser,
) -> PatientPublic:
    return await patient_service.update_patient(patient_id, body, current_user)


@router.delete(
    "/{patient_id}",
    response_model=MessageResponse,
    summary="Delete patient (soft)",
)
async def delete_patient(
    patient_id: str,
    current_user: DoctorUser,
) -> MessageResponse:
    """Soft-delete. Doctors and admins only (nurses cannot delete)."""
    await patient_service.delete_patient(patient_id, current_user)
    return MessageResponse(message="Patient deleted successfully")


@router.put(
    "/{patient_id}/vitals",
    response_model=PatientPublic,
    summary="Update patient vitals",
)
async def update_vitals(
    patient_id: str,
    body: VitalsSchema,
    current_user: ClinicianUser,
) -> PatientPublic:
    return await patient_service.update_vitals(patient_id, body, current_user)


@router.get(
    "/{patient_id}/history",
    response_model=MedicalHistoryResponse,
    summary="Medical history",
)
async def medical_history(
    patient_id: str,
    _current_user: ClinicianUser,
) -> MedicalHistoryResponse:
    return await patient_service.get_medical_history(patient_id)


@router.post(
    "/{patient_id}/records",
    response_model=MedicalRecordPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Add medical record",
)
async def add_record(
    patient_id: str,
    body: MedicalRecordCreate,
    current_user: ClinicianUser,
) -> MedicalRecordPublic:
    return await patient_service.add_medical_record(patient_id, body, current_user)
