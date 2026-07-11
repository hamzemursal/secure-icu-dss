"""Patient and medical-record API schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import Gender, PatientStatus, RecordType, RiskLevel


class VitalsSchema(BaseModel):
    heart_rate: Optional[int] = Field(default=None, ge=20, le=300)
    blood_pressure_systolic: Optional[int] = Field(default=None, ge=40, le=300)
    blood_pressure_diastolic: Optional[int] = Field(default=None, ge=20, le=200)
    respiratory_rate: Optional[int] = Field(default=None, ge=4, le=60)
    temperature_c: Optional[float] = Field(default=None, ge=30.0, le=45.0)
    spo2: Optional[int] = Field(default=None, ge=50, le=100)
    glasgow_coma_scale: Optional[int] = Field(default=None, ge=3, le=15)
    recorded_at: Optional[datetime] = None


class PatientCreate(BaseModel):
    mrn: str = Field(..., min_length=3, max_length=40)
    full_name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: Gender = Gender.UNKNOWN
    status: PatientStatus = PatientStatus.ADMITTED
    risk_level: RiskLevel = RiskLevel.MEDIUM
    bed_number: Optional[str] = Field(default=None, max_length=20)
    chief_complaint: Optional[str] = Field(default=None, max_length=500)
    symptoms: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    vitals: Optional[VitalsSchema] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class PatientUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    age: Optional[int] = Field(default=None, ge=0, le=130)
    gender: Optional[Gender] = None
    status: Optional[PatientStatus] = None
    risk_level: Optional[RiskLevel] = None
    bed_number: Optional[str] = Field(default=None, max_length=20)
    chief_complaint: Optional[str] = Field(default=None, max_length=500)
    symptoms: Optional[list[str]] = None
    allergies: Optional[list[str]] = None
    notes: Optional[str] = Field(default=None, max_length=2000)


class PatientPublic(BaseModel):
    id: str
    mrn: str
    full_name: str
    age: int
    gender: Gender
    status: PatientStatus
    risk_level: RiskLevel
    bed_number: Optional[str] = None
    chief_complaint: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    vitals: Optional[VitalsSchema] = None
    notes: Optional[str] = None
    admitted_at: datetime
    discharged_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class PatientListResponse(BaseModel):
    items: list[PatientPublic]
    total: int


class MedicalRecordCreate(BaseModel):
    record_type: RecordType = RecordType.NOTE
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)


class MedicalRecordPublic(BaseModel):
    id: str
    patient_id: str
    record_type: RecordType
    title: str
    content: str
    recorded_by: str
    recorded_by_name: str
    recorded_at: datetime
    created_at: datetime


class MedicalHistoryResponse(BaseModel):
    patient: PatientPublic
    records: list[MedicalRecordPublic]
