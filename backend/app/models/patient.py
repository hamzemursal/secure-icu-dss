"""Patient document — ICU admissions, vitals, and symptoms."""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import BaseModel, Field

from app.models.enums import Gender, PatientStatus, RiskLevel


class Vitals(BaseModel):
    """Latest bedside vital signs."""

    heart_rate: Optional[int] = Field(default=None, ge=20, le=300)
    blood_pressure_systolic: Optional[int] = Field(default=None, ge=40, le=300)
    blood_pressure_diastolic: Optional[int] = Field(default=None, ge=20, le=200)
    respiratory_rate: Optional[int] = Field(default=None, ge=4, le=60)
    temperature_c: Optional[float] = Field(default=None, ge=30.0, le=45.0)
    spo2: Optional[int] = Field(default=None, ge=50, le=100)
    glasgow_coma_scale: Optional[int] = Field(default=None, ge=3, le=15)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Patient(Document):
    """Hospital patient under ICU / ward care."""

    mrn: Indexed(str, unique=True)  # type: ignore[valid-type]
    full_name: str = Field(..., min_length=2, max_length=120)
    age: int = Field(..., ge=0, le=130)
    gender: Gender = Gender.UNKNOWN
    status: PatientStatus = PatientStatus.ADMITTED
    risk_level: RiskLevel = RiskLevel.MEDIUM
    bed_number: Optional[str] = Field(default=None, max_length=20)
    chief_complaint: Optional[str] = Field(default=None, max_length=500)
    symptoms: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    vitals: Optional[Vitals] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    admitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    discharged_at: Optional[datetime] = None
    created_by: PydanticObjectId
    updated_by: Optional[PydanticObjectId] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_deleted: bool = False

    class Settings:
        name = "patients"
        indexes = [
            "status",
            "risk_level",
            "is_deleted",
            "admitted_at",
        ]

    def touch(self) -> None:
        self.updated_at = datetime.now(timezone.utc)
