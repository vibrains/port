-- Migration: Executive Summaries Table
-- Stores per-channel rich text summaries editable by admins

CREATE TABLE IF NOT EXISTS executive_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, channel)
);
