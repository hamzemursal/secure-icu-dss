"""Human Approval Agent — marks recommendation as pending clinician review."""

import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent


class HumanApprovalAgent(BaseAgent):
    """
    Single responsibility: enforce human-in-the-loop gate.

    Does NOT auto-approve. Sets status to pending_approval for a doctor.
    """

    name = "human_approval_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        approval: dict[str, Any] = {
            "status": "pending_approval",
            "requires_role": "doctor",
            "message": (
                "Recommendation awaiting human doctor approval. "
                "AI must not execute clinical actions."
            ),
            "requested_by": context.actor_name,
            "requested_by_role": context.actor_role,
        }
        context.approval = approval

        result = AgentResult(
            agent=self.name,
            success=True,
            message="Queued for human doctor approval",
            data=approval,
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result
