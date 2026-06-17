# My Michigan Lake — Local Setup

## Prerequisites
- Docker Desktop
- Node 22+
- Python 3.12+

## 1. Clone & configure

```bash
# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Edit both files and fill in your **Clerk** keys:
1. Create a project at https://dashboard.clerk.com
2. Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`
3. In Clerk dashboard → Webhooks → add endpoint: `http://localhost:3000/api/webhook`
4. Copy the webhook signing secret into `CLERK_WEBHOOK_SECRET`

## 2. Start with Docker Compose

```bash
docker compose up --build
```

Services:
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |

## 3. Run database migrations (first time)

```bash
docker compose exec backend alembic upgrade head
```

## 4. Local dev without Docker

```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env  # fill in values, point DATABASE_URL to local postgres
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## User flow (Phase 1)

1. Visit http://localhost:3000 → landing page
2. Click "Join your neighborhood" → Clerk sign-up
3. After sign-up → `/onboarding` → enter display name + address
4. Backend assigns neighborhood via PostGIS boundary query
5. Redirect to `/feed` — post, comment, react with neighbors
