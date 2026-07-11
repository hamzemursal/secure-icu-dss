# Deployment Guide — Secure ICU Decision Support Agent

## Overview

| Component | Platform |
|-----------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [MongoDB Atlas](https://www.mongodb.com/atlas) |

---

## 1. MongoDB Atlas

1. Create a free cluster.
2. Add a database user and network access (`0.0.0.0/0` for demo, or lock to Render IPs).
3. Copy the connection string into `MONGODB_URI`.
4. Set `MONGODB_DB_NAME=secure_icu_dss`.

---

## 2. Backend on Render

### Option A — Blueprint

1. Push this repo to GitHub.
2. In Render: **New → Blueprint** → select the repo (`render.yaml`).
3. Fill secret env vars:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `CORS_ORIGINS` = your Vercel URL (e.g. `https://your-app.vercel.app`)
4. Deploy. Health check: `GET /health`.

### Option B — Manual Web Service

- **Root directory:** `backend`
- **Build:** `pip install -r requirements.txt`
- **Start:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Python:** 3.12

After deploy, open `https://<service>.onrender.com/docs`.

---

## 3. Frontend on Vercel

1. Import the GitHub repo in Vercel.
2. **Root Directory:** `frontend`
3. Framework: Vite (uses `frontend/vercel.json`).
4. Environment variable:

| Name | Value |
|------|--------|
| `VITE_API_BASE_URL` | `https://<your-render-service>.onrender.com/api/v1` |
| `VITE_APP_NAME` | `Secure ICU Decision Support Agent` |

5. Deploy. Update Render `CORS_ORIGINS` to the Vercel URL and redeploy the API if needed.

---

## 4. Post-deploy checklist

- [ ] `/health` returns `ok`
- [ ] Login with `doctor@icu.local` / `Doctor@12345`
- [ ] Create a patient and run AI recommendation
- [ ] Run an attack simulation with defense on
- [ ] Evaluation dashboard shows metrics

---

## Notes

- Render free tier may cold-start (first request can be slow).
- Change demo passwords before any public demo.
- Gemini is optional; heuristics run if the key is missing.
