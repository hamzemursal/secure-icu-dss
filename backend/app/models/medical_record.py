"""Medical record entries linked to a patient."""

from datetime import datetime, timezone
from typing import Optional

from beanie import Document, Indexed, PydanticObjectId
from pydantic import Field

from app.models.enums import RecordType


class MedicalRecord(Document):
    """Chronological clinical history entry for a patient."""

    patient_id: Indexed(PydanticObjectId)  # type: ignore[valid-type]
    record_type: RecordType = RecordType.NOTE
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=1, max_length=5000)
    recorded_by: PydanticObjectId
    recorded_by_name: str = Field(..., max_length=120)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "medical_records"
        indexes = [
            "record_type",
            "recorded_at",
        ]
