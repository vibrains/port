-- Insights table for AI-generated analysis
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  channel VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  generated_by VARCHAR(255),
  model VARCHAR(100),
  prompt_context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_client ON insights(client_id, created_at DESC);
