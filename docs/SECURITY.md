# Security Design — Secure ICU Decision Support Agent

## Design principle

The system provides **decision support only**. It never replaces a clinician. Every AI recommendation requires **human doctor approval** before it is considered accepted.

---

## Controls implemented

| Control | Implementation |
|---------|----------------|
| Authentication | JWT (HS256), bcrypt password hashes |
| Authorization | RBAC — Admin / Doctor / Nurse |
| Input validation | Pydantic schemas on all write endpoints |
| Prompt sanitizer | Strip control chars / angle brackets; length cap |
| Prompt validator | Regex injection pattern library |
| Risk score | Weighted pattern score vs `PROMPT_INJECTION_THRESHOLD` |
| Human-in-the-loop | `HumanApprovalAgent` → `pending_approval` only |
| Verification | Blocks unsafe phrases; elevates under-triage |
| Audit logging | `audit_logs` for agent steps, reviews, attacks |
| Rate limiting | SlowAPI default per-IP limit |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options`, CSP, etc. |
| Soft delete | Patients retained for audit trail |

---

## Defense pipeline (before Gemini)

```
Raw input
  → Prompt Sanitizer
  → Prompt Validator (injection patterns)
  → Risk Score
  → Block if score ≥ threshold
  → (only if clear) Gemini / heuristics
  → Verification Agent
  → Human Approval (doctor)
  → Logger → Database
```

Malicious prompts must **never** reach Gemini when defense is enabled.

---

## Attack simulation (academic)

The Attack Simulation page compares:

1. **Without protection** — naive model that follows injected instructions (demo only).
2. **With protection** — Security Agent blocks high-risk payloads.

Presets include ignore-previous-instructions, force discharge, ignore hospital rules, and always-LOW-RISK.

---

## Roles

| Role | Sensitive actions |
|------|-------------------|
| Nurse | Admit patients, vitals, view recommendations |
| Doctor | Approve/reject AI recommendations, soft-delete patients |
| Admin | Same as doctor for clinical gates + full audit visibility |

---

## Disclaimer

For university demonstration of agentic AI + cybersecurity concepts. **Not for clinical use.**
