"""Medical Reasoning Agent — clinical assessment from intake + Gemini/heuristics."""

import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent
from app.services.gemini_client import get_gemini_client


def _heuristic_reasoning(intake: dict[str, Any]) -> dict[str, Any]:
    """Deterministic ICU-style heuristics when Gemini is unavailable."""
    vitals = intake.get("vitals") or {}
    flags: list[str] = []
    severity = "moderate"

    hr = vitals.get("heart_rate")
    spo2 = vitals.get("spo2")
    sbp = vitals.get("blood_pressure_systolic")
    rr = vitals.get("respiratory_rate")
    gcs = vitals.get("glasgow_coma_scale")
    temp = vitals.get("temperature_c")

    if spo2 is not None and spo2 < 90:
        flags.append("Hypoxemia (SpO2 < 90%)")
        severity = "critical"
    elif spo2 is not None and spo2 < 94:
        flags.append("Borderline oxygenation")
        severity = "high" if severity != "critical" else severity

    if hr is not None and (hr > 120 or hr < 50):
        flags.append("Abnormal heart rate")
        if severity == "moderate":
            severity = "high"

    if sbp is not None and sbp < 90:
        flags.append("Hypotension")
        severity = "critical"

    if rr is not None and (rr > 28 or rr < 8):
        flags.append("Abnormal respiratory rate")
        if severity == "moderate":
            severity = "high"

    if gcs is not None and gcs <= 8:
        flags.append("Low Glasgow Coma Scale")
        severity = "critical"

    if temp is not None and temp >= 39.0:
        flags.append("High fever")

    if intake.get("status") == "critical":
        severity = "critical"
        flags.append("Chart status marked critical")

    symptoms = intake.get("symptoms") or []
    if any("chest" in str(s).lower() for s in symptoms):
        flags.append("Chest-related symptom reported")

    summary = (
        f"Heuristic assessment for {intake.get('full_name', 'patient')}: "
        f"severity={severity}. "
        + ("; ".join(flags) if flags else "No major vital red flags from available data.")
    )

    return {
        "source": "heuristic",
        "severity": severity,
        "clinical_flags": flags,
        "differential": [
            "Requires clinician review of full chart",
            "Possible respiratory compromise" if spo2 and spo2 < 94 else "Stable oxygenation not confirmed",
        ],
        "summary": summary,
        "disclaimer": "Heuristic support only — not a diagnosis. Final decision is the doctor's.",
    }


class MedicalReasoningAgent(BaseAgent):
    """Single responsibility: produce clinical reasoning from structured intake."""

    name = "medical_reasoning_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        intake = context.intake
        client = get_gemini_client()
        reasoning: dict[str, Any]

        if client.enabled:
            prompt = f"""
Analyze this ICU patient intake and return JSON with keys:
severity (low|moderate|high|critical), clinical_flags (string[]),
differential (string[]), summary (string), disclaimer (string).

Patient intake JSON:
{intake}

Remember: recommendations only; do not claim to replace the physician.
"""
            try:
                reasoning = await client.generate_json(prompt)
                reasoning["source"] = "gemini"
            except Exception:  # noqa: BLE001
                reasoning = _heuristic_reasoning(intake)
                reasoning["fallback_reason"] = "gemini_error"
        else:
            reasoning = _heuristic_reasoning(intake)

        context.reasoning = reasoning
        result = AgentResult(
            agent=self.name,
            success=True,
            message=f"Reasoning complete via {reasoning.get('source')}",
            data={"severity": reasoning.get("severity"), "source": reasoning.get("source")},
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result
