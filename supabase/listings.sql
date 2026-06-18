-- Run this in your Supabase SQL Editor (supabase.com/dashboard/project/_/sql)

CREATE TABLE IF NOT EXISTS listings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title       text NOT NULL,
  description text,
  price       numeric(10,2),
  price_type  text CHECK (price_type IN ('sale','rent_day','rent_hour','free')) NOT NULL DEFAULT 'sale',
  category    text CHECK (category IN ('boats','pwc','dock','fishing','paddleboard','kayak','other')) NOT NULL,
  condition   text CHECK (condition IN ('new','like_new','good','fair')),
  lake_name   text,
  images      text[] DEFAULT '{}',
  status      text CHECK (status IN ('active','sold','rented')) DEFAULT 'active',
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active listings"   ON listings FOR SELECT USING (status = 'active');
CREATE POLICY "Owners can view own listings"      ON listings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create listings"         ON listings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own listings"     ON listings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own listings"     ON listings FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS listings_created_at_idx ON listings (created_at DESC);
CREATE INDEX IF NOT EXISTS listings_category_idx   ON listings (category);
CREATE INDEX IF NOT EXISTS listings_status_idx     ON listings (status);
CREATE INDEX IF NOT EXISTS listings_user_id_idx    ON listings (user_id);

-- Storage bucket for listing photos
-- If this fails, create the bucket manually in Storage > New bucket (name: listing-images, public: on)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read listing images" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-images');

CREATE POLICY "Auth users can upload listing images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own listing images" ON storage.objects
  FOR DELETE USING (bucket_id = 'listing-images' AND auth.uid()::text = (storage.foldername(name))[1]);
