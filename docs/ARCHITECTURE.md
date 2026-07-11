# Architecture — Secure ICU Decision Support Agent

## High-level layout

```
secure-icu-dss/
├── frontend/     React 19 + Vite + Tailwind (hospital UI)
├── backend/      FastAPI multi-agent API
└── docs/         Setup, architecture, security notes
```

## Backend layers (Clean Architecture)

| Layer | Path | Responsibility |
|-------|------|----------------|
| Entry | `app/main.py` | App factory, CORS, lifespan |
| Config | `app/config/` | Env-backed settings |
| Database | `app/database/` | Motor + Beanie |
| Models | `app/models/` | MongoDB documents |
| Schemas | `app/schemas/` | API contracts (Pydantic) |
| API | `app/api/` | HTTP routers |
| Services | `app/services/` | Business logic |
| Agents | `app/agents/` | Single-responsibility AI agents |
| Middleware | `app/middleware/` | Rate limit, security headers |
| Utils | `app/utils/` | JWT, sanitizer helpers |

## Agent pipeline (Phase 4)

```
Patient → Security → Intake → Medical Reasoning → Recommendation
       → Verification → Human Approval → Logger → Database
```

Security Agent sanitizes/validates inputs and blocks prompt injection before Gemini.

Agents (one responsibility each):

| Agent | File |
|-------|------|
| Security | `security_agent.py` |
| Patient Intake | `patient_intake_agent.py` |
| Medical Reasoning | `medical_reasoning_agent.py` |
| Recommendation | `recommendation_agent.py` |
| Verification | `verification_agent.py` |
| Human Approval | `human_approval_agent.py` |
| Logger | `logger_agent.py` |

## Status

- **Phase 1:** Project setup — complete
- **Phase 2:** Authentication (JWT + RBAC) — complete
- **Phase 3:** Patient management — complete
- **Phase 4:** Multi-agent AI pipeline — complete
- **Phase 5:** Attack simulation, audit logs, evaluation dashboard — complete
- **Phase 6:** Rate limiting, security headers, deployment docs — complete

## Auth (Phase 2)

- `POST /api/v1/auth/login` — email/password → JWT
- `POST /api/v1/auth/logout` — client discards token (Bearer required)
- `GET /api/v1/auth/me` — current user profile
- Roles: `admin`, `doctor`, `nurse` (RBAC via `require_roles`)

## Patients (Phase 3)

- `POST /api/v1/patients` — create
- `GET /api/v1/patients` — list (search / status filter)
- `GET /api/v1/patients/{id}` — details
- `PATCH /api/v1/patients/{id}` — update
- `DELETE /api/v1/patients/{id}` — soft delete (doctor/admin)
- `PUT /api/v1/patients/{id}/vitals` — update vitals + history entry
- `GET /api/v1/patients/{id}/history` — medical history
- `POST /api/v1/patients/{id}/records` — add history record
- Collections: `patients`, `medical_records`

## Recommendations (Phase 4)

- `POST /api/v1/recommendations/patients/{id}/run` — multi-agent pipeline
- `GET /api/v1/recommendations` — list
- `GET /api/v1/recommendations/{id}` — detail
- `POST /api/v1/recommendations/{id}/review` — doctor approve/reject
- Collections: `recommendations`, `audit_logs`
- Gemini used when `GEMINI_API_KEY` is set; otherwise clinical heuristics

## Security & Evaluation (Phase 5)

- `GET /api/v1/attacks/presets` — injection presets
- `POST /api/v1/attacks/simulate` — with/without defense comparison
- `GET /api/v1/attacks/logs` — attack logs
- `GET /api/v1/audit-logs` — audit trail
- `GET /api/v1/dashboard/stats` — dashboard KPIs
- `GET /api/v1/evaluation/metrics` — success/FP/FN/latency charts
- Collections: `attack_logs`, `audit_logs`

