-- ============================================================================
-- Sente Marketing Performance Dashboard
-- Initial Schema Migration for Sevalla PostgreSQL
-- ============================================================================
-- Run this against your Sevalla database to set up all tables, indexes,
-- triggers, and seed data.
--
-- Usage:
--   psql $DATABASE_URL -f migrations/001_initial_schema.sql
--
-- This script is idempotent — safe to run multiple times.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- CLIENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  client_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- DATA UPLOADS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS data_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255),
  row_count INTEGER,
  period_start DATE,
  period_end DATE,
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'processing',
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- ----------------------------------------------------------------------------
-- KLAVIYO FLOWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS klaviyo_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  flow_id VARCHAR(100),
  flow_name VARCHAR(255),
  period VARCHAR(50),
  period_start DATE,
  period_end DATE,
  channel VARCHAR(20),
  status VARCHAR(50),
  total_recipients INTEGER DEFAULT 0,
  open_rate DECIMAL(7,6),
  click_rate DECIMAL(7,6),
  unsubscribe_rate DECIMAL(7,6),
  bounce_rate DECIMAL(7,6),
  spam_rate DECIMAL(7,6),
  sms_failed_rate DECIMAL(7,6),
  total_placed_order DECIMAL(12,2) DEFAULT 0,
  placed_order_rate DECIMAL(7,6),
  revenue DECIMAL(12,2),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- EMAIL CAMPAIGNS (Klaviyo + Pardot)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  source VARCHAR(20) NOT NULL,
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(500),
  subject VARCHAR(500),
  preview_text TEXT,
  send_date TIMESTAMPTZ,
  send_time TIME,
  day_of_week VARCHAR(20),
  segment_name VARCHAR(255),
  total_recipients INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  delivery_rate DECIMAL(7,6),
  unique_opens INTEGER DEFAULT 0,
  open_rate DECIMAL(7,6),
  unique_clicks INTEGER DEFAULT 0,
  click_rate DECIMAL(7,6),
  click_to_open_rate DECIMAL(7,6),
  unsubscribes INTEGER DEFAULT 0,
  unsubscribe_rate DECIMAL(7,6),
  bounces INTEGER DEFAULT 0,
  bounce_rate DECIMAL(7,6),
  spam_complaints INTEGER DEFAULT 0,
  spam_rate DECIMAL(7,6),
  revenue DECIMAL(12,2),
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- PARDOT FLOWS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pardot_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  program_name VARCHAR(255),
  step_type VARCHAR(50),
  step_name VARCHAR(255),
  asset_name VARCHAR(255),
  sent INTEGER DEFAULT 0,
  skipped INTEGER DEFAULT 0,
  delivered INTEGER DEFAULT 0,
  delivery_rate DECIMAL(7,6),
  unique_opens INTEGER DEFAULT 0,
  open_rate DECIMAL(7,6),
  unique_clicks INTEGER DEFAULT 0,
  click_rate DECIMAL(7,6),
  click_to_open_rate DECIMAL(7,6),
  opt_outs INTEGER DEFAULT 0,
  opt_out_rate DECIMAL(7,6),
  bounces INTEGER DEFAULT 0,
  bounce_rate DECIMAL(7,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- GA4 PAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  page_path VARCHAR(500),
  page_title VARCHAR(500),
  source_medium VARCHAR(255),
  source VARCHAR(100),
  medium VARCHAR(100),
  views INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,
  views_per_user DECIMAL(10,4),
  avg_engagement_time DECIMAL(10,4),
  event_count INTEGER DEFAULT 0,
  first_visits INTEGER DEFAULT 0,
  key_events INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- GA4 ACQUISITION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ga4_acquisition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  period_start DATE,
  period_end DATE,
  first_user_source VARCHAR(100),
  sessions INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  returning_users INTEGER DEFAULT 0,
  engaged_sessions INTEGER DEFAULT 0,
  engagement_rate DECIMAL(7,6),
  avg_engagement_time DECIMAL(10,4),
  event_count INTEGER DEFAULT 0,
  key_events INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  user_key_event_rate DECIMAL(7,6),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- SOCIAL POSTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES data_uploads(id) ON DELETE SET NULL,
  post_id VARCHAR(100),
  network VARCHAR(50),
  post_type VARCHAR(50),
  content_type VARCHAR(50),
  profile VARCHAR(100),
  published_at TIMESTAMPTZ,
  post_url TEXT,
  post_text TEXT,
  permalink VARCHAR(500),
  impressions INTEGER DEFAULT 0,
  organic_impressions INTEGER DEFAULT 0,
  paid_impressions INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  organic_reach INTEGER DEFAULT 0,
  paid_reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(7,6),
  engagements INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  post_clicks INTEGER DEFAULT 0,
  link_clicks INTEGER DEFAULT 0,
  video_views INTEGER DEFAULT 0,
  organic_video_views INTEGER DEFAULT 0,
  paid_video_views INTEGER DEFAULT 0,
  full_video_views INTEGER DEFAULT 0,
  full_video_view_rate DECIMAL(7,6),
  avg_watch_time_seconds DECIMAL(10,2),
  story_taps_back INTEGER DEFAULT 0,
  story_taps_forward INTEGER DEFAULT 0,
  story_exits INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- TRIGGER: auto-update updated_at on clients
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Klaviyo Flows
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_client_period ON klaviyo_flows(client_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_name ON klaviyo_flows(flow_name);
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_channel ON klaviyo_flows(channel);

-- Email Campaigns
CREATE INDEX IF NOT EXISTS idx_email_campaigns_client_date ON email_campaigns(client_id, send_date);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_source ON email_campaigns(source);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_name ON email_campaigns(campaign_name);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_day_of_week ON email_campaigns(day_of_week);

-- Pardot Flows
CREATE INDEX IF NOT EXISTS idx_pardot_flows_client ON pardot_flows(client_id);
CREATE INDEX IF NOT EXISTS idx_pardot_flows_program ON pardot_flows(program_name);

-- GA4 Pages
CREATE INDEX IF NOT EXISTS idx_ga4_pages_client_period ON ga4_pages(client_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ga4_pages_path ON ga4_pages(page_path);
CREATE INDEX IF NOT EXISTS idx_ga4_pages_source_medium ON ga4_pages(source, medium);
CREATE INDEX IF NOT EXISTS idx_ga4_pages_title ON ga4_pages(page_title);

-- GA4 Acquisition
CREATE INDEX IF NOT EXISTS idx_ga4_acquisition_client_period ON ga4_acquisition(client_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_ga4_acquisition_source ON ga4_acquisition(first_user_source);

-- Social Posts
CREATE INDEX IF NOT EXISTS idx_social_posts_client_date ON social_posts(client_id, published_at);
CREATE INDEX IF NOT EXISTS idx_social_posts_network ON social_posts(network);
CREATE INDEX IF NOT EXISTS idx_social_posts_type ON social_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_social_posts_profile ON social_posts(profile);

-- Data Uploads
CREATE INDEX IF NOT EXISTS idx_data_uploads_client ON data_uploads(client_id, uploaded_at);
CREATE INDEX IF NOT EXISTS idx_data_uploads_status ON data_uploads(status);
CREATE INDEX IF NOT EXISTS idx_data_uploads_source_type ON data_uploads(source_type);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(id) WHERE deleted_at IS NULL;

-- Users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- SEED: Initial Sente client
-- ============================================================================
INSERT INTO clients (id, name, slug, settings, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
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

-- Seed admin user (matches hardcoded auth fallback)
INSERT INTO users (id, email, name, role, client_ids, created_at)
VALUES (
  'bb0e8400-e29b-41d4-a716-446655440001',
  'admin@sente.com',
  'Admin User',
  'admin',
  ARRAY['550e8400-e29b-41d4-a716-446655440000']::UUID[],
  NOW()
)
ON CONFLICT (email) DO NOTHING;

COMMIT;
