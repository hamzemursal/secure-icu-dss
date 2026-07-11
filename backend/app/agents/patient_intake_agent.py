"""Patient Intake Agent — normalize patient chart into structured intake."""

import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent


class PatientIntakeAgent(BaseAgent):
    """Single responsibility: structure patient data for downstream agents."""

    name = "patient_intake_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        snap = context.patient_snapshot
        vitals = snap.get("vitals") or {}

        intake: dict[str, Any] = {
            "mrn": snap.get("mrn"),
            "full_name": snap.get("full_name"),
            "age": snap.get("age"),
            "gender": snap.get("gender"),
            "status": snap.get("status"),
            "risk_level": snap.get("risk_level"),
            "bed_number": snap.get("bed_number"),
            "chief_complaint": snap.get("chief_complaint"),
            "symptoms": snap.get("symptoms") or [],
            "allergies": snap.get("allergies") or [],
            "vitals": {
                "heart_rate": vitals.get("heart_rate"),
                "blood_pressure_systolic": vitals.get("blood_pressure_systolic"),
                "blood_pressure_diastolic": vitals.get("blood_pressure_diastolic"),
                "respiratory_rate": vitals.get("respiratory_rate"),
                "temperature_c": vitals.get("temperature_c"),
                "spo2": vitals.get("spo2"),
                "glasgow_coma_scale": vitals.get("glasgow_coma_scale"),
            },
            "notes": snap.get("notes"),
            "sanitized_notes": (context.security.get("sanitized_inputs") or [None])[-1]
            if context.security
            else snap.get("notes"),
        }
        context.intake = intake

        result = AgentResult(
            agent=self.name,
            success=True,
            message="Patient intake structured successfully",
            data={"fields_captured": len([k for k, v in intake.items() if v not in (None, [], {})])},
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result
