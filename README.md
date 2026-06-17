# My Michigan Lake

My Michigan Lake is a neighborhood platform for Michigan lake communities. It combines a Next.js dashboard with a FastAPI backend to help residents connect around local posts, alerts, property onboarding, and neighborhood-based activity.

## What this project does

- Lets users sign in with Clerk and complete onboarding.
- Associates a property with a neighborhood using location data.
- Provides a neighborhood feed for posts, comments, reactions, and category-based updates.
- Uses a webhook flow to sync Clerk user lifecycle events into the backend database.
- Runs as a containerized stack with PostgreSQL + PostGIS, Redis, the FastAPI API, and the Next.js frontend.

## Stack

- Frontend: Next.js 15, React 19, Tailwind CSS, Clerk authentication
- Backend: FastAPI, SQLAlchemy async, Alembic, PostGIS/GeoAlchemy2
- Data & infra: PostgreSQL with PostGIS, Redis, Docker Compose

## Repository layout

- ackend/ — FastAPI API, models, routers, database config, migrations
- rontend/ — Next.js app with dashboard pages, onboarding flow, and feed UI
- clerk-nextjs/ — an additional Clerk-enabled Next.js starter in the repo
- docker-compose.yml — local development stack for DB, Redis, API, and web app
- SETUP.md — detailed environment and local setup instructions

## Core features

1. Clerk-powered authentication and sign-in/sign-up flows
2. Onboarding that captures profile info and property details
3. Neighborhood assignment based on property location
4. Feed with posts, comments, reactions, and categorized updates
5. Webhook integration for user sync between Clerk and the backend

## Quick start

1. Copy the environment templates:

   `ash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   `

2. Fill in your Clerk credentials and webhook secret in those env files.
3. Start the stack:

   `ash
   docker compose up --build
   `

4. Apply database migrations:

   `ash
   docker compose exec backend alembic upgrade head
   `

5. Open the app:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API docs: http://localhost:8000/docs

## Local development

### Backend

`ash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
`

### Frontend

`ash
cd frontend
npm install
npm run dev
`

## Notes

- The backend uses PostGIS for neighborhood and property location queries.
- The frontend relies on the backend API URL from NEXT_PUBLIC_API_URL.
- For full setup steps, secrets, and troubleshooting, see SETUP.md.

## Status

This repository is currently structured as a working prototype for a lake-community social platform, with the main user journey centered on onboarding, neighborhood discovery, and community posting.
