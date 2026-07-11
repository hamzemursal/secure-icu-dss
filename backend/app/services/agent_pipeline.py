"""Orchestrates the multi-agent ICU decision-support pipeline."""

from beanie import PydanticObjectId
from fastapi import HTTPException, status

from app.agents.human_approval_agent import HumanApprovalAgent
from app.agents.logger_agent import LoggerAgent
from app.agents.medical_reasoning_agent import MedicalReasoningAgent
from app.agents.patient_intake_agent import PatientIntakeAgent
from app.agents.recommendation_agent import RecommendationAgent
from app.agents.security_agent import SecurityAgent
from app.agents.verification_agent import VerificationAgent
from app.agents.base import AgentContext
from app.models import Patient, User
from app.models.enums import RecommendationStatus, RiskLevel
from app.models.recommendation import Recommendation
from app.schemas.recommendation import (
    RecommendationPublic,
    RunRecommendationRequest,
)


def recommendation_to_public(doc: Recommendation) -> RecommendationPublic:
    return RecommendationPublic(
        id=str(doc.id),
        patient_id=str(doc.patient_id),
        patient_mrn=doc.patient_mrn,
        patient_name=doc.patient_name,
        status=doc.status,
        suggested_risk_level=doc.suggested_risk_level,
        actions=doc.actions,
        monitoring=doc.monitoring,
        rationale=doc.rationale,
        disclaimer=doc.disclaimer,
        reasoning_summary=doc.reasoning_summary,
        clinical_flags=doc.clinical_flags,
        pipeline_trace=doc.pipeline_trace,
        security=doc.security,
        verification=doc.verification,
        source=doc.source,
        created_by_name=doc.created_by_name,
        reviewed_by_name=doc.reviewed_by_name,
        review_notes=doc.review_notes,
        reviewed_at=doc.reviewed_at,
        blocked=doc.blocked,
        block_reason=doc.block_reason,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


async def _load_patient(patient_id: str) -> Patient:
    try:
        oid = PydanticObjectId(patient_id)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid patient id") from exc
    patient = await Patient.get(oid)
    if patient is None or patient.is_deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return patient


def _patient_snapshot(patient: Patient) -> dict:
    return {
        "mrn": patient.mrn,
        "full_name": patient.full_name,
        "age": patient.age,
        "gender": patient.gender.value if patient.gender else None,
        "status": patient.status.value if patient.status else None,
        "risk_level": patient.risk_level.value if patient.risk_level else None,
        "bed_number": patient.bed_number,
        "chief_complaint": patient.chief_complaint,
        "symptoms": patient.symptoms,
        "allergies": patient.allergies,
        "vitals": patient.vitals.model_dump() if patient.vitals else {},
        "notes": patient.notes,
    }


def _parse_risk(value: str | None) -> RiskLevel:
    mapping = {
        "low": RiskLevel.LOW,
        "medium": RiskLevel.MEDIUM,
        "moderate": RiskLevel.MEDIUM,
        "high": RiskLevel.HIGH,
        "critical": RiskLevel.CRITICAL,
    }
    return mapping.get((value or "medium").lower(), RiskLevel.MEDIUM)


async def run_recommendation_pipeline(
    patient_id: str,
    actor: User,
    body: RunRecommendationRequest,
) -> RecommendationPublic:
    """
    Pipeline:
    Security → Intake → Reasoning → Recommendation → Verification
    → Human Approval → Logger → Database
    """
    patient = await _load_patient(patient_id)
    snapshot = _patient_snapshot(patient)

    free_texts = [
        *(patient.symptoms or []),
        patient.chief_complaint or "",
        patient.notes or "",
        body.extra_notes or "",
    ]

    context = AgentContext(
        patient_id=str(patient.id),
        patient_snapshot=snapshot,
        actor_id=str(actor.id),
        actor_name=actor.full_name,
        actor_role=actor.role.value,
        free_text_inputs=[t for t in free_texts if t],
        extra_notes=body.extra_notes,
    )

    security = SecurityAgent()
    intake = PatientIntakeAgent()
    reasoning = MedicalReasoningAgent()
    recommendation_agent = RecommendationAgent()
    verification = VerificationAgent()
    approval = HumanApprovalAgent()
    logger_agent = LoggerAgent()

    # 1. Security first — malicious prompts never reach Gemini
    await security.run(context)
    if context.blocked:
        await logger_agent.run(context)
        doc = Recommendation(
            patient_id=patient.id,
            patient_mrn=patient.mrn,
            patient_name=patient.full_name,
            status=RecommendationStatus.BLOCKED,
            suggested_risk_level=patient.risk_level,
            actions=[],
            monitoring=[],
            rationale="Pipeline blocked by Security Agent.",
            reasoning_summary=None,
            clinical_flags=[],
            pipeline_trace=context.pipeline_trace,
            security=context.security,
            verification={},
            source="blocked",
            created_by=actor.id,
            created_by_name=actor.full_name,
            blocked=True,
            block_reason=context.block_reason,
        )
        await doc.insert()
        return recommendation_to_public(doc)

    await intake.run(context)
    await reasoning.run(context)
    await recommendation_agent.run(context)
    await verification.run(context)

    if context.blocked:
        await logger_agent.run(context)
        doc = Recommendation(
            patient_id=patient.id,
            patient_mrn=patient.mrn,
            patient_name=patient.full_name,
            status=RecommendationStatus.BLOCKED,
            suggested_risk_level=_parse_risk(
                (context.recommendation or {}).get("suggested_risk_level")
            ),
            actions=(context.recommendation or {}).get("actions") or [],
            monitoring=(context.recommendation or {}).get("monitoring") or [],
            rationale=(context.recommendation or {}).get("rationale") or "",
            disclaimer=(context.recommendation or {}).get("disclaimer") or "",
            reasoning_summary=(context.reasoning or {}).get("summary"),
            clinical_flags=(context.reasoning or {}).get("clinical_flags") or [],
            pipeline_trace=context.pipeline_trace,
            security=context.security,
            verification=context.verification,
            source=(context.recommendation or {}).get("source") or "unknown",
            created_by=actor.id,
            created_by_name=actor.full_name,
            blocked=True,
            block_reason=context.block_reason,
        )
        await doc.insert()
        return recommendation_to_public(doc)

    await approval.run(context)
    await logger_agent.run(context)

    rec = context.recommendation or {}
    doc = Recommendation(
        patient_id=patient.id,
        patient_mrn=patient.mrn,
        patient_name=patient.full_name,
        status=RecommendationStatus.PENDING_APPROVAL,
        suggested_risk_level=_parse_risk(rec.get("suggested_risk_level")),
        actions=rec.get("actions") or [],
        monitoring=rec.get("monitoring") or [],
        rationale=rec.get("rationale") or "",
        disclaimer=rec.get("disclaimer")
        or "AI recommendation only. Final medical decision belongs to the doctor.",
        reasoning_summary=(context.reasoning or {}).get("summary"),
        clinical_flags=(context.reasoning or {}).get("clinical_flags") or [],
        pipeline_trace=context.pipeline_trace,
        security=context.security,
        verification=context.verification,
        source=rec.get("source") or "unknown",
        created_by=actor.id,
        created_by_name=actor.full_name,
        blocked=False,
    )
    await doc.insert()
    return recommendation_to_public(doc)


async def list_recommendations(
    *,
    patient_id: str | None = None,
    status_filter: RecommendationStatus | None = None,
    limit: int = 50,
) -> list[RecommendationPublic]:
    filters = []
    if patient_id:
        try:
            filters.append(Recommendation.patient_id == PydanticObjectId(patient_id))
        except Exception as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid patient id") from exc
    if status_filter:
        filters.append(Recommendation.status == status_filter)

    query = Recommendation.find(*filters) if filters else Recommendation.find_all()
    docs = await query.sort(-Recommendation.created_at).limit(limit).to_list()
    return [recommendation_to_public(d) for d in docs]


async def get_recommendation(rec_id: str) -> RecommendationPublic:
    try:
        oid = PydanticObjectId(rec_id)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid id") from exc
    doc = await Recommendation.get(oid)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recommendation not found")
    return recommendation_to_public(doc)


async def review_recommendation(
    rec_id: str,
    actor: User,
    *,
    approve: bool,
    notes: str | None,
) -> RecommendationPublic:
    from datetime import datetime, timezone

    from app.models.audit_log import AuditLog
    from app.models.enums import UserRole

    if actor.role not in {UserRole.DOCTOR, UserRole.ADMIN}:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "Only doctors (or admins) may approve/reject recommendations",
        )

    try:
        oid = PydanticObjectId(rec_id)
    except Exception as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid id") from exc

    doc = await Recommendation.get(oid)
    if doc is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Recommendation not found")
    if doc.status != RecommendationStatus.PENDING_APPROVAL:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Recommendation is already {doc.status.value}",
        )

    doc.status = (
        RecommendationStatus.APPROVED if approve else RecommendationStatus.REJECTED
    )
    doc.reviewed_by = actor.id
    doc.reviewed_by_name = actor.full_name
    doc.review_notes = notes
    doc.reviewed_at = datetime.now(timezone.utc)
    doc.updated_at = datetime.now(timezone.utc)
    await doc.save()

    await AuditLog(
        action="recommendation_approved" if approve else "recommendation_rejected",
        actor_id=actor.id,
        actor_name=actor.full_name,
        actor_role=actor.role.value,
        patient_id=doc.patient_id,
        resource_type="recommendation",
        resource_id=str(doc.id),
        details={"notes": notes, "status": doc.status.value},
    ).insert()

    return recommendation_to_public(doc)
