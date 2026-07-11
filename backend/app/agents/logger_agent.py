"""Logger Agent — persist pipeline audit events."""

import time
from datetime import datetime, timezone
from typing import Any

from beanie import PydanticObjectId

from app.agents.base import AgentContext, AgentResult, BaseAgent
from app.models.audit_log import AuditLog


class LoggerAgent(BaseAgent):
    """Single responsibility: write structured audit logs for the pipeline."""

    name = "logger_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        entries: list[dict[str, Any]] = []

        for step in context.pipeline_trace:
            entry = AuditLog(
                action="agent_step",
                actor_id=PydanticObjectId(context.actor_id),
                actor_name=context.actor_name,
                actor_role=context.actor_role,
                patient_id=PydanticObjectId(context.patient_id),
                resource_type="recommendation_pipeline",
                details={
                    "agent": step.get("agent"),
                    "success": step.get("success"),
                    "message": step.get("message"),
                    "duration_ms": step.get("duration_ms"),
                    "blocked": context.blocked,
                    "block_reason": context.block_reason,
                    "security_risk_score": (context.security or {}).get("risk_score"),
                },
                created_at=datetime.now(timezone.utc),
            )
            await entry.insert()
            entries.append({"id": str(entry.id), "agent": step.get("agent")})

        # Summary log
        summary = AuditLog(
            action="pipeline_complete" if not context.blocked else "pipeline_blocked",
            actor_id=PydanticObjectId(context.actor_id),
            actor_name=context.actor_name,
            actor_role=context.actor_role,
            patient_id=PydanticObjectId(context.patient_id),
            resource_type="recommendation_pipeline",
            details={
                "blocked": context.blocked,
                "block_reason": context.block_reason,
                "steps": len(context.pipeline_trace),
                "suggested_risk": (context.recommendation or {}).get("suggested_risk_level"),
                "approval_status": (context.approval or {}).get("status"),
            },
        )
        await summary.insert()
        entries.append({"id": str(summary.id), "agent": "summary"})

        context.logs = entries
        result = AgentResult(
            agent=self.name,
            success=True,
            message=f"Wrote {len(entries)} audit log entries",
            data={"log_count": len(entries)},
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        # Do not re-append to pipeline_trace before logging in a loop — add after
        context.pipeline_trace.append(
            {
                "agent": result.agent,
                "success": result.success,
                "message": result.message,
                "duration_ms": result.duration_ms,
                "timestamp": result.timestamp.isoformat(),
            }
        )
        return result
