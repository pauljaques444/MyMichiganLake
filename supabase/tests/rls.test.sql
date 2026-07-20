-- RLS Policy Tests — run with: supabase test db
-- Requires pgTAP: https://pgtap.org/
-- Supabase includes pgTAP by default in local dev (supabase start).
--
-- These tests simulate different user sessions by setting JWT claims and
-- switching roles. All changes are rolled back at the end.

BEGIN;
SELECT plan(32);

-- ── Fixtures ────────────────────────────────────────────────────────────────

\set user_a_id  '00000000-0000-0000-0000-aaaaaaaaaaaa'
\set user_b_id  '00000000-0000-0000-0000-bbbbbbbbbbbb'
\set listing_id '11111111-1111-1111-1111-111111111111'
\set conv_id    '22222222-2222-2222-2222-222222222222'

-- Insert test auth users (bypasses RLS — running as superuser here)
INSERT INTO auth.users (id, email, role, aud, created_at, updated_at)
VALUES
  (:'user_a_id', 'user_a@test.local', 'authenticated', 'authenticated', now(), now()),
  (:'user_b_id', 'user_b@test.local', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

-- Insert profiles for both users
INSERT INTO public.profiles (id, display_name, lake_name)
VALUES
  (:'user_a_id', 'User A', 'Torch Lake'),
  (:'user_b_id', 'User B', 'Higgins Lake')
ON CONFLICT (id) DO NOTHING;

-- Insert a listing owned by user_a
INSERT INTO public.listings (id, user_id, title, category, price_type, status)
VALUES (:'listing_id', :'user_a_id', 'Test Kayak', 'kayak', 'sale', 'active')
ON CONFLICT (id) DO NOTHING;

-- Insert a conversation (buyer = user_b, seller = user_a)
INSERT INTO public.conversations (id, listing_id, buyer_id, seller_id)
VALUES (:'conv_id', :'listing_id', :'user_b_id', :'user_a_id')
ON CONFLICT (id) DO NOTHING;

-- ── Helper: switch session to a specific user ────────────────────────────────

-- Usage: SELECT set_user_session('uuid-here');
CREATE OR REPLACE FUNCTION set_user_session(user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config(
    'request.jwt.claims',
    json_build_object('sub', user_id::text, 'role', 'authenticated')::text,
    true
  );
  SET LOCAL ROLE authenticated;
END;
$$;

-- ── PROFILES ─────────────────────────────────────────────────────────────────

-- 1. Anon cannot read profiles
SET LOCAL ROLE anon;
SELECT is(
  (SELECT COUNT(*)::integer FROM public.profiles),
  0,
  'anon: cannot read profiles'
);

-- 2. Authenticated user can read all profiles
SELECT set_user_session(:'user_a_id');
SELECT ok(
  (SELECT COUNT(*) FROM public.profiles) >= 2,
  'authenticated: can read all profiles'
);

-- 3. User can insert their own profile (user_a already exists, so test upsert behavior)
SELECT lives_ok(
  $$ INSERT INTO public.profiles (id, display_name) VALUES ('00000000-0000-0000-0000-aaaaaaaaaaaa'::uuid, 'User A Updated')
     ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name $$,
  'authenticated: user_a can upsert own profile'
);

-- 4. User cannot insert a profile for another user
SELECT throws_ok(
  $$ INSERT INTO public.profiles (id, display_name) VALUES ('00000000-0000-0000-0000-bbbbbbbbbbbb'::uuid, 'Impersonator') $$,
  '42501',
  NULL,
  'authenticated: user_a cannot insert profile for user_b'
);

-- 5. User can update their own profile
SELECT lives_ok(
  $$ UPDATE public.profiles SET bio = 'Updated bio' WHERE id = '00000000-0000-0000-0000-aaaaaaaaaaaa' $$,
  'authenticated: user_a can update own profile'
);

-- 6. User cannot update another user's profile
SELECT is(
  (SELECT COUNT(*)::integer
   FROM (UPDATE public.profiles SET bio = 'Hacked' WHERE id = '00000000-0000-0000-0000-bbbbbbbbbbbb' RETURNING id) q),
  0,
  'authenticated: user_a cannot update user_b profile'
);

-- ── POSTS ────────────────────────────────────────────────────────────────────

-- 7. Anon cannot read posts
SET LOCAL ROLE anon;
RESET request.jwt.claims;
SELECT is(
  (SELECT COUNT(*)::integer FROM public.posts),
  0,
  'anon: cannot read posts'
);

-- Insert a test post as user_a
SELECT set_user_session(:'user_a_id');
INSERT INTO public.posts (user_id, body, category)
VALUES (:'user_a_id', 'Test post', 'general');

-- 8. Authenticated user can read posts
SELECT ok(
  (SELECT COUNT(*) FROM public.posts) > 0,
  'authenticated: can read posts'
);

-- 9. User can insert their own post
SELECT lives_ok(
  $$ INSERT INTO public.posts (user_id, body, category)
     VALUES ('00000000-0000-0000-0000-aaaaaaaaaaaa', 'Another post', 'safety') $$,
  'authenticated: user_a can insert post for self'
);

-- 10. User cannot insert a post on behalf of another user
SELECT throws_ok(
  $$ INSERT INTO public.posts (user_id, body, category)
     VALUES ('00000000-0000-0000-0000-bbbbbbbbbbbb', 'Fake post', 'general') $$,
  '42501',
  NULL,
  'authenticated: user_a cannot insert post as user_b'
);

-- 11. User can delete their own post
SELECT lives_ok(
  $$ DELETE FROM public.posts WHERE user_id = '00000000-0000-0000-0000-aaaaaaaaaaaa' LIMIT 1 $$,
  'authenticated: user_a can delete own post'
);

-- 12. User cannot delete another user's post
SELECT set_user_session(:'user_b_id');
INSERT INTO public.posts (user_id, body, category)
VALUES (:'user_b_id', 'User B post', 'general');

SELECT set_user_session(:'user_a_id');
SELECT is(
  (SELECT COUNT(*)::integer
   FROM (DELETE FROM public.posts WHERE user_id = '00000000-0000-0000-0000-bbbbbbbbbbbb' RETURNING id) q),
  0,
  'authenticated: user_a cannot delete user_b post'
);

-- ── LISTINGS ─────────────────────────────────────────────────────────────────

-- 13. Anon can read active listings
SET LOCAL ROLE anon;
RESET request.jwt.claims;
SELECT ok(
  (SELECT COUNT(*) FROM public.listings WHERE status = 'active') > 0,
  'anon: can read active listings'
);

-- 14. Anon cannot read non-active listings
-- (policy: status = 'active' OR auth.uid() = user_id — anon has no uid)
SELECT is(
  (SELECT COUNT(*)::integer FROM public.listings WHERE status != 'active'),
  0,
  'anon: cannot read non-active listings'
);

-- 15. Owner can read their own inactive listing
SELECT set_user_session(:'user_a_id');
UPDATE public.listings SET status = 'sold' WHERE id = :'listing_id';
SELECT ok(
  (SELECT COUNT(*) FROM public.listings WHERE id = :'listing_id' AND status = 'sold') > 0,
  'owner: can read own non-active listing'
);
UPDATE public.listings SET status = 'active' WHERE id = :'listing_id'; -- restore

-- 16. Non-owner cannot read inactive listing
SELECT set_user_session(:'user_b_id');
-- First set it to sold as user_a
SELECT set_user_session(:'user_a_id');
UPDATE public.listings SET status = 'sold' WHERE id = :'listing_id';

SELECT set_user_session(:'user_b_id');
SELECT is(
  (SELECT COUNT(*)::integer FROM public.listings WHERE id = :'listing_id' AND status = 'sold'),
  0,
  'non-owner: cannot read another user sold listing'
);
SELECT set_user_session(:'user_a_id');
UPDATE public.listings SET status = 'active' WHERE id = :'listing_id';

-- 17. User can create listing for self
SELECT set_user_session(:'user_a_id');
SELECT lives_ok(
  $$ INSERT INTO public.listings (user_id, title, category, price_type)
     VALUES ('00000000-0000-0000-0000-aaaaaaaaaaaa', 'Another Kayak', 'kayak', 'sale') $$,
  'authenticated: user_a can create listing for self'
);

-- 18. User cannot create a listing for another user
SELECT throws_ok(
  $$ INSERT INTO public.listings (user_id, title, category, price_type)
     VALUES ('00000000-0000-0000-0000-bbbbbbbbbbbb', 'Fake Listing', 'other', 'free') $$,
  '42501',
  NULL,
  'authenticated: user_a cannot create listing as user_b'
);

-- 19. Owner can update own listing
SELECT lives_ok(
  $$ UPDATE public.listings SET title = 'Updated Kayak' WHERE id = '11111111-1111-1111-1111-111111111111' $$,
  'owner: can update own listing'
);

-- 20. Non-owner cannot update a listing
SELECT set_user_session(:'user_b_id');
SELECT is(
  (SELECT COUNT(*)::integer
   FROM (UPDATE public.listings SET title = 'Hacked' WHERE id = '11111111-1111-1111-1111-111111111111' RETURNING id) q),
  0,
  'non-owner: cannot update another user listing'
);

-- 21. Non-owner cannot delete a listing
SELECT is(
  (SELECT COUNT(*)::integer
   FROM (DELETE FROM public.listings WHERE id = '11111111-1111-1111-1111-111111111111' RETURNING id) q),
  0,
  'non-owner: cannot delete another user listing'
);

-- 22. Owner can delete own listing
SELECT set_user_session(:'user_a_id');
SELECT lives_ok(
  $$ DELETE FROM public.listings WHERE id = '11111111-1111-1111-1111-111111111111' AND user_id = '00000000-0000-0000-0000-aaaaaaaaaaaa' $$,
  'owner: can delete own listing'
);

-- Recreate listing for conversation tests
INSERT INTO public.listings (id, user_id, title, category, price_type, status)
VALUES (:'listing_id', :'user_a_id', 'Test Kayak', 'kayak', 'sale', 'active')
ON CONFLICT (id) DO NOTHING;

-- ── CONVERSATIONS ─────────────────────────────────────────────────────────────

-- 23. Buyer can read own conversation
SELECT set_user_session(:'user_b_id');
SELECT ok(
  (SELECT COUNT(*) FROM public.conversations WHERE id = :'conv_id') > 0,
  'buyer: can read own conversation'
);

-- 24. Seller can read own conversation
SELECT set_user_session(:'user_a_id');
SELECT ok(
  (SELECT COUNT(*) FROM public.conversations WHERE id = :'conv_id') > 0,
  'seller: can read own conversation'
);

-- 25. Third party cannot read conversation they are not part of
-- Create user_c temporarily
INSERT INTO auth.users (id, email, role, aud, created_at, updated_at)
VALUES ('00000000-0000-0000-0000-cccccccccccc', 'user_c@test.local', 'authenticated', 'authenticated', now(), now())
ON CONFLICT (id) DO NOTHING;

SELECT set_user_session('00000000-0000-0000-0000-cccccccccccc');
SELECT is(
  (SELECT COUNT(*)::integer FROM public.conversations WHERE id = :'conv_id'),
  0,
  'third-party: cannot read another user conversation'
);

-- 26. Buyer can start a conversation (insert with buyer_id = self)
SELECT set_user_session(:'user_b_id');
SELECT lives_ok(
  $$ INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
     VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-bbbbbbbbbbbb', '00000000-0000-0000-0000-aaaaaaaaaaaa')
     ON CONFLICT DO NOTHING $$,
  'buyer: can start a conversation'
);

-- 27. Non-buyer cannot start conversation with a fake buyer_id
SELECT throws_ok(
  $$ INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
     VALUES ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-aaaaaaaaaaaa', '00000000-0000-0000-0000-bbbbbbbbbbbb') $$,
  '42501',
  NULL,
  'user_b: cannot start conversation impersonating user_a as buyer'
);

-- ── MESSAGES ─────────────────────────────────────────────────────────────────

-- Insert a test message as user_b (buyer in conv_id)
SELECT set_user_session(:'user_b_id');
INSERT INTO public.messages (conversation_id, sender_id, body)
VALUES (:'conv_id', :'user_b_id', 'Is this still available?');

-- 28. Buyer can read messages in own conversation
SELECT ok(
  (SELECT COUNT(*) FROM public.messages WHERE conversation_id = :'conv_id') > 0,
  'buyer: can read messages in own conversation'
);

-- 29. Seller can read messages in own conversation
SELECT set_user_session(:'user_a_id');
SELECT ok(
  (SELECT COUNT(*) FROM public.messages WHERE conversation_id = :'conv_id') > 0,
  'seller: can read messages in own conversation'
);

-- 30. Third party cannot read messages in a conversation they are not in
SELECT set_user_session('00000000-0000-0000-0000-cccccccccccc');
SELECT is(
  (SELECT COUNT(*)::integer FROM public.messages WHERE conversation_id = :'conv_id'),
  0,
  'third-party: cannot read messages in other conversation'
);

-- 31. Participant can send a message (sender_id = self)
SELECT set_user_session(:'user_a_id');
SELECT lives_ok(
  $$ INSERT INTO public.messages (conversation_id, sender_id, body)
     VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-aaaaaaaaaaaa', 'Yes, still available!') $$,
  'seller: can send message in own conversation'
);

-- 32. Participant cannot spoof a message from another user
SELECT throws_ok(
  $$ INSERT INTO public.messages (conversation_id, sender_id, body)
     VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-bbbbbbbbbbbb', 'Spoofed message') $$,
  '42501',
  NULL,
  'seller: cannot insert message with spoofed sender_id'
);

-- ── Finish ───────────────────────────────────────────────────────────────────

SELECT * FROM finish();
ROLLBACK;
