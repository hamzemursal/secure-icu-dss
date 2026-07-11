# Secure ICU Decision Support Agent

An **agentic AI** system for ICU decision **support** with **prompt-injection detection** and **human-in-the-loop** validation.

> **Important:** This system does **not** replace doctors. It only provides recommendations. The final medical decision always belongs to a human clinician.

## Features

- Multi-agent pipeline: Security → Intake → Reasoning → Recommendation → Verification → Doctor Approval → Logger
- Prompt injection **attack simulation** (with vs without defense)
- JWT authentication + RBAC (Admin, Doctor, Nurse)
- Patient management, vitals, medical history
- AI recommendations with mandatory doctor review
- Audit logs + evaluation metrics (Recharts)
- Rate limiting + security headers
- Hospital UI (blue/white, dark mode)
- Deployable to **Vercel** (frontend) + **Render** (backend) + **MongoDB Atlas**

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Axios, RHF, Zod, Recharts |
| Backend | Python 3.12+, FastAPI, Uvicorn, Pydantic, JWT, Passlib, SlowAPI |
| Database | MongoDB Atlas (Motor / Beanie) |
| AI | Google Gemini API (heuristics fallback if unset) |
| Deploy | Vercel, Render |

## Project structure

```
secure-icu-dss/
├── frontend/     # React + Vite
├── backend/      # FastAPI multi-agent API
├── docs/         # Setup, architecture, security, deployment
└── render.yaml   # Render blueprint
```

## Demo accounts (seeded on API startup)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@12345` |
| Doctor | `doctor@example.com` | `Doctor@12345` |
| Nurse | `nurse@example.com` | `Nurse@12345` |

## Quick start (local)

### Backend

```bash
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1          # Windows
pip install -r requirements.txt
copy .env.example .env                # set MONGODB_URI (+ optional GEMINI_API_KEY)
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

## Documentation

| Doc | Contents |
|-----|----------|
| [docs/SETUP.md](docs/SETUP.md) | Environment variables & local setup |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, agents, API map |
| [docs/SECURITY.md](docs/SECURITY.md) | Defense design & RBAC |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Atlas + Render + Vercel |

## Pages

Login · Dashboard · Patients · AI Recommendation · Attack Simulation · Audit Logs · Evaluation · Profile

## Academic scope

Built for a university assignment on **Agentic AI** and **Cybersecurity**. Not for clinical use.
