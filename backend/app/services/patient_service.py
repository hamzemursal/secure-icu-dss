"""Patient management business logic."""

from datetime import datetime, timezone
from typing import Optional

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.models import MedicalRecord, Patient, User, Vitals
from app.models.enums import PatientStatus, RecordType
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


def _vitals_to_schema(vitals: Optional[Vitals]) -> Optional[VitalsSchema]:
    if vitals is None:
        return None
    return VitalsSchema.model_validate(vitals.model_dump())


def patient_to_public(patient: Patient) -> PatientPublic:
    return PatientPublic(
        id=str(patient.id),
        mrn=patient.mrn,
        full_name=patient.full_name,
        age=patient.age,
        gender=patient.gender,
        status=patient.status,
        risk_level=patient.risk_level,
        bed_number=patient.bed_number,
        chief_complaint=patient.chief_complaint,
        symptoms=patient.symptoms,
        allergies=patient.allergies,
        vitals=_vitals_to_schema(patient.vitals),
        notes=patient.notes,
        admitted_at=patient.admitted_at,
        discharged_at=patient.discharged_at,
        created_at=patient.created_at,
        updated_at=patient.updated_at,
    )


def record_to_public(record: MedicalRecord) -> MedicalRecordPublic:
    return MedicalRecordPublic(
        id=str(record.id),
        patient_id=str(record.patient_id),
        record_type=record.record_type,
        title=record.title,
        content=record.content,
        recorded_by=str(record.recorded_by),
        recorded_by_name=record.recorded_by_name,
        recorded_at=record.recorded_at,
        created_at=record.created_at,
    )


async def _get_active_patient(patient_id: str) -> Patient:
    try:
        oid = PydanticObjectId(patient_id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid patient id",
        ) from exc

    patient = await Patient.get(oid)
    if patient is None or patient.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found",
        )
    return patient


async def create_patient(payload: PatientCreate, actor: User) -> PatientPublic:
    existing = await Patient.find_one(Patient.mrn == payload.mrn.upper())
    if existing and not existing.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Patient with MRN '{payload.mrn}' already exists",
        )

    vitals = None
    if payload.vitals is not None:
        data = payload.vitals.model_dump(exclude_none=True)
        if "recorded_at" not in data:
            data["recorded_at"] = datetime.now(timezone.utc)
        vitals = Vitals(**data)

    patient = Patient(
        mrn=payload.mrn.upper().strip(),
        full_name=payload.full_name.strip(),
        age=payload.age,
        gender=payload.gender,
        status=payload.status,
        risk_level=payload.risk_level,
        bed_number=payload.bed_number,
        chief_complaint=payload.chief_complaint,
        symptoms=[s.strip() for s in payload.symptoms if s.strip()],
        allergies=[a.strip() for a in payload.allergies if a.strip()],
        vitals=vitals,
        notes=payload.notes,
        created_by=actor.id,
        updated_by=actor.id,
    )
    await patient.insert()

    await MedicalRecord(
        patient_id=patient.id,
        record_type=RecordType.NOTE,
        title="Admission recorded",
        content=(
            f"Patient admitted. Complaint: {payload.chief_complaint or 'N/A'}. "
            f"Status: {payload.status.value}."
        ),
        recorded_by=actor.id,
        recorded_by_name=actor.full_name,
    ).insert()

    return patient_to_public(patient)


async def list_patients(
    *,
    status_filter: Optional[PatientStatus] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> PatientListResponse:
    query = Patient.find(Patient.is_deleted == False)  # noqa: E712
    if status_filter is not None:
        query = query.find(Patient.status == status_filter)
    if search:
        term = search.strip()
        query = query.find(
            {
                "$or": [
                    {"full_name": {"$regex": term, "$options": "i"}},
                    {"mrn": {"$regex": term, "$options": "i"}},
                    {"bed_number": {"$regex": term, "$options": "i"}},
                ]
            }
        )

    total = await query.count()
    patients = await query.sort(-Patient.updated_at).skip(skip).limit(limit).to_list()
    return PatientListResponse(
        items=[patient_to_public(p) for p in patients],
        total=total,
    )


async def get_patient(patient_id: str) -> PatientPublic:
    patient = await _get_active_patient(patient_id)
    return patient_to_public(patient)


async def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    actor: User,
) -> PatientPublic:
    patient = await _get_active_patient(patient_id)
    data = payload.model_dump(exclude_unset=True)

    if "full_name" in data and data["full_name"]:
        data["full_name"] = data["full_name"].strip()
    if "symptoms" in data and data["symptoms"] is not None:
        data["symptoms"] = [s.strip() for s in data["symptoms"] if s.strip()]
    if "allergies" in data and data["allergies"] is not None:
        data["allergies"] = [a.strip() for a in data["allergies"] if a.strip()]

    if data.get("status") == PatientStatus.DISCHARGED and patient.discharged_at is None:
        patient.discharged_at = datetime.now(timezone.utc)

    for key, value in data.items():
        setattr(patient, key, value)

    patient.updated_by = actor.id
    patient.touch()
    await patient.save()
    return patient_to_public(patient)


async def delete_patient(patient_id: str, actor: User) -> None:
    """Soft-delete a patient (keeps audit trail for academic evaluation)."""
    patient = await _get_active_patient(patient_id)
    patient.is_deleted = True
    patient.updated_by = actor.id
    patient.touch()
    await patient.save()


async def update_vitals(
    patient_id: str,
    payload: VitalsSchema,
    actor: User,
) -> PatientPublic:
    patient = await _get_active_patient(patient_id)
    data = payload.model_dump(exclude_none=True)
    data["recorded_at"] = datetime.now(timezone.utc)
    patient.vitals = Vitals(**data)
    patient.updated_by = actor.id
    patient.touch()
    await patient.save()

    summary_parts = []
    if payload.heart_rate is not None:
        summary_parts.append(f"HR {payload.heart_rate}")
    if payload.spo2 is not None:
        summary_parts.append(f"SpO2 {payload.spo2}%")
    if payload.blood_pressure_systolic is not None:
        summary_parts.append(
            f"BP {payload.blood_pressure_systolic}/"
            f"{payload.blood_pressure_diastolic or '?'}"
        )

    await MedicalRecord(
        patient_id=patient.id,
        record_type=RecordType.VITALS_UPDATE,
        title="Vitals updated",
        content=", ".join(summary_parts) if summary_parts else "Vitals recorded.",
        recorded_by=actor.id,
        recorded_by_name=actor.full_name,
        metadata=data,
    ).insert()

    return patient_to_public(patient)


async def add_medical_record(
    patient_id: str,
    payload: MedicalRecordCreate,
    actor: User,
) -> MedicalRecordPublic:
    patient = await _get_active_patient(patient_id)
    record = MedicalRecord(
        patient_id=patient.id,
        record_type=payload.record_type,
        title=payload.title.strip(),
        content=payload.content.strip(),
        recorded_by=actor.id,
        recorded_by_name=actor.full_name,
    )
    await record.insert()
    return record_to_public(record)


async def get_medical_history(patient_id: str) -> MedicalHistoryResponse:
    patient = await _get_active_patient(patient_id)
    records = (
        await MedicalRecord.find(MedicalRecord.patient_id == patient.id)
        .sort(-MedicalRecord.recorded_at)
        .to_list()
    )
    return MedicalHistoryResponse(
        patient=patient_to_public(patient),
        records=[record_to_public(r) for r in records],
    )
