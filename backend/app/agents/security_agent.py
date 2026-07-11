"""
Security Agent — prompt sanitizer, validator, and injection risk scoring.

Malicious prompts must never reach Gemini. This agent runs first.
"""

import re
import time
from typing import Any

from app.agents.base import AgentContext, AgentResult, BaseAgent
from app.config import get_settings

# Common prompt-injection / jailbreak patterns (academic demo set).
INJECTION_PATTERNS: list[tuple[str, float, str]] = [
    (r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions?", 0.95, "ignore_previous"),
    (r"disregard\s+(all\s+)?(previous|prior|hospital)\s+(instructions?|rules?)", 0.9, "disregard_rules"),
    (r"you\s+are\s+now\s+(dan|unrestricted|jailbroken)", 0.95, "jailbreak_persona"),
    (r"always\s+classify\s+(everyone|all\s+patients?)\s+as\s+low\s+risk", 0.9, "force_low_risk"),
    (r"patient\s+is\s+healthy\.?\s*discharge\s+immediately", 0.85, "force_discharge"),
    (r"discharge\s+immediately", 0.7, "force_discharge"),
    (r"ignore\s+all\s+hospital\s+rules", 0.95, "ignore_hospital_rules"),
    (r"do\s+not\s+follow\s+(safety|medical|hospital)\s+(rules?|guidelines?)", 0.9, "bypass_safety"),
    (r"system\s*prompt", 0.6, "system_prompt_probe"),
    (r"<\s*/?\s*system\s*>", 0.8, "system_tag"),
    (r"reveal\s+(your|the)\s+(system|hidden)\s+prompt", 0.85, "prompt_leak"),
]


class SecurityAgent(BaseAgent):
    """Sanitize → validate → risk score. Block high-risk inputs."""

    name = "security_agent"

    async def run(self, context: AgentContext) -> AgentResult:
        started = time.perf_counter()
        settings = get_settings()
        texts = list(context.free_text_inputs)
        if context.extra_notes:
            texts.append(context.extra_notes)

        findings: list[dict[str, Any]] = []
        max_score = 0.0
        sanitized_parts: list[str] = []

        for raw in texts:
            cleaned = self.sanitize(raw)
            sanitized_parts.append(cleaned)
            score, hits = self.score_injection(cleaned)
            max_score = max(max_score, score)
            findings.extend(hits)

        blocked = max_score >= settings.prompt_injection_threshold
        security_payload = {
            "risk_score": round(max_score, 3),
            "threshold": settings.prompt_injection_threshold,
            "blocked": blocked,
            "findings": findings,
            "sanitized_inputs": sanitized_parts,
            "original_inputs": texts,
        }
        context.security = security_payload
        if blocked:
            context.blocked = True
            context.block_reason = (
                f"Prompt injection risk score {max_score:.2f} "
                f"exceeds threshold {settings.prompt_injection_threshold:.2f}"
            )

        result = AgentResult(
            agent=self.name,
            success=not blocked,
            message=(
                "Input blocked by Security Agent"
                if blocked
                else "Input cleared by Security Agent"
            ),
            data=security_payload,
            duration_ms=(time.perf_counter() - started) * 1000,
        )
        self._trace(context, result)
        return result

    @staticmethod
    def sanitize(text: str) -> str:
        """Strip control chars and normalize whitespace; keep clinical content."""
        if not text:
            return ""
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", text)
        cleaned = re.sub(r"[<>]", " ", cleaned)
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned[:4000]

    @staticmethod
    def score_injection(text: str) -> tuple[float, list[dict[str, Any]]]:
        """Return max pattern score and matched findings."""
        lowered = text.lower()
        hits: list[dict[str, Any]] = []
        max_score = 0.0
        for pattern, weight, label in INJECTION_PATTERNS:
            if re.search(pattern, lowered, flags=re.IGNORECASE):
                max_score = max(max_score, weight)
                hits.append({"pattern": label, "weight": weight})
        return max_score, hits
