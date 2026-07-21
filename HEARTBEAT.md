# MyMichiganLake — Project Heartbeat

> Last updated: 2026-07-21
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
| Hosting | Netlify — **live at mymichiganlake.netlify.app**; `@netlify/plugin-nextjs` wires API routes as Netlify Functions |
| Tests | Vitest (40 JS tests) + pgTAP SQL tests (`supabase/tests/rls.test.sql`, 32 assertions) |
| Domain | GoDaddy → Netlify DNS |

Key code: Supabase helpers in `frontend/lib/supabase/` (client, server, queries); pure utils in `frontend/lib/geo.ts` (haversineMiles). SQL migrations in `supabase/` — run manually in the Supabase SQL Editor.

---

## Where We Are Right Now (2026-07-19)

| Feature | Status | Notes |
|---|---|---|
| **Auth + onboarding** | ✅ Working | Sign-up → email confirm → 2-step onboarding. Forgot/reset password flow added 07-19. Lake field is now autocomplete against `lakes` table + "Use my location" geolocation button (haversine nearest-lake). |
| **Feed / posts** | ✅ Working | Create post, global feed, categories, urgent flag, weather card at top. Feed is **global** — not yet scoped per lake. |
| **Profile** | ✅ Working | Reads/writes `profiles` (display name, bio, lake, address fields). |
| **Marketplace** | ✅ Working | Browse with search + category filters (incl. canoes), create listing with up to 5 photos, listing detail, owner actions (mark sold/rented/relist/delete), `OwnerActions` component. |
| **Messaging** | ✅ Working | Buyer↔seller threads per listing (`conversations` + `messages`), safety modal on first contact, Supabase Realtime subscription, unread-count RPC, Resend email notifications (with dedup). |
| **Weather** | ✅ Working | `GET /api/weather?lake=` → exact/partial match in `lakes` table → Open-Meteo geocoding fallback → Open-Meteo forecast. `WeatherCard` on feed. |
| **Lake reference table** | ✅ In DB | `supabase/lakes.sql` — 57 Michigan inland lakes (name, county, lat, lng, created_at), public-read RLS, lowercase name index. **Must be run in SQL Editor if not done yet.** |
| **Canoe category** | ⚠️ Code only | `ListingCategory` type + UI include canoe; the DB `CHECK` constraint still needs `add_canoe_category.sql` run in SQL Editor. |
| **Test suite** | ✅ Working | `npm run test:run` — 40/40 pass, 1 security todo. Run `supabase test db` for the 32 pgTAP RLS tests. |
| **Sponsored feed cards** | ✅ Code done | Every 5th feed slot is a `SponsoredCard` (same card shape, "Sponsored" label). Targeted by `profiles.lake_id` FK. `ad_campaigns` + `ad_impressions` tables — run `supabase/ad_campaigns.sql`. Seeded Torch Lake Marina (lake-targeted) + BoatUS (run-of-house). |
| **Map** | 🔴 Stub | Placeholder page — Mapbox planned. |
| **Safety alerts** | 🔴 Stub | Placeholder page — NOAA NWS planned. |
| **Lake-scoped threads** | 🔴 Not built | Feed is global. Lakes table + onboarding autocomplete are done; lake FK migration and feed scoping are the next major feature. |
| **Comments + reactions** | 🔴 Not built | No `comments` or `reactions` tables yet. |
| **Verified owner badges** | 🔴 Not built | No verification flow yet. |

---

## Immediate Actions Required (manual — no code)

These are blockers that prevent the live site from working correctly. They require no code changes.

### 1. Run missing SQL migrations in Supabase SQL Editor

