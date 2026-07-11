"""Evaluation metrics computed from attack logs, recommendations, and audits."""

from datetime import datetime, timezone
from typing import Any

from app.models.attack_log import AttackLog
from app.models.audit_log import AuditLog
from app.models.enums import RecommendationStatus, UserRole
from app.models.patient import Patient
from app.models.recommendation import Recommendation
from app.models.user import User
from app.schemas.evaluation import EvaluationMetrics, DashboardStats


async def get_dashboard_stats() -> DashboardStats:
    patients = await Patient.find(Patient.is_deleted == False).to_list()  # noqa: E712
    critical = [
        p
        for p in patients
        if p.status.value == "critical" or p.risk_level.value == "critical"
    ]
    doctors = await User.find(
        User.role == UserRole.DOCTOR,
        User.is_active == True,  # noqa: E712
    ).count()
    recommendations = await Recommendation.count()
    blocked_attacks = await AttackLog.find(
        AttackLog.defense_enabled == True,  # noqa: E712
        AttackLog.blocked == True,  # noqa: E712
    ).count()
    recent_logs = (
        await AuditLog.find_all().sort(-AuditLog.created_at).limit(8).to_list()
    )

    return DashboardStats(
        patients=len(patients),
        critical_patients=len(critical),
        doctors=doctors,
        recommendations=recommendations,
        blocked_attacks=blocked_attacks,
        system_status="operational",
        recent_logs=[
            {
                "id": str(log.id),
                "action": log.action,
                "actor_name": log.actor_name,
                "created_at": log.created_at.isoformat(),
                "details": log.details,
            }
            for log in recent_logs
        ],
    )


async def get_evaluation_metrics() -> EvaluationMetrics:
    attacks = await AttackLog.find_all().to_list()
    without = [a for a in attacks if not a.defense_enabled]
    with_def = [a for a in attacks if a.defense_enabled]

    def success_rate(rows: list[AttackLog]) -> float:
        if not rows:
            return 0.0
        return round(sum(1 for r in rows if r.attack_succeeded) / len(rows) * 100, 2)

    # False positives: blocked but attack would not have succeeded unprotected
    # False negatives: defense on but attack still succeeded
    fp = 0
    fn = 0
    for row in with_def:
        unprotected_follow = bool((row.unprotected_output or {}).get("followed_injection"))
        if row.blocked and not unprotected_follow:
            fp += 1
        if not row.blocked and row.attack_succeeded:
            fn += 1

    fp_rate = round(fp / len(with_def) * 100, 2) if with_def else 0.0
    fn_rate = round(fn / len(with_def) * 100, 2) if with_def else 0.0

    latencies = [a.latency_ms for a in attacks]
    avg_latency = round(sum(latencies) / len(latencies), 2) if latencies else 0.0

    # Recovery time: avg latency of blocked defended runs (time to detect+block)
    blocked_lat = [a.latency_ms for a in with_def if a.blocked]
    recovery = round(sum(blocked_lat) / len(blocked_lat), 2) if blocked_lat else 0.0

    # Unsafe tool reduction: % drop in attack success after mitigation
    before = success_rate(without) if without else success_rate(
        [a for a in attacks if (a.unprotected_output or {}).get("followed_injection")]
    )
    # Better: compare followed_injection in unprotected vs protected across all sims
    unprotected_successes = sum(
        1 for a in attacks if (a.unprotected_output or {}).get("followed_injection")
    )
    protected_successes = sum(
        1 for a in with_def if a.attack_succeeded
    )
    if attacks:
        before_rate = round(unprotected_successes / len(attacks) * 100, 2)
    else:
        before_rate = 0.0
    after_rate = success_rate(with_def)
    unsafe_reduction = round(max(before_rate - after_rate, 0.0), 2)

    # Human approval accuracy: approved/rejected among reviewed (non-blocked)
    reviewed = await Recommendation.find(
        {
            "status": {
                "$in": [
                    RecommendationStatus.APPROVED.value,
                    RecommendationStatus.REJECTED.value,
                ]
            }
        }
    ).to_list()
    # Academic proxy: approvals that kept human_required / disclaimer intact = accurate
    accurate = 0
    for rec in reviewed:
        if rec.disclaimer and rec.reviewed_by_name:
            accurate += 1
    approval_accuracy = (
        round(accurate / len(reviewed) * 100, 2) if reviewed else 100.0
    )

    # Chart series
    attack_success_series = [
        {"label": "Before mitigation", "value": before_rate if attacks else success_rate(without)},
        {"label": "After mitigation", "value": after_rate},
    ]

    return EvaluationMetrics(
        attack_success_before=before_rate if attacks else success_rate(without),
        attack_success_after=after_rate,
        false_positive_rate=fp_rate,
        false_negative_rate=fn_rate,
        avg_latency_ms=avg_latency,
        recovery_time_ms=recovery,
        unsafe_tool_reduction=unsafe_reduction,
        human_approval_accuracy=approval_accuracy,
        total_attacks=len(attacks),
        total_blocked=sum(1 for a in with_def if a.blocked),
        total_recommendations=await Recommendation.count(),
        attack_success_series=attack_success_series,
        latency_series=[
            {
                "label": a.attack_name[:24],
                "value": round(a.latency_ms, 2),
                "defense": a.defense_enabled,
            }
            for a in attacks[:20]
        ],
        generated_at=datetime.now(timezone.utc),
    )


async def list_audit_logs(
    *,
    limit: int = 100,
    action: str | None = None,
) -> list[dict[str, Any]]:
    query = AuditLog.find_all()
    if action:
        query = AuditLog.find(AuditLog.action == action)
    docs = await query.sort(-AuditLog.created_at).limit(limit).to_list()
    return [
        {
            "id": str(d.id),
            "action": d.action,
            "actor_name": d.actor_name,
            "actor_role": d.actor_role,
            "patient_id": str(d.patient_id) if d.patient_id else None,
            "resource_type": d.resource_type,
            "resource_id": d.resource_id,
            "details": d.details,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]
