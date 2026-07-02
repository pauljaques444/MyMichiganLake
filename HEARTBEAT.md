# MyMichiganLake — Project Heartbeat

> Last updated: 2026-07-02
> Updated by: Claude

---

## Vision

Build the best web experience for lakefront homeowners to **sell and rent lake gear**, and **connect their community** — a Facebook Marketplace meets NextDoor, built specifically for Michigan lake life.

---

## Architecture (current reality)

The mid-June pivot is complete: **Clerk, FastAPI, Redis, and Docker are gone.** The app is a single Next.js frontend that talks directly to Supabase. There is no backend service to run.

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.9 (App Router), TypeScript, Tailwind CSS — lives in `frontend/` |
| Auth | Supabase Auth (`@supabase/ssr`) — session middleware, sign-up/in, password reset |
| Database | Supabase Postgres with RLS on every table |
| Storage | Supabase Storage (`listing-images` public bucket) |
| Email | Resend (message notifications via `app/api/notify-message`) |
| Hosting | Netlify (`netlify.toml` ready) — **currently still serving the static HTML mockup**; real app not yet deployed |
| Domain | GoDaddy → Netlify DNS |

Key code locations: Supabase helpers in `frontend/lib/supabase/` (client, server, queries); SQL migrations in `supabase/` (`schema.sql`, `listings.sql`, `messages.sql`, `add_canoe_category.sql`) — run manually in the Supabase SQL Editor.

---

## Where We Are Right Now (2026-07-02)

