"""Recommendation Agent — actionable support suggestions (not orders)."""

import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent
from app.services.gemini_client import get_gemini_client


def _heuristic_recommendations(reasoning: dict[str, Any], intake: dict[str, Any]) -> dict[str, Any]:
    severity = str(reasoning.get("severity") or "moderate").lower()
    actions: list[str] = [
        "Continue continuous monitoring per ICU protocol",
        "Review latest labs and imaging with attending physician",
    ]
    suggested_risk = "medium"

    if severity in {"high", "critical"}:
        suggested_risk = "critical" if severity == "critical" else "high"
        actions.extend(
            [
                "Escalate to attending ICU physician promptly",
                "Reassess airway, breathing, circulation",
                "Consider ABG / lactate if not recently obtained",
            ]
        )
    elif severity == "low":
        suggested_risk = "low"
        actions.append("Maintain current supportive care pending clinician confirmation")
    else:
        actions.append("Repeat vitals within protocol interval")

    allergies = intake.get("allergies") or []
    if allergies:
        actions.append(f"Verify allergy list before any medication changes: {', '.join(allergies)}")

    return {
        "source": "heuristic",
        "suggested_risk_level": suggested_risk,
        "actions": actions,
        "monitoring": [
            "SpO2 continuous",
            "Cardiac telemetry",
            "Hourly urine output if indicated",
        ],
        "rationale": reasoning.get("summary") or "Based on structured intake and flags.",
        "human_required": True,
        "disclaimer": (
            "AI recommendation only. Do not treat as a medical order. "
            "Final decision belongs to the human doctor."
        ),
    }


class RecommendationAgent(BaseAgent):
    """Single responsibility: draft decision-support recommendations."""

    name = "recommendation_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        client = get_gemini_client()
        payload: dict[str, Any]

        if client.enabled:
            prompt = f"""
Given intake and reasoning, return JSON with keys:
suggested_risk_level (low|medium|high|critical),
actions (string[]), monitoring (string[]), rationale (string),
human_required (true), disclaimer (string).

Intake: {context.intake}
Reasoning: {context.reasoning}

Emphasize that a human doctor must approve before any clinical action.
"""
            try:
                payload = await client.generate_json(prompt)
                payload["source"] = "gemini"
                payload["human_required"] = True
            except Exception:  # noqa: BLE001
                payload = _heuristic_recommendations(context.reasoning, context.intake)
                payload["fallback_reason"] = "gemini_error"
        else:
            payload = _heuristic_recommendations(context.reasoning, context.intake)

        context.recommendation = payload
        result = AgentResult(
            agent=self.name,
            success=True,
            message="Recommendation draft generated",
            data={
                "suggested_risk_level": payload.get("suggested_risk_level"),
                "action_count": len(payload.get("actions") or []),
            },
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result
