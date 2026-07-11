"""Base contracts for single-responsibility agents."""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, Field


class AgentContext(BaseModel):
    """Shared mutable state passed through the agent pipeline."""

    patient_id: str
    patient_snapshot: dict[str, Any] = Field(default_factory=dict)
    actor_id: str
    actor_name: str
    actor_role: str
    free_text_inputs: list[str] = Field(default_factory=list)
    extra_notes: Optional[str] = None

    # Filled by agents
    security: dict[str, Any] = Field(default_factory=dict)
    intake: dict[str, Any] = Field(default_factory=dict)
    reasoning: dict[str, Any] = Field(default_factory=dict)
    recommendation: dict[str, Any] = Field(default_factory=dict)
    verification: dict[str, Any] = Field(default_factory=dict)
    approval: dict[str, Any] = Field(default_factory=dict)
    logs: list[dict[str, Any]] = Field(default_factory=list)
    blocked: bool = False
    block_reason: Optional[str] = None
    pipeline_trace: list[dict[str, Any]] = Field(default_factory=list)

    model_config = {"arbitrary_types_allowed": True}


class AgentResult(BaseModel):
    """Standard result envelope from an agent step."""

    agent: str
    success: bool = True
    message: str = ""
    data: dict[str, Any] = Field(default_factory=dict)
    duration_ms: float = 0.0
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BaseAgent(ABC):
    """Every agent has exactly one responsibility."""

    name: str = "base_agent"

    @abstractmethod
    async def run(self, context: AgentContext) -> AgentResult:
        """Execute this agent's step and update context."""

    def _trace(self, context: AgentContext, result: AgentResult) -> None:
        context.pipeline_trace.append(
            {
                "agent": result.agent,
                "success": result.success,
                "message": result.message,
                "duration_ms": result.duration_ms,
                "timestamp": result.timestamp.isoformat(),
            }
        )
