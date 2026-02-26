-- ============================================
-- KeysAndFingers — Supabase Database Setup
-- Run this once in Supabase SQL Editor
-- supabase.com → your project → SQL Editor
-- ============================================


-- 1. Create the GC messages table
-- ------------------------------------
CREATE TABLE gc_messages (
  id          TEXT PRIMARY KEY,
  sender_id   TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- 2. Index for fast time-based queries and cleanup
-- ------------------------------------
CREATE INDEX idx_gc_messages_created_at ON gc_messages (created_at);


-- 3. Row Level Security
-- Allow anyone to read and insert (no login required)
-- ------------------------------------
ALTER TABLE gc_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON gc_messages FOR SELECT
  USING (true);

CREATE POLICY "public insert"
  ON gc_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public update"
  ON gc_messages FOR UPDATE
  USING (true);


-- 4. Auto-delete messages older than 7 days
-- Runs every hour via pg_cron (built into Supabase free tier)
-- ------------------------------------
SELECT cron.schedule(
  'delete-old-gc-messages',
  '0 * * * *',
  $$ DELETE FROM gc_messages WHERE created_at < NOW() - INTERVAL '7 days' $$
);


-- ============================================
-- Done! That's all you need to run.
-- ============================================
