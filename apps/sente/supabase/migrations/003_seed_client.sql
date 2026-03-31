-- Migration: 003_seed_client.sql
-- Description: Seed initial client data for Sente Marketing Performance Dashboard
-- Created: 2026-02-03

-- ============================================================================
-- SEED SENTE AS INITIAL CLIENT
-- ============================================================================

-- Insert Sente as the initial client
-- This client will be used for development and initial testing
INSERT INTO clients (name, slug, settings, created_at, updated_at)
VALUES (
  'Sente', 
  'sente',
  '{
    "timezone": "America/New_York",
    "currency": "USD",
    "primary_color": "#0F172A",
    "logo_url": null
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE clients IS 'Client organizations for multi-tenancy. Seeded with Sente as initial client.';
