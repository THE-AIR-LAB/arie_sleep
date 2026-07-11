-- ---------------------------------------------------------------------------
-- 0004_user_files
--   A per-user document library. Every file the user uploads (from any
--   conversation) is recorded here and browsable/reusable in one place. The raw
--   bytes live in the private `sleep-input-files` Storage bucket under
--   `${user_id}/library/...`; this table holds one manifest row per file.
--
--   Written by app/api/files/route.ts with the service-role client; ownership is
--   enforced in code by scoping every query to user_id (RLS stays disabled, like
--   the rest of the app). `conversation_id` records which conversation a file was
--   uploaded from (optional provenance); it nulls out if that conversation is
--   deleted so the file stays in the library.
--
--   This replaces the short-lived per-conversation manifest column added in
--   0003 (dropped below).
-- ---------------------------------------------------------------------------
create table if not exists public.user_files (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  conversation_id uuid references public.conversations(id) on delete set null,
  name            text not null,
  size            bigint not null default 0,
  type            text not null default 'application/octet-stream',
  bucket          text not null,
  path            text not null unique,
  created_at      timestamptz not null default now()
);

create index if not exists user_files_user_id_idx      on public.user_files (user_id);
create index if not exists user_files_user_created_idx on public.user_files (user_id, created_at desc);
create index if not exists user_files_conversation_idx on public.user_files (conversation_id);

-- The library table is the source of truth now; drop the per-conversation
-- manifest column from 0003 (no-op if 0003 was never applied).
alter table public.conversations drop column if exists uploaded_files;
