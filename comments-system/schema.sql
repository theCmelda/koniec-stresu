-- =====================================================
-- KONIEC STRESU — Comment system schema
-- Run this in Supabase SQL Editor for the new project
-- =====================================================

-- ===== EXTENSIONS =====
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ===== ENUMS =====
create type comment_status as enum (
  'pending',     -- waiting for email verification
  'published',   -- verified and visible on the site
  'flagged',     -- failed auto-moderation, needs manual review
  'rejected',    -- admin rejected
  'spam'         -- marked as spam
);

create type moderation_reason as enum (
  'clean',
  'spam',
  'profanity',
  'nsfw',
  'hate',
  'self_harm',
  'promo',
  'phi'          -- personal health info / medical advice
);

-- ===== TABLE: comments =====
create table public.comments (
  id              uuid primary key default uuid_generate_v4(),
  post_slug       text not null,                      -- e.g. "ako-rychlo-zaspat"
  parent_id       uuid references public.comments(id) on delete cascade,  -- for replies
  first_name      text not null check (char_length(first_name) between 1 and 50),
  email           text not null,                       -- never displayed publicly
  email_hash      text not null,                       -- sha256(email) for analytics/dedup
  body            text not null check (char_length(body) between 2 and 5000),
  status          comment_status not null default 'pending',
  moderation_reason moderation_reason not null default 'clean',
  moderation_score jsonb,                              -- raw OpenAI moderation response
  ip_hash         text,                                -- sha256(ip + salt) for rate limiting
  user_agent      text,
  created_at      timestamptz not null default now(),
  verified_at     timestamptz,                         -- when magic link was clicked
  reviewed_at     timestamptz,                         -- admin review timestamp
  reviewed_by     text                                 -- admin email
);

-- indexes for fast lookups
create index idx_comments_post_status on public.comments(post_slug, status, created_at desc);
create index idx_comments_email_hash on public.comments(email_hash);
create index idx_comments_status_created on public.comments(status, created_at desc) where status != 'published';
create index idx_comments_parent on public.comments(parent_id) where parent_id is not null;

-- ===== TABLE: verification_tokens =====
-- Magic-link tokens, one per pending comment, 24h TTL
create table public.verification_tokens (
  token        text primary key,                       -- 32-byte random hex
  comment_id   uuid not null references public.comments(id) on delete cascade,
  expires_at   timestamptz not null default (now() + interval '24 hours'),
  used_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index idx_tokens_comment on public.verification_tokens(comment_id);
create index idx_tokens_expires on public.verification_tokens(expires_at) where used_at is null;

-- ===== TABLE: rate_limits =====
-- Track comment submission rate per IP/email to prevent spam floods
create table public.rate_limits (
  id            bigserial primary key,
  bucket_key    text not null,                         -- "ip:abc..." or "email:xyz..."
  bucket_type   text not null check (bucket_type in ('ip', 'email')),
  created_at    timestamptz not null default now()
);

create index idx_rate_limits_lookup on public.rate_limits(bucket_key, created_at desc);

-- ===== ROW LEVEL SECURITY =====
alter table public.comments enable row level security;
alter table public.verification_tokens enable row level security;
alter table public.rate_limits enable row level security;

-- Public can READ only published comments
create policy "Public reads published comments"
  on public.comments for select
  using (status = 'published');

-- All writes go through service role (server-side only)
-- No anon write policy on purpose

-- ===== HELPER FUNCTIONS =====

-- Returns count of comments for a post (only published)
create or replace function public.comment_count(slug text)
returns bigint
language sql
stable
as $$
  select count(*) from public.comments
  where post_slug = slug and status = 'published';
$$;

-- Cleanup expired tokens (run via Supabase cron or Vercel cron)
create or replace function public.cleanup_expired_tokens()
returns void
language sql
as $$
  delete from public.verification_tokens
  where expires_at < now() - interval '7 days';

  delete from public.rate_limits
  where created_at < now() - interval '24 hours';

  -- Auto-reject pending comments that never got verified after 48h
  update public.comments
  set status = 'rejected', reviewed_at = now()
  where status = 'pending'
    and created_at < now() - interval '48 hours';
$$;

-- ===== VIEW: published comments for public reads =====
create or replace view public.published_comments as
select
  id,
  post_slug,
  parent_id,
  first_name,
  body,
  created_at,
  verified_at
from public.comments
where status = 'published'
order by created_at asc;

grant select on public.published_comments to anon, authenticated;

-- ===== ADMIN: flagged queue =====
create or replace view public.flagged_queue as
select
  id,
  post_slug,
  first_name,
  email,
  body,
  status,
  moderation_reason,
  moderation_score,
  created_at
from public.comments
where status = 'flagged'
order by created_at desc;

-- Only service_role can see flagged
revoke all on public.flagged_queue from anon, authenticated;
