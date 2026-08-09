-- ============================================================
-- MyMichiganLake — Complete database setup
-- Run once in: Supabase Dashboard → SQL Editor → New query
-- Fully idempotent: safe to re-run on an existing database.
-- Tables created in FK-dependency order.
-- ============================================================


-- ── 1. LAKES ────────────────────────────────────────────────
-- Referenced by profiles.lake_id and ad_impressions.lake_id.

CREATE TABLE IF NOT EXISTS lakes (
  id         uuid             DEFAULT gen_random_uuid() PRIMARY KEY,
  name       text             UNIQUE NOT NULL,
  county     text,
  lat        double precision NOT NULL,
  lng        double precision NOT NULL,
  created_at timestamptz      DEFAULT now()
);

ALTER TABLE lakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read lakes" ON lakes;
CREATE POLICY "Anyone can read lakes" ON lakes FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS lakes_name_idx ON lakes (lower(name));

INSERT INTO lakes (name, county, lat, lng) VALUES
  -- Northern Lower Peninsula
  ('Houghton Lake',    'Roscommon',      44.315, -84.765),
  ('Higgins Lake',     'Roscommon',      44.482, -84.755),
  ('Torch Lake',       'Antrim',         44.972, -85.311),
  ('Elk Lake',         'Antrim',         44.852, -85.373),
  ('Pickerel Lake',    'Antrim',         44.998, -85.178),
  ('Thumb Lake',       'Antrim',         44.956, -84.949),
  ('Lake Charlevoix',  'Charlevoix',     45.284, -85.191),
  ('Walloon Lake',     'Charlevoix',     45.276, -85.001),
  ('Round Lake',       'Charlevoix',     45.320, -85.259),
  ('Burt Lake',        'Cheboygan',      45.472, -84.663),
  ('Mullett Lake',     'Cheboygan',      45.512, -84.510),
  ('Black Lake',       'Cheboygan',      45.463, -84.276),
  ('Glen Lake',        'Leelanau',       44.870, -85.980),
  ('Lake Leelanau',    'Leelanau',       44.983, -85.712),
  ('Crystal Lake',     'Benzie',         44.657, -86.163),
  ('Lake Ann',         'Benzie',         44.726, -85.988),
  ('Big Platte Lake',  'Benzie',         44.702, -86.096),
  ('Long Lake',        'Grand Traverse', 44.717, -85.750),
  ('Clam Lake',        'Wexford',        44.226, -85.428),
  ('Lake Cadillac',    'Wexford',        44.247, -85.435),
  ('Lake Mitchell',    'Wexford',        44.238, -85.474),
  ('Lake Missaukee',   'Missaukee',      44.320, -85.300),
  ('Hubbard Lake',     'Alcona',         44.770, -83.550),
  -- Western Lower Peninsula
  ('Hamlin Lake',      'Mason',          44.050, -86.420),
  ('Silver Lake',      'Oceana',         43.660, -86.490),
  ('White Lake',       'Muskegon',       43.380, -86.350),
  ('Muskegon Lake',    'Muskegon',       43.225, -86.297),
  ('Hardy Lake',       'Newaygo',        43.571, -85.604),
  -- Southwest Lower Peninsula
  ('Gull Lake',        'Kalamazoo',      42.398, -85.411),
  ('Gun Lake',         'Barry',          42.610, -85.510),
  ('Paw Paw Lake',     'Berrien',        42.213, -86.271),
  ('Diamond Lake',     'Cass',           41.870, -85.970),
  ('Crooked Lake',     'Cass',           41.970, -85.934),
  ('Klinger Lake',     'St. Joseph',     41.943, -85.807),
  ('Coldwater Lake',   'Branch',         41.833, -85.020),
  -- Southeast Lower Peninsula
  ('Devils Lake',      'Lenawee',        41.977, -84.283),
  ('Wamplers Lake',    'Lenawee',        42.048, -84.222),
  ('Clark Lake',       'Jackson',        42.121, -84.349),
  ('Lake Columbia',    'Jackson',        42.260, -84.405),
  ('Lake Fenton',      'Genesee',        42.828, -83.709),
  ('Lobdell Lake',     'Genesee',        42.755, -83.820),
  ('Base Line Lake',   'Livingston',     42.471, -84.011),
  ('Brighton Lake',    'Livingston',     42.528, -83.791),
  ('Zukey Lake',       'Livingston',     42.480, -83.879),
  ('Patterson Lake',   'Livingston',     42.527, -83.857),
  ('Lake Chemung',     'Livingston',     42.622, -83.880),
  ('Whitmore Lake',    'Washtenaw',      42.432, -83.752),
  ('Portage Lake',     'Washtenaw',      42.421, -83.921),
  -- Oakland County chain
  ('Walled Lake',      'Oakland',        42.538, -83.480),
  ('Cass Lake',        'Oakland',        42.603, -83.363),
  ('Orchard Lake',     'Oakland',        42.583, -83.393),
  ('Union Lake',       'Oakland',        42.610, -83.440),
  ('Pontiac Lake',     'Oakland',        42.670, -83.460),
  ('Elk Lake (Kent)',  'Kent',           43.079, -85.656),
  -- Upper Peninsula
  ('Lake Gogebic',     'Gogebic',        46.490, -89.590),
  ('Lake Michigamme',  'Marquette',      46.530, -88.120),
  ('Indian Lake',      'Schoolcraft',    45.980, -86.340),
  ('Manistique Lake',  'Luce',           46.240, -85.720)
