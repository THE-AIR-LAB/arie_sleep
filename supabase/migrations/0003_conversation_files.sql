-- ---------------------------------------------------------------------------
-- 0003_conversation_files
--   Adds a per-conversation file manifest so users can attach files (CSV, JSON,
--   PDF, images) to a sleep-studio conversation to share with the human expert.
--
--   The raw bytes live in the private `sleep-input-files` Storage bucket (the
--   same bucket the /demo/sleep/input setup uses; created manually via the
--   Supabase dashboard). This column only stores the manifest — one object per
--   uploaded file with the shape:
--     { name, size, type, bucket, path, uploaded_at }
--   written by app/api/conversations/[id]/files/route.ts (service-role client,
--   ownership enforced in code via user_id, matching the rest of the app).
-- ---------------------------------------------------------------------------
alter table public.conversations
  add column if not exists uploaded_files jsonb not null default '[]'::jsonb;
