# MyMichiganLake — Project Heartbeat

> Last updated: 2026-06-16
> Updated by: Claude

---

## Vision

Build the best web experience for lakefront homeowners to **sell and rent lake gear**, and **connect their community** — a Facebook Marketplace meets NextDoor, built specifically for Michigan lake life.

---

## Overall Goal

A full-featured lake community platform:
- Verified lakefront homeowner profiles
- Gear marketplace (buy / sell / rent)
- Community threads by lake neighborhood
- Live lake weather and water conditions
- Local business directory and advertising

---

## Where We Are Right Now (2026-06-09)

### What exists

| Layer | Status | Notes |
|---|---|---|
| **Static mockup** | ✅ Complete | `MyMichiganLake.html` — full UI wireframe, hosted on Netlify via GoDaddy domain |
| **Next.js frontend** | ✅ Running | App router, Tailwind, Supabase auth, all core pages live |
| **Supabase auth** | ✅ Working | Sign up, sign in, session middleware, onboarding flow — all functional |
| **Supabase database** | ✅ Live | `profiles` + `posts` tables with RLS policies and indexes deployed |
| **Feed / posts** | ✅ Functional | Create post, display feed — reads/writes directly from Supabase |
| **Onboarding** | ✅ Functional | 2-step flow saves profile + lake info to Supabase |
| **Profile page** | ✅ Functional | Reads from `profiles` table |
| **Netlify config** | ✅ Ready | `netlify.toml` configured, `@netlify/plugin-nextjs` added — push to deploy |
| **Marketplace** | 🔴 Stub | Placeholder page only |
| **Weather feature** | 🔴 Not built | Planned: NOAA / Open-Meteo integration |
| **Community threads** | 🔴 Not built | Feed exists but no lake-specific neighborhood scoping yet |
| **FastAPI backend** | ⏸ Paused | Scaffolded but not needed yet — frontend talks directly to Supabase |

### Biggest blocker
None — app is running locally. Auth flow works end to end.

---

## Short-Term Goals (Priority)

- [ ] **Configure Clerk** — add publishable key, secret key, webhook secret to env files
- [ ] **Run Docker Compose** — verify all three services start cleanly
- [ ] **Run Alembic migrations** — `docker compose exec backend alembic upgrade head`
- [ ] **Complete login flow** — sign up → onboarding → `/feed` redirect
- [ ] **Connect frontend to backend** — onboarding form POSTs to FastAPI; backend saves user + assigns lake neighborhood
- [ ] **Deploy Next.js to Netlify** — replace static HTML with the real app

---

## Long-Term Goals

- [ ] **Lake weather feature** — integrate NOAA / Open-Meteo API for real-time air temp, water temp, wind, UV by lake
- [ ] **Gear marketplace** — list, search, and message sellers; categories: boats, PWC, dock equipment, fishing gear, paddleboards
- [ ] **Facebook Marketplace UX** — photo uploads, price, condition, pickup location, saved searches
- [ ] **NextDoor community threads** — posts, comments, reactions scoped to a lake neighborhood
- [ ] **Verified owner badges** — property address verification workflow
- [ ] **Local business directory** — paid Featured/Verified advertiser listings
- [ ] **Event calendar** — per-lake community events, garage sales, regattas

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Auth | Clerk (social + email login, webhooks) |
| Backend | FastAPI, Python 3.12 |
| ORM / Migrations | SQLAlchemy + Alembic |
| Database | PostgreSQL + PostGIS |
| Infrastructure | Docker Compose (local), Netlify (frontend), TBD (backend hosting) |
| Domain | GoDaddy → Netlify DNS |

---

## Commit Log

| Date | Who | What |
|---|---|---|
| 2026-06-09 | Claude | Created `HEARTBEAT.md` — initial project state snapshot, goals, and stack inventory |
| 2026-06-16 | Claude | Ripped out Clerk + Redis; replaced with Supabase (`@supabase/ssr`). Rewrote middleware, auth pages, dashboard, feed, onboarding, profile, TopNav, PostCard, CreatePost. Frontend now queries Supabase directly — no FastAPI required to run. Added `netlify.toml`, `supabase/schema.sql`, `lib/supabase/` helpers. |
| 2026-06-17 | Claude | **Bug fix + accountability:** `emailRedirectTo` in `signUp()` was causing `NetworkError` in Firefox because the URL wasn't whitelisted in Supabase Auth URL Configuration. Removed `emailRedirectTo` from sign-up call. Root cause was missed during initial implementation — should have read Supabase auth docs before writing the signUp call. Also gave incorrect guidance on API keys (told user to switch from anon to publishable, then switched back without clear reasoning). The correct key is the legacy `eyJ...` anon key; the `sb_publishable_` key requires a newer SDK. Required Supabase dashboard steps: set Site URL to `http://localhost:3000`, add `http://localhost:3000/**` to Redirect URLs, disable email confirmation for local dev. |
