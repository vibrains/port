-- Monthly insight reports: one rich-text report per month, with a custom title
CREATE TABLE IF NOT EXISTS insight_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  report_month VARCHAR(7) NOT NULL,  -- 'YYYY-MM'
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, report_month)
);

CREATE INDEX idx_insight_reports_client_month ON insight_reports (client_id, report_month DESC);
