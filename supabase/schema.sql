-- ============================================================
-- MyMichiganLake — Supabase schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Profiles (one row per auth user)
create table if not exists public.profiles (
  id                  uuid references auth.users on delete cascade primary key,
  display_name        text not null,
  bio                 text,
  avatar_url          text,
  lake_name           text,
  address_line1       text,
  city                text,
  state               text default 'MI',
  zip_code            text,
  onboarding_complete boolean not null default false,
  created_at          timestamptz not null default now()
);

-- Posts
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  body        text not null,
  category    text not null default 'general',
  is_urgent   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.posts     enable row level security;

-- Profiles: anyone authenticated can read, only owner can write
create policy "profiles_select" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "profiles_insert" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update" on public.profiles
  for update using (auth.uid() = id);

-- Posts: anyone authenticated can read, only owner can insert/delete
create policy "posts_select" on public.posts
  for select using (auth.role() = 'authenticated');

create policy "posts_insert" on public.posts
  for insert with check (auth.uid() = user_id);

create policy "posts_delete" on public.posts
  for delete using (auth.uid() = user_id);

-- ── Indexes ─────────────────────────────────────────────────

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx    on public.posts (user_id);
create index if not exists posts_category_idx   on public.posts (category);
