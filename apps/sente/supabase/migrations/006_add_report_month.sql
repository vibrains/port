-- Migration: 006_add_report_month.sql
-- Description: Add report_month column to data_uploads for monthly categorization
-- Created: 2026-03-11

ALTER TABLE data_uploads ADD COLUMN IF NOT EXISTS report_month VARCHAR(7);

COMMENT ON COLUMN data_uploads.report_month IS 'Month identifier in YYYY-MM format for grouping uploads by reporting period';
