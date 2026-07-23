# MyMichiganLake — Project Heartbeat

> Last updated: 2026-07-22
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
| Auth | Supabase Auth (`@supabase/ssr`) — session middleware, sign-up/in, forgot/reset password |
| Database | Supabase Postgres with RLS on every table |
| Storage | Supabase Storage (`listing-images` public bucket) |
| Email | Resend — message notifications via `app/api/notify-message` |
| Weather | Open-Meteo (free, no key) — `GET /api/weather?lake=` with 30-min server-side cache |
| Emergency alerts | NOAA NWS (free, no key) — `api.weather.gov/alerts/active?zone=MIC{FIPS}`, 5-min cache |
| Map | Leaflet (free, no key) — Carto Voyager tiles, `leaflet` npm package, no react-leaflet |
| Ads | Supabase `ad_campaigns` table — feed_inline placement, lake-targeted or run-of-house |
| Ad revenue | Google AdSense — script in `<head>` (ca-pub-1606056559264588), pending approval |
| Hosting | Netlify — **live at mymichiganlake.netlify.app**; `@netlify/plugin-nextjs` wires API routes as Netlify Functions |
| Tests | Vitest (42 JS tests) + pgTAP SQL tests (`supabase/tests/rls.test.sql`, 32 assertions) |
| Domain | GoDaddy → Netlify DNS |

Key code: Supabase helpers in `frontend/lib/supabase/` (client, server, queries); NWS county FIPS map in `frontend/lib/nws.ts`; haversine in `frontend/lib/geo.ts`. SQL migrations in `supabase/` — run manually in the Supabase SQL Editor.

---

## Where We Are Right Now (2026-07-22)

| Feature | Status | Notes |
|---|---|---|
| **Auth + onboarding** | ✅ Working | Sign-up → email confirm → 2-step onboarding. Forgot/reset password. Lake autocomplete + "Use my location" geolocation (haversine nearest-lake). Saves both `lake_name` (text) and `lake_id` (FK). |
| **Feed / posts** | ✅ Working | Create post, global feed, categories, urgent flag, weather card at top. Feed is **global** — not yet scoped per lake. |
| **Profile** | ✅ Working | Edit form with display name, bio, and full lake autocomplete + geolocation picker. Saves `lake_name` + `lake_id` together. |
| **Marketplace** | ✅ Working | Browse with search + category filters (incl. canoes), create listing with up to 5 photos, listing detail, owner actions (mark sold/rented/relist/delete). |
| **Messaging** | ✅ Working | Buyer↔seller threads per listing, safety modal on first contact, Realtime subscription, unread-count RPC, Resend email notifications (with dedup). Auth-checked — caller must match `senderId`. |
| **Weather card** | ✅ Working | WeatherCard on feed accepts `lakeName` prop from feed page (no duplicate profile fetch). Falls back to self-fetching when used standalone. |
| **Sponsored feed cards** | ✅ Working | Every 5th feed slot is a `SponsoredCard`. Targeted by `profiles.lake_id`; falls back to run-of-house. `ad_campaigns` + `ad_impressions` tables — run `supabase/ad_campaigns.sql`. |
| **Safety alerts** | ✅ Working | Live NOAA NWS alerts scoped to user's county via `lake_id → lake.county → MIC{FIPS}`. Severity-coded cards (Extreme/Severe/Moderate/Minor). Local county opt-in signup card (OakAlert, CodeRED, Smart911, etc.). All 83 Michigan counties mapped in `lib/nws.ts`. |
| **Interactive map** | ✅ Working | Leaflet map, all 56 DB lakes as circle markers. Amber/gold = user's home lake. Brighter blue = has listings. Radius scales with listing count. Carto Voyager tiles. Click → popup with lake name, county, up to 3 listing previews + price. Flies to home lake on load. |
| **Mobile nav** | ✅ Working | Hamburger menu in TopNav (visible below `md`). Slide-down drawer with all 6 nav links, Waterfront shortcuts, sign out. Closes on route change, outside tap, or backdrop click. Map container uses `isolation: isolate` so Leaflet z-indices don't overlap the `z-40` drawer. |
| **Google AdSense** | ⚠️ Pending | Script is in server-rendered `<head>` (native `<script>`, not Next.js `<Script>`). Application submitted — awaiting approval. |
| **Lake reference table** | ✅ In DB | `supabase/lakes.sql` — 56+ Michigan inland lakes (name, county, lat, lng), public-read RLS. Must be run in SQL Editor if not done yet. |
| **Canoe category** | ⚠️ Code only | `ListingCategory` type + UI include canoe; the DB `CHECK` constraint needs `add_canoe_category.sql` run in SQL Editor. |
| **Test suite** | ✅ Working | `npm run test:run` — 42/42 pass. Run `supabase test db` for the 32 pgTAP RLS tests. |
| **Security** | ✅ Fixed | `/api/notify-message` requires auth session + caller-must-match-senderId. `/auth/callback` blocks open-redirect via `?next=`. Both covered by tests. |
| **Lake-scoped threads** | 🔴 Not built | Feed is global. Lakes table + onboarding autocomplete are done; lake FK migration and feed scoping are the next major feature. |
| **Comments + reactions** | 🔴 Not built | No `comments` or `reactions` tables yet. |
| **Verified owner badges** | 🔴 Not built | No verification flow yet. |

