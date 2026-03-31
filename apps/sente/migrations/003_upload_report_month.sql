-- Add report_month column to data_uploads for monthly categorization
-- Format: "YYYY-MM" (e.g., "2026-02" for February 2026)

ALTER TABLE data_uploads ADD COLUMN report_month VARCHAR(7);

CREATE INDEX idx_data_uploads_report_month ON data_uploads (client_id, report_month);

-- Backfill existing rows from period_start where available
UPDATE data_uploads
SET report_month = TO_CHAR(period_start, 'YYYY-MM')
WHERE period_start IS NOT NULL AND report_month IS NULL;
