-- Run in Supabase SQL Editor to add 'canoe' to the listings category constraint

ALTER TABLE listings DROP CONSTRAINT IF EXISTS listings_category_check;
ALTER TABLE listings ADD CONSTRAINT listings_category_check
  CHECK (category IN ('boats','pwc','dock','fishing','paddleboard','kayak','canoe','other'));