Go to [supabase.com → SQL Editor](https://supabase.com/dashboard/project/_/sql) and run:

```
supabase/lakes.sql          — seeds 57 Michigan lakes (onboarding autocomplete needs this)
supabase/add_canoe_category.sql — patches listings CHECK constraint to allow 'canoe'
```

Both files use `ON CONFLICT DO NOTHING` / `IF NOT EXISTS`, so re-running is safe.

### 2. Add missing Netlify environment variables

Go to Netlify → Site → Environment variables and add:

| Variable | Value |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → Settings → API → service_role key |
| `RESEND_API_KEY` | From Resend dashboard |
| `FROM_EMAIL` | Your verified sender (e.g. `noreply@mymichiganlake.com`) — use `onboarding@resend.dev` until domain is verified |

Without `SUPABASE_SERVICE_ROLE_KEY`, the `/api/notify-message` route crashes silently on every message sent (the email just doesn't go out).

### 3. Verify your domain in Resend

Until the domain is verified, Resend can only send to your own account email. Go to Resend → Domains, add your GoDaddy domain, and add the required DNS records. This unlocks sending to all users.

### 4. Trigger a Netlify redeploy

After adding env vars, trigger a manual redeploy in Netlify (Deploys → Trigger deploy) so the new vars take effect.

---

## Next Code Changes (priority order)

### Priority 1 — Security fixes (do before any new features)

**a. Auth check on `/api/notify-message`** (`frontend/app/api/notify-message/route.ts`)

The route currently has no authentication check. Any caller with a valid `conversationId` can trigger email notifications. Add a session check at the top of the handler:

```ts
// Add at the top of POST():
const supabaseUser = createServerClient(...)  // use @supabase/ssr + cookies()
const { data: { user } } = await supabaseUser.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

The `.todo` test in `__tests__/api/notify-message.test.ts` tracks this — convert it to a real test after the fix.

**b. Open-redirect in `/auth/callback`** (`frontend/app/auth/callback/route.ts`)

The `?next=` query param is used as a redirect target without validation. An attacker can craft `?next=https://evil.com` and the route will redirect there. Fix: validate `next` is a relative path.

```ts
// Replace: const next = searchParams.get('next') ?? '/onboarding'
const rawNext = searchParams.get('next') ?? '/onboarding'
const next = rawNext.startsWith('/') ? rawNext : '/onboarding'
```

Update the test in `__tests__/api/auth-callback.test.ts` to assert this returns 307 to `/onboarding`, not evil.com.

### Priority 2 — Lake-scoped community threads (core differentiator)

This is the feature that makes MyMichiganLake feel like NextDoor rather than a national app. With the `lakes` table seeded and onboarding autocomplete in place, the groundwork is done.

**Schema changes needed:**
```sql
-- Add lake_id to profiles (run after adding FK)
ALTER TABLE profiles ADD COLUMN lake_id uuid REFERENCES lakes(id);

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
- Onboarding: save `lake_id` (FK) to profile in addition to `lake_name` (already saved as text)

### Priority 3 — Marketplace polish (incremental, no schema changes)

Everything here uses existing tables and RLS:

- **Edit listing** — reuse the create form at `/marketplace/[id]/edit`; pre-populate from the existing listing
- **My Listings** page — filter `listings` by `user_id = auth.uid()`, show all statuses
- **Saved searches** — new `saved_searches` table (`user_id`, `query`, `category`, `max_price`); "Save this search" button on the browse page

### Priority 4 — Interactive map

Replace the stub at `frontend/app/(dashboard)/map/page.tsx`.

- **Service:** Mapbox GL JS via `react-map-gl`. Free tier is 50k loads/mo — plenty pre-launch.
- **Env var needed:** `NEXT_PUBLIC_MAPBOX_TOKEN`
- **Data:** pins from `lakes` table. Click a lake → show its weather card + active listing count + link to its feed.
- **Later:** approximate listing pins (never exact addresses).

### Priority 5 — Safety alerts

Replace the stub at `frontend/app/(dashboard)/alerts/page.tsx`.

- **Service:** NOAA NWS API (`api.weather.gov`) — free, no key, alerts by lat/lng zone.
- **Pattern:** same server-side fetch + cache as weather. Route handler `GET /api/alerts?lake=<name>`.
- **Synergy:** `posts.is_urgent` already exists — surface community-reported hazards alongside official NWS alerts.

### Priority 6 — Verified owner badges (trust layer)

- `verification_requests` table (`user_id`, `document_url`, `status`, `reviewed_at`) + `verified boolean` on `profiles`.
- Documents upload to a **private** storage bucket (not `listing-images`).
- Manual admin review first — check uploaded tax record or utility bill against profile address. Automate only if volume demands it.
- Badge renders on profiles, posts, and listings. Prerequisite for business directory credibility.

### Priority 7 — Rental checkout + insurance (legal review required first)

**Do not build this until you have reviewed it with a Michigan maritime attorney.**

Michigan MCL 324.44501–44526 (boat livery laws) requires:
- Registered boat livery permit for any paid PWC rental
- Boating safety certificate proof for PWC renters (MCL 324.44522)
- Signed liability waiver that meets Michigan standards

Once legal review is done:
- Integrate **Buoy** for per-trip motorized insurance (add-on at checkout)
- Integrate **Smartwaiver** for non-motorized digital waivers
- Age gating (18+ for PWC)
- Stripe for escrow/payment

---

## Dependency Graph

```
Security fixes (Priority 1) ── do immediately, unblocks trust
SQL migrations + Netlify vars ── unblocks prod messaging + canoe listings
                               │
Lake-scoped threads (2) ───────┼──► Comments + reactions (within 2)
                               ├──► Map (4) — needs lakes with coordinates ✓
                               ├──► Alerts (5) — same coordinate pattern
                               └──► Directory / Events (post-launch)
Marketplace polish (3) ──────── independent, fill-in work anytime
Verified badges (6) ─────────── before directory (post-launch)
Rental checkout (7) ─────────── requires Michigan maritime attorney first
```

---

## Known Technical Debt

| Issue | File | Severity |
|---|---|---|
| No auth check on `/api/notify-message` | `app/api/notify-message/route.ts` | High |
| Open-redirect via `?next=` in auth callback | `app/auth/callback/route.ts` | Medium |
| `listings` category CHECK constraint missing 'canoe' | DB — run `add_canoe_category.sql` | Medium |
| Feed not scoped by lake | `app/(dashboard)/feed/page.tsx` | Medium (roadmap item) |
| `profiles.lake_name` is still free text alongside new `lake_id` FK | DB + onboarding | Low — both columns coexist, gradual migration |
| Node 18 locally — Next.js 16 requires ≥ 20.9 | Local dev only | Low (Netlify runs 20+) |

---

## Commit Log

| Date | Who | What |
|---|---|---|
| 2026-06-09 | Claude | Created `HEARTBEAT.md` — initial project state snapshot, goals, and stack inventory |
| 2026-06-16 | Claude | Ripped out Clerk + Redis; replaced with Supabase (`@supabase/ssr`). Rewrote middleware, auth pages, dashboard, feed, onboarding, profile, TopNav, PostCard, CreatePost. Frontend now queries Supabase directly. |
| 2026-06-17 | Claude | Bug fix: `emailRedirectTo` `NetworkError` in Firefox. Removed redirect from signUp call. Supabase Site URL + Redirect URL config documented. |
| 2026-06-17 | Claude | Upgraded Next.js 15.1.0 → 16.2.9 (CVE-2025-55182). Removed stale `clerk-nextjs` submodule. |
| 2026-06-18 | Claude | Built marketplace: browse, create listing (5-photo upload to `listing-images` bucket), listing detail. `supabase/listings.sql` with RLS + storage policies. |
| 2026-06-19 | Claude | In-platform buyer↔seller messaging (`conversations`/`messages` tables, unread-count RPC), Resend email notifications, marketplace search + canoe category, removed clerk-nextjs ghost submodule permanently. |
| 2026-07-02 | Claude | Rewrote heartbeat. Built weather v1: `supabase/lakes.sql` (41 seeded MI lakes), `GET /api/weather?lake=` with geocoding fallback + 30-min cache, `WeatherCard` on feed. |
| 2026-07-19 | Claude | Forgot/reset password flow. Onboarding lake field: replaced free-text with autocomplete combobox (filtered against `lakes` table) + "Use my location" geolocation button (haversine nearest-lake). Merged `lakes.sql` from remote — 57 Michigan lakes, `created_at` column, lowercase name index. Extracted `haversineMiles` to `lib/geo.ts`. |
| 2026-07-19 | Claude | Added Vitest test suite: 40 JS tests across geo, notify-message API (incl. dedup + Resend payload), weather API (lake resolution + fallback chain + 502), auth-callback, and middleware route-protection matrix. Added `supabase/tests/rls.test.sql`: 32 pgTAP assertions covering all RLS policies for profiles, posts, listings, conversations, and messages. |
| 2026-07-21 | Claude | Sponsored feed cards (placement: feed_inline). Every 5th post slot injects a `SponsoredCard` — same card shape as `PostCard`, amber Megaphone avatar, "Sponsored" label, CTA link, impression tracking on hover. Targeted by `profiles.lake_id` (FK added to profiles via `ad_campaigns.sql`); falls back to run-of-house ads when no lake match. Onboarding now saves `lake_id` (uuid FK) alongside `lake_name` text. `AdCampaign` type added to `queries.ts`. Two seed ads: Torch Lake Marina (lake-targeted) + BoatUS (run-of-house). |