| Feature | Status | Notes |
|---|---|---|
| **Auth + onboarding** | ✅ Working | Sign up → 2-step onboarding (profile + lake) → `/feed`. Firefox `emailRedirectTo` bug fixed 06-17. |
| **Feed / posts** | ✅ Working | Create post, global feed. `posts` table with category + urgent flag. Not yet scoped by lake. |
| **Profile** | ✅ Working | Reads/writes `profiles` (display name, bio, lake, address fields). |
| **Marketplace** | ✅ Working | Browse with search + category filters (incl. canoes), create listing with up to 5 photos to Supabase Storage, listing detail. `listings` table with price types (sale/rent_day/rent_hour/free), condition, status. |
| **Messaging** | ✅ Working | Buyer↔seller conversations per listing (`conversations` + `messages` tables), unread-count RPC, Resend email notifications. |
| **Map** | 🔴 Stub | Placeholder page — Mapbox planned. |
| **Safety alerts** | 🔴 Stub | Placeholder page — NOAA planned. |
| **Weather** | 🟡 In build | v1 planned 2026-07-02 (see strategy #3): `lakes` table + Open-Meteo API route + feed weather card. |
| **Lake-scoped threads** | 🔴 Not built | Feed is global; lake data exists on profiles but isn't used for scoping. |
| **Production deploy** | 🔴 Not done | The single biggest gap — app runs locally only. |

### Biggest blocker
None technical. The gap is deployment: a fully working app is sitting locally while the domain serves a static mockup.

---

## Integration Strategy by Feature

Ordered by recommended build sequence. Each entry covers: data model, frontend surface, external services, and gotchas.

### 1. Production deploy to Netlify (do first)

No code to write — configuration only.

- **Netlify:** connect the GitHub repo, set base directory to `frontend/`, add env vars `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the legacy `eyJ...` anon key — the `sb_publishable_` key requires a newer SDK), and `RESEND_API_KEY`.
- **Supabase dashboard:** set Site URL to the production domain, add `https://<domain>/**` to Redirect URLs (keep `http://localhost:3000/**` for dev), and **re-enable email confirmation** (it was disabled for local dev).
- **DNS:** point the GoDaddy domain at the new Netlify site, retiring the static `MyMichiganLake.html` mockup.
- **Gotcha:** `@netlify/plugin-nextjs` must support Next 16 — verify the plugin version during the first deploy.

### 2. Lake-scoped community threads (core differentiator)

The NextDoor half of the vision. Lake data already flows through onboarding into `profiles.lake_name` — the strategy is to promote lakes from a free-text column to a first-class entity.

- **Data model:** new `lakes` table (`id`, `name`, `county`, `lat`, `lng`) seeded with major Michigan lakes; add `lake_id` FK to `profiles` and `posts`. Migrate existing `lake_name` strings by fuzzy-matching to seeded lakes. Then `comments` (`post_id`, `user_id`, `body`) and `reactions` (`post_id`, `user_id`, `type`, unique per user/post) tables, RLS mirroring the existing `posts` policies (authenticated read, owner write).
- **Frontend:** feed default becomes "my lake" with an "All lakes" toggle; onboarding lake step becomes a typeahead over `lakes` instead of free text; comment thread + reaction bar on `PostCard`.
- **Why a lakes table now:** map, weather, alerts, directory, and events all need lake identity + coordinates. Every later feature keys off it — build it once here.

### 3. Lake weather (daily-visit driver) — v1 planned 2026-07-02

- **External service:** Open-Meteo — free, no API key, no signup. Air temp, wind, UV from the forecast API; water temperature is not available for inland lakes, so start with air/wind/UV and add NOAA GLERL water temp later for Great Lakes shoreline only.
- **Scope decision:** the `lakes` table ships **now** as part of this feature (it was slated for feature 2, but weather needs coordinates and building against free-text `lake_name` is a dead end). The profiles/posts FK migration stays in feature 2 — profiles keep free-text `lake_name` for the moment, and the weather API bridges the gap by name-matching.
- **Data model:** `supabase/lakes.sql` — `lakes` table (`name` unique, `county`, `lat`, `lng`), public-read RLS, seeded with ~35 major Michigan inland lakes. Coordinates are lake-approximate; weather model resolution is ~10 km so precision doesn't matter.
- **API:** route handler `GET /api/weather?lake=<name>` (name-keyed until profiles carry `lake_id`). Coordinate resolution: exact case-insensitive match against `lakes`, then partial match, then fallback to Open-Meteo's free geocoding API filtered to Michigan. Forecast fetch: current temp / feels-like / wind / UV / humidity / WMO condition code + 3-day highs/lows/precip probability, Fahrenheit + mph, `America/Detroit` timezone, cached server-side 30 min (`revalidate: 1800`). No client-side API calls, no keys to leak.
- **Frontend:** `WeatherCard` client component at the top of the feed, above `CreatePost` — current conditions, wind/UV/humidity row, 3-day mini forecast. Skeleton while loading; "set your lake" prompt if profile has no lake; hides on API failure rather than breaking the feed.
- **Later (feature 2 tie-in):** when profiles get `lake_id`, switch the API to `?lakeId=` and drop the name-matching bridge.

### 4. Marketplace polish (incremental, no schema changes)

The schema already supports everything here — this is pure frontend work.

- **Edit / mark sold / delete:** `listings` already has `status` (`active`/`sold`/`rented`) and owner UPDATE/DELETE RLS policies. Add an "My listings" management view and an edit form reusing the create-listing page.
- **Unread badge:** the `unread_message_count()` RPC already exists — call it from `TopNav` and poll or refresh on route change.
- **Saved searches:** new `saved_searches` table (`user_id`, `query`, `category`, `max_price`); a "Save this search" button on the browse page. Email alerts for new matches are a later enhancement (Supabase scheduled Edge Function + Resend, same pattern as message notifications).

### 5. Interactive map

- **External service:** Mapbox GL JS (`react-map-gl`). Requires `NEXT_PUBLIC_MAPBOX_TOKEN`; free tier (50k loads/mo) is plenty pre-launch.
- **Integration point:** replace the stub at `frontend/app/(dashboard)/map/page.tsx`. Pins come from the `lakes` table (feature 2 prerequisite); clicking a lake shows its weather card, active listing count, and a link into its feed.
- **Later:** listing-level pins using approximate location (never exact addresses — safety).

### 6. Safety alerts

- **External service:** NOAA / NWS API (`api.weather.gov`) — free, no key, alerts by lat/lng zone.
- **Integration point:** route handler `app/api/alerts/[lakeId]`, same server-side fetch + cache pattern as weather. Replace the stub at `frontend/app/(dashboard)/alerts/page.tsx` with alerts for the user's lake; urgent alerts also surface as a banner on the feed.
- **Synergy:** `posts.is_urgent` already exists — community-reported hazards (debris, ice) can share the alerts page with official NWS data.

### 7. Verified owner badges (trust layer)

- **Data model:** `verification_requests` table (`user_id`, `document_url`, `status`, `reviewed_at`) + `verified boolean` on `profiles`. Documents go to a **private** storage bucket (unlike `listing-images`).
- **Process:** manual review at first — admin checks the uploaded proof (tax record, utility bill) against the profile address. Badge renders on profiles, posts, and listings. Automate only if volume demands it.
- **Prerequisite for:** business directory credibility and marketplace trust. No external service needed to start.

### 8. Business directory + event calendar (revenue, post-launch)

- **Directory:** `businesses` table (`name`, `lake_id`, `category`, `tier` free/featured/verified). Manual invoicing before building Stripe — validate demand first. Featured tier gets placement on the lake feed sidebar.
- **Events:** `events` table (`lake_id`, `title`, `starts_at`, `location`, `created_by`), a calendar view per lake, RSVP as a later step. Cheap to build once lakes are first-class.

---

## Dependency Graph

```
Deploy (1) ──────────────── independent, do immediately
Lakes table (in 2) ──┬──► Threads (2)
                     ├──► Weather (3)
                     ├──► Map (5)
                     ├──► Alerts (6)
                     └──► Directory / Events (8)
Marketplace polish (4) ──── independent, fill-in work anytime
Verified badges (7) ─────── independent, before directory (8)
```

---

## Commit Log

| Date | Who | What |
|---|---|---|
| 2026-06-09 | Claude | Created `HEARTBEAT.md` — initial project state snapshot, goals, and stack inventory |
| 2026-06-16 | Claude | Ripped out Clerk + Redis; replaced with Supabase (`@supabase/ssr`). Rewrote middleware, auth pages, dashboard, feed, onboarding, profile, TopNav, PostCard, CreatePost. Frontend now queries Supabase directly — no FastAPI required to run. Added `netlify.toml`, `supabase/schema.sql`, `lib/supabase/` helpers. |
| 2026-06-17 | Claude | **Bug fix + accountability:** `emailRedirectTo` in `signUp()` was causing `NetworkError` in Firefox because the URL wasn't whitelisted in Supabase Auth URL Configuration. Removed `emailRedirectTo` from sign-up call. Root cause was missed during initial implementation — should have read Supabase auth docs before writing the signUp call. Also gave incorrect guidance on API keys (told user to switch from anon to publishable, then switched back without clear reasoning). The correct key is the legacy `eyJ...` anon key; the `sb_publishable_` key requires a newer SDK. Required Supabase dashboard steps: set Site URL to `http://localhost:3000`, add `http://localhost:3000/**` to Redirect URLs, disable email confirmation for local dev. |
| 2026-06-17 | Claude | Upgraded Next.js 15.1.0 → 16.2.9 (CVE-2025-55182). Removed stale `clerk-nextjs` submodule. |
| 2026-06-18 | Claude | Built marketplace: browse, create listing (5-photo upload to `listing-images` bucket), listing detail. `supabase/listings.sql` with RLS + storage policies. |
| 2026-06-19 | Claude | In-platform buyer↔seller messaging (`conversations`/`messages` tables, unread-count RPC), Resend email notifications, marketplace search + canoe category, removed clerk-nextjs ghost submodule permanently. |
| 2026-07-02 | Claude | Rewrote heartbeat to match post-pivot reality; replaced stale Clerk/Docker goals with per-feature integration strategies and dependency graph. |
| 2026-07-02 | Claude | Planned weather v1: pulled the `lakes` table forward from feature 2 (seeded, name-matched from free-text `lake_name`, geocoding fallback), Open-Meteo route handler with 30-min cache, `WeatherCard` on the feed. |
