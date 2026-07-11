"""Shared domain enumerations."""

from enum import Enum


class UserRole(str, Enum):
    """RBAC roles for the Secure ICU DSS."""

    ADMIN = "admin"
    DOCTOR = "doctor"
    NURSE = "nurse"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    UNKNOWN = "unknown"


class PatientStatus(str, Enum):
    ADMITTED = "admitted"
    CRITICAL = "critical"
    STABLE = "stable"
    DISCHARGED = "discharged"
    TRANSFERRED = "transferred"


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RecordType(str, Enum):
    NOTE = "note"
    DIAGNOSIS = "diagnosis"
    LAB = "lab"
    PROCEDURE = "procedure"
    MEDICATION = "medication"
    VITALS_UPDATE = "vitals_update"
    OTHER = "other"


class RecommendationStatus(str, Enum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    REJECTED = "rejected"
    BLOCKED = "blocked"
