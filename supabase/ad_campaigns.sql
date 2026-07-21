-- Ad system: campaigns, impressions, and lake targeting
-- Run in Supabase SQL Editor after lakes.sql has been seeded.
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING throughout).

-- ── 1. Add lake_id FK to profiles ──────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lake_id uuid REFERENCES lakes(id);
CREATE INDEX IF NOT EXISTS profiles_lake_id_idx ON profiles(lake_id);

-- ── 2. Ad campaigns ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text        NOT NULL,
  body       text        NOT NULL,
  cta_text   text        NOT NULL DEFAULT 'Learn More',
  cta_url    text        NOT NULL,
  image_url  text,
  placement  text        NOT NULL DEFAULT 'feed_inline',
  -- empty array = run-of-house (all lakes); populated = lake-targeted
  lake_ids   uuid[]      NOT NULL DEFAULT '{}',
  active     boolean     NOT NULL DEFAULT true,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  ends_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read active, non-expired campaigns (client-side fetch)
CREATE POLICY "auth reads active campaigns"
  ON ad_campaigns FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND active = true
    AND (ends_at IS NULL OR ends_at > now())
  );

-- ── 3. Impression tracking ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ad_impressions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid        NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  lake_id     uuid        REFERENCES lakes(id) ON DELETE SET NULL,
  placement   text        NOT NULL DEFAULT 'feed_inline',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth inserts own impression"
  ON ad_impressions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ── 4. Sample Torch Lake Marina ad ─────────────────────────────────────────
-- Inserted only if a row with this title doesn't exist yet.
INSERT INTO ad_campaigns (title, body, cta_text, cta_url, placement, lake_ids)
SELECT
  'Torch Lake Marina — Full-Service Boat Care',
  'From spring commissioning to winter storage, Torch Lake Marina has kept your neighbors'' boats running since 1987. Certified techs, slip rentals, and on-water service at the north end of the Chain.',
  'Get in touch',
  'https://example.com/torch-lake-marina',
  'feed_inline',
  ARRAY[l.id]
FROM lakes l
WHERE l.name = 'Torch Lake'
ON CONFLICT DO NOTHING;

-- Run-of-house sample (shows to everyone regardless of lake)
INSERT INTO ad_campaigns (title, body, cta_text, cta_url, placement, lake_ids)
VALUES (
  'BoatUS — Towing & Emergency Assistance',
  'One call gets you unlimited towing, fuel delivery, soft ungroundings, and jump starts anywhere on Michigan''s inland lakes. Plans start at $99/year.',
  'Get covered',
  'https://www.boatus.com/membership',
  'feed_inline',
  '{}'
)
ON CONFLICT DO NOTHING;
