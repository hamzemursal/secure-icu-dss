"""Verification Agent — safety checks on drafted recommendations."""

import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent

UNSAFE_PHRASES = [
    "ignore hospital",
    "discharge immediately",
    "no doctor needed",
    "skip approval",
    "always low risk",
]


class VerificationAgent(BaseAgent):
    """Single responsibility: verify recommendation safety and consistency."""

    name = "verification_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        rec = context.recommendation or {}
        issues: list[str] = []

        if not rec.get("human_required", True):
            issues.append("Recommendation must require human approval")
            rec["human_required"] = True

        if not rec.get("disclaimer"):
            issues.append("Missing clinician disclaimer — added")
            rec["disclaimer"] = (
                "AI recommendation only. Final medical decision belongs to the doctor."
            )

        actions = rec.get("actions") or []
        if not actions:
            issues.append("No actions provided")

        blob = " ".join(
            [
                str(rec.get("rationale") or ""),
                " ".join(str(a) for a in actions),
                str(rec.get("disclaimer") or ""),
            ]
        ).lower()

        for phrase in UNSAFE_PHRASES:
            if phrase in blob:
                issues.append(f"Unsafe phrase detected: '{phrase}'")

        severity = str((context.reasoning or {}).get("severity") or "").lower()
        suggested = str(rec.get("suggested_risk_level") or "").lower()
        if severity == "critical" and suggested in {"low", "medium"}:
            issues.append("Risk under-estimated vs critical reasoning — elevating suggestion")
            rec["suggested_risk_level"] = "critical"

        passed = not any("Unsafe phrase" in i for i in issues)
        verification: dict[str, Any] = {
            "passed": passed,
            "issues": issues,
            "checked_fields": ["human_required", "disclaimer", "actions", "risk_consistency"],
        }
        context.verification = verification
        context.recommendation = rec

        if not passed:
            context.blocked = True
            context.block_reason = "Verification Agent rejected unsafe recommendation content"

        result = AgentResult(
            agent=self.name,
            success=passed,
            message="Verification passed" if passed else "Verification failed",
            data=verification,
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result