---

## Immediate Actions Required (manual — no code)

### 1. Run missing SQL migrations in Supabase SQL Editor

Go to [supabase.com → SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:

```
supabase/lakes.sql              — seeds 56+ Michigan lakes (map + onboarding autocomplete need this)
supabase/ad_campaigns.sql       — creates ad_campaigns + ad_impressions tables, adds lake_id FK to profiles
supabase/add_canoe_category.sql — patches listings CHECK constraint to allow 'canoe'
```

All files use `ON CONFLICT DO NOTHING` / `IF NOT EXISTS`, so re-running is safe.

### 2. Add missing Netlify environment variables

Go to Netlify → Site → Environment variables and add:

| Variable | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → service_role key |
| `RESEND_API_KEY` | From Resend dashboard |
| `FROM_EMAIL` | Your verified sender — use `onboarding@resend.dev` until domain is verified |

Without `SUPABASE_SERVICE_ROLE_KEY`, the `/api/notify-message` route crashes silently (email just doesn't go out).

### 3. Verify your domain in Resend

Until verified, Resend can only send to your own account email. Go to Resend → Domains, add your GoDaddy domain, and add the required DNS records.

### 4. Re-verify Google AdSense

After Netlify redeploys, view page source and confirm the AdSense `<script>` tag appears in the raw HTML `<head>`. Then click Verify in the AdSense dashboard. Also confirm the URL in AdSense matches `mymichiganlake.netlify.app` exactly.

---

## Next Code Changes (priority order)

### Priority 1 — Lake-scoped community threads (core differentiator)

This is the feature that makes MyMichiganLake feel like NextDoor rather than a national app. The `lakes` table, `profiles.lake_id` FK, and onboarding autocomplete are all in place — the feed just needs scoping.

**Schema changes needed:**
```sql
-- Add lake_id to posts for scoped feed
ALTER TABLE posts ADD COLUMN lake_id uuid REFERENCES lakes(id);

-- Comments on posts
CREATE TABLE comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read comments" ON comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "owner insert comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner delete comment" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Post reactions (emoji, one per user per post)
CREATE TABLE reactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji text NOT NULL CHECK (emoji IN ('👍','❤️','😂','😮','🙏')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (post_id, user_id)
);
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read reactions" ON reactions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "owner insert reaction" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner delete reaction" ON reactions FOR DELETE USING (auth.uid() = user_id);
```

**Frontend changes:**
- Feed default = "My Lake" tab with "All Lakes" toggle
- `PostCard` — comment count link, reaction bar (five emoji buttons with counts)
- Comment thread on post detail/expand

### Priority 2 — Marketplace polish (incremental, no schema changes)

- **Edit listing** — reuse the create form at `/marketplace/[id]/edit`; pre-populate from the existing listing
- **My Listings** page — filter `listings` by `user_id = auth.uid()`, show all statuses
- **Saved searches** — `saved_searches` table (`user_id`, `query`, `category`, `max_price`); "Save this search" button

### Priority 3 — Map: marketplace filter by lake

Currently clicking a lake marker links to `/marketplace` (unfiltered). The marketplace page uses local `useState` for search — it doesn't read URL params. Two options:
- Read `?lake=` from `searchParams` in the marketplace page and pre-populate the search state
- Or show listing cards inline in the map popup (already shows up to 3 previews)

### Priority 4 — Verified owner badges (trust layer)

- `verification_requests` table + `verified boolean` on `profiles`
- Documents upload to a **private** storage bucket
- Manual admin review first. Badge renders on profiles, posts, and listings.

### Priority 5 — Rental checkout + insurance (legal review required first)

**Do not build this until you have reviewed it with a Michigan maritime attorney.**

Michigan MCL 324.44501–44526 (boat livery laws) requires a registered livery permit, boating safety certificate proof, and signed liability waiver. Once legal review is done: Buoy for per-trip insurance, Smartwaiver for digital waivers, Stripe for escrow.

---

## Known Technical Debt

| Issue | File | Severity |
|---|---|---|
| `listings` category CHECK constraint missing 'canoe' | DB — run `add_canoe_category.sql` | Medium |
| Feed not scoped by lake | `app/(dashboard)/feed/page.tsx` | Medium (Priority 1 roadmap) |
| Map listing popups link to `/marketplace` unfiltered | `components/map/MapInner.tsx` | Low (Priority 3 roadmap) |
| `profiles.lake_name` text column coexists with `lake_id` FK | DB + onboarding | Low — both columns intentional, gradual migration |
| Node 18 locally — Next.js 16 requires ≥ 20.9 | Local dev only | Low (Netlify runs 20+) |

---

## Commit Log

| Date | Who | What |
|---|---|---|
| 2026-06-09 | Claude | Created `HEARTBEAT.md` — initial project state snapshot, goals, and stack inventory |
| 2026-06-16 | Claude | Ripped out Clerk + Redis; replaced with Supabase (`@supabase/ssr`). Rewrote middleware, auth pages, dashboard, feed, onboarding, profile, TopNav, PostCard, CreatePost. |
| 2026-06-17 | Claude | Bug fix: `emailRedirectTo` NetworkError in Firefox. Upgraded Next.js 15.1.0 → 16.2.9 (CVE-2025-55182). Removed stale `clerk-nextjs` submodule. |
| 2026-06-18 | Claude | Built marketplace: browse, create listing (5-photo upload), listing detail. `supabase/listings.sql` with RLS + storage policies. |
| 2026-06-19 | Claude | In-platform messaging (`conversations`/`messages` tables, unread-count RPC), Resend email notifications, marketplace search + canoe category. |
| 2026-07-02 | Claude | Weather v1: `supabase/lakes.sql` (41 seeded MI lakes), `GET /api/weather?lake=` with geocoding fallback + 30-min cache, `WeatherCard` on feed. |
| 2026-07-19 | Claude | Forgot/reset password flow. Onboarding lake field: autocomplete combobox + "Use my location" geolocation (haversine). Merged lakes.sql — 57 Michigan lakes, `created_at` column, lowercase name index. Extracted `haversineMiles` to `lib/geo.ts`. |
| 2026-07-19 | Claude | Vitest test suite: 40 JS tests across geo, notify-message API, weather API, auth-callback, and middleware. `supabase/tests/rls.test.sql`: 32 pgTAP assertions for all RLS policies. |
| 2026-07-21 | Claude | Sponsored feed cards: every 5th post slot → `SponsoredCard`. `ad_campaigns` + `ad_impressions` tables. Seeded Torch Lake Marina (lake-targeted) + BoatUS (run-of-house). Onboarding + profile now save `lake_id` FK. `AdCampaign` type in `queries.ts`. |
| 2026-07-21 | Claude | WeatherCard refactor: accepts `lakeName` prop from feed page, eliminating duplicate profile fetch. |
| 2026-07-21 | Claude | Profile lake picker: added `ProfileEditForm` with lake autocomplete + geolocation — same UX as onboarding. Profile page rebuilt as server component. |
| 2026-07-21 | Claude | Google AdSense: inserted script in server-rendered `<head>` via native `<script>` tag (not Next.js `<Script>`). AdSense application submitted. |
| 2026-07-21 | Claude | Security fixes: auth + identity check on `/api/notify-message` (401/403). Open-redirect block in `/auth/callback` (`?next=` must start with `/`). Tests updated — 42/42 passing. |
| 2026-07-21 | Claude | Safety alerts page: live NOAA NWS alerts via `api.weather.gov/alerts/active?zone=MIC{FIPS}`. `lib/nws.ts` maps all 83 Michigan counties to NWS zone codes + confirmed local alert systems (OakAlert, CodeRED, Smart911, RAVE, B-WARN, Nixle). Alert cards severity-coded. Local county signup card shown below alerts. Corrected: Torch Lake is Antrim County, not Oakland County. |
| 2026-07-22 | Claude | Mobile hamburger menu: `☰` button in TopNav (visible below `md`). Slide-down drawer with all nav items, Waterfront shortcuts, sign out. Closes on route change, outside tap, or backdrop. |
| 2026-07-22 | Claude | Interactive map: Leaflet (no API key), Carto Voyager tiles. All 56 DB lakes as circle markers — amber for home lake, brighter blue for lakes with listings, radius scales by count. Popup shows lake name, county, up to 3 listing previews with emoji + price. Flies to home lake on load. Server RSC pre-fetches lakes + listings + user lake_id in parallel. |
| 2026-07-22 | Claude | Bug fix: `isolation: isolate` on map container prevents Leaflet's internal z-indices (200–800) from overlapping the `z-40` mobile hamburger drawer. |