ON CONFLICT (name) DO NOTHING;


-- ── 2. PROFILES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
  id                  uuid        REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name        text        NOT NULL,
  bio                 text,
  avatar_url          text,
  lake_name           text,
  lake_id             uuid        REFERENCES lakes(id),
  address_line1       text,
  city                text,
  state               text        DEFAULT 'MI',
  zip_code            text,
  onboarding_complete boolean     NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE INDEX IF NOT EXISTS profiles_lake_id_idx ON public.profiles (lake_id);


-- ── 3. POSTS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.posts (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    uuid        REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body       text        NOT NULL,
  category   text        NOT NULL DEFAULT 'general',
  is_urgent  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "posts_select" ON public.posts;
DROP POLICY IF EXISTS "posts_insert" ON public.posts;
DROP POLICY IF EXISTS "posts_delete" ON public.posts;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS posts_user_id_idx    ON public.posts (user_id);
CREATE INDEX IF NOT EXISTS posts_category_idx   ON public.posts (category);


-- ── 4. LISTINGS ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS listings (
  id          uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid         REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title       text         NOT NULL,
  description text,
  price       numeric(10,2),
  price_type  text         CHECK (price_type IN ('sale','rent_day','rent_hour','free')) NOT NULL DEFAULT 'sale',
  category    text         CHECK (category IN ('boats','pwc','dock','fishing','paddleboard','kayak','canoe','other')) NOT NULL,
  condition   text         CHECK (condition IN ('new','like_new','good','fair')),
  lake_name   text,
  images      text[]       DEFAULT '{}',
  status      text         CHECK (status IN ('active','sold','rented')) DEFAULT 'active',
  created_at  timestamptz  DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active listings" ON listings;
DROP POLICY IF EXISTS "Owners can view own listings"    ON listings;
DROP POLICY IF EXISTS "Users can create listings"       ON listings;
DROP POLICY IF EXISTS "Users can update own listings"   ON listings;
DROP POLICY IF EXISTS "Users can delete own listings"   ON listings;
CREATE POLICY "Anyone can view active listings" ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can view own listings"    ON listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create listings"       ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings"   ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings"   ON listings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_idx   ON listings (category);
CREATE INDEX IF NOT EXISTS listings_status_idx     ON listings (status);
CREATE INDEX IF NOT EXISTS listings_user_id_idx    ON listings (user_id);


-- ── 5. CONVERSATIONS & MESSAGES ─────────────────────────────

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid REFERENCES listings(id)  ON DELETE CASCADE NOT NULL,
  buyer_id   uuid REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  seller_id  uuid REFERENCES profiles(id)  ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       uuid REFERENCES profiles(id)      ON DELETE CASCADE NOT NULL,
  body            text NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
DROP POLICY IF EXISTS "Buyers can start conversations"     ON conversations;
CREATE POLICY "Participants can view conversations" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Buyers can start conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Participants can view messages"      ON messages;
DROP POLICY IF EXISTS "Participants can send messages"      ON messages;
DROP POLICY IF EXISTS "Participants can mark messages read" ON messages;
CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );
CREATE POLICY "Participants can mark messages read" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages      (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS conversations_buyer_idx      ON conversations  (buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_idx     ON conversations  (seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_idx    ON conversations  (listing_id);

CREATE OR REPLACE FUNCTION unread_message_count()
RETURNS integer
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    AND m.sender_id != auth.uid()
    AND m.read_at IS NULL;
$$;


-- ── 6. AD CAMPAIGNS & IMPRESSIONS ───────────────────────────

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title      text        NOT NULL,
  body       text        NOT NULL,
  cta_text   text        NOT NULL DEFAULT 'Learn More',
  cta_url    text        NOT NULL,
  image_url  text,
  placement  text        NOT NULL DEFAULT 'feed_inline',
  lake_ids   uuid[]      NOT NULL DEFAULT '{}',
  active     boolean     NOT NULL DEFAULT true,
  starts_at  timestamptz NOT NULL DEFAULT now(),
  ends_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ad_impressions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid        NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  user_id     uuid        REFERENCES profiles(id)  ON DELETE SET NULL,
  lake_id     uuid        REFERENCES lakes(id)     ON DELETE SET NULL,
  placement   text        NOT NULL DEFAULT 'feed_inline',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ad_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth reads active campaigns"    ON ad_campaigns;
DROP POLICY IF EXISTS "auth inserts own impression"    ON ad_impressions;
CREATE POLICY "auth reads active campaigns" ON ad_campaigns FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND active = true
    AND (ends_at IS NULL OR ends_at > now())
  );
CREATE POLICY "auth inserts own impression" ON ad_impressions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sample ads (idempotent — ON CONFLICT DO NOTHING)
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


-- ── 7. STORAGE ──────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read listing images"           ON storage.objects;
DROP POLICY IF EXISTS "Auth users can upload listing images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own listing images"  ON storage.objects;
CREATE POLICY "Public read listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');
CREATE POLICY "Auth users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own listing images" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── 8. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill any existing auth users who are missing a profiles row
INSERT INTO public.profiles (id, display_name)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    SPLIT_PART(u.email, '@', 1)
  )
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;
