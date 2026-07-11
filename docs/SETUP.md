# Setup Guide — Secure ICU Decision Support Agent

## Prerequisites

- Python 3.12+
- Node.js 20+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

## 1. Clone / open the project

```bash
cd secure-icu-dss
```

## 2. Backend

```bash
cd backend
py -3.12 -m venv .venv

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

# macOS / Linux
# source .venv/bin/activate

pip install -r requirements.txt
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux
```

Edit `backend/.env` with your MongoDB URI, JWT secret, and Gemini API key.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs: http://localhost:8000/docs

## 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env   # Windows
# cp .env.example .env
npm run dev
```

App: http://localhost:5173

## 4. Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DB_NAME` | Database name (e.g. `secure_icu_dss`) |
| `JWT_SECRET_KEY` | Long random secret for JWT signing |
| `JWT_ALGORITHM` | Default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | e.g. `gemini-2.0-flash` |
| `CORS_ORIGINS` | Comma-separated frontend origins |
| `RATE_LIMIT_PER_MINUTE` | API rate limit |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (e.g. `http://localhost:8000/api/v1`) |

## 5. Demo accounts (seeded on backend startup)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@example.com` | `Admin@12345` |
| Doctor | `doctor@example.com` | `Doctor@12345` |
| Nurse | `nurse@example.com` | `Nurse@12345` |

Auth endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout` (Bearer token)
- `GET /api/v1/auth/me` (Bearer token)

## 6. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for MongoDB Atlas + Render + Vercel.
See [SECURITY.md](SECURITY.md) for defense design.
