-- Migration: 002_indexes.sql
-- Description: Performance indexes for Sente Marketing Performance Dashboard
-- Created: 2026-02-03

-- ============================================================================
-- KLAVIYO FLOWS INDEXES
-- ============================================================================

-- Index for querying flows by client and date range (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_client_period 
  ON klaviyo_flows(client_id, period_start, period_end);

COMMENT ON INDEX idx_klaviyo_flows_client_period IS 'Optimizes queries filtering flows by client and date range';

-- Index for flow name searches
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_name 
  ON klaviyo_flows(flow_name);

COMMENT ON INDEX idx_klaviyo_flows_name IS 'Optimizes searches by flow name';

-- Index for channel filtering
CREATE INDEX IF NOT EXISTS idx_klaviyo_flows_channel 
  ON klaviyo_flows(channel);

COMMENT ON INDEX idx_klaviyo_flows_channel IS 'Optimizes filtering by channel (email, sms)';

-- ============================================================================
-- EMAIL CAMPAIGNS INDEXES
-- ============================================================================

-- Index for querying campaigns by client and send date
CREATE INDEX IF NOT EXISTS idx_email_campaigns_client_date 
  ON email_campaigns(client_id, send_date);

COMMENT ON INDEX idx_email_campaigns_client_date IS 'Optimizes queries filtering campaigns by client and send date';

-- Index for source filtering (Klaviyo vs Pardot)
CREATE INDEX IF NOT EXISTS idx_email_campaigns_source 
  ON email_campaigns(source);

COMMENT ON INDEX idx_email_campaigns_source IS 'Optimizes filtering by source platform (klaviyo, pardot)';

-- Index for campaign name searches
CREATE INDEX IF NOT EXISTS idx_email_campaigns_name 
  ON email_campaigns(campaign_name);

COMMENT ON INDEX idx_email_campaigns_name IS 'Optimizes searches by campaign name';

-- Index for day of week analysis
CREATE INDEX IF NOT EXISTS idx_email_campaigns_day_of_week 
  ON email_campaigns(day_of_week);

COMMENT ON INDEX idx_email_campaigns_day_of_week IS 'Optimizes day-of-week performance analysis';

-- ============================================================================
-- PARDOT FLOWS INDEXES
-- ============================================================================

-- Index for querying Pardot flows by client
CREATE INDEX IF NOT EXISTS idx_pardot_flows_client 
  ON pardot_flows(client_id);

COMMENT ON INDEX idx_pardot_flows_client IS 'Optimizes queries filtering Pardot flows by client';

-- Index for program name searches
CREATE INDEX IF NOT EXISTS idx_pardot_flows_program 
  ON pardot_flows(program_name);

COMMENT ON INDEX idx_pardot_flows_program IS 'Optimizes searches by program name';

-- ============================================================================
-- GA4 PAGES INDEXES
-- ============================================================================

-- Index for querying pages by client and date range
CREATE INDEX IF NOT EXISTS idx_ga4_pages_client_period 
  ON ga4_pages(client_id, period_start, period_end);

COMMENT ON INDEX idx_ga4_pages_client_period IS 'Optimizes queries filtering pages by client and date range';

-- Index for page path analysis
CREATE INDEX IF NOT EXISTS idx_ga4_pages_path 
  ON ga4_pages(page_path);

COMMENT ON INDEX idx_ga4_pages_path IS 'Optimizes queries filtering by page path';

-- Index for source/medium analysis
CREATE INDEX IF NOT EXISTS idx_ga4_pages_source_medium 
  ON ga4_pages(source, medium);

COMMENT ON INDEX idx_ga4_pages_source_medium IS 'Optimizes source/medium performance analysis';

-- Index for page title searches
CREATE INDEX IF NOT EXISTS idx_ga4_pages_title 
  ON ga4_pages(page_title);

COMMENT ON INDEX idx_ga4_pages_title IS 'Optimizes searches by page title';

-- ============================================================================
-- GA4 ACQUISITION INDEXES
-- ============================================================================

-- Index for querying acquisition by client and date range
CREATE INDEX IF NOT EXISTS idx_ga4_acquisition_client_period 
  ON ga4_acquisition(client_id, period_start, period_end);

COMMENT ON INDEX idx_ga4_acquisition_client_period IS 'Optimizes queries filtering acquisition data by client and date range';

-- Index for first user source analysis
CREATE INDEX IF NOT EXISTS idx_ga4_acquisition_source 
  ON ga4_acquisition(first_user_source);

COMMENT ON INDEX idx_ga4_acquisition_source IS 'Optimizes queries filtering by traffic source';

-- ============================================================================
-- SOCIAL POSTS INDEXES
-- ============================================================================

-- Index for querying posts by client and publish date
CREATE INDEX IF NOT EXISTS idx_social_posts_client_date 
  ON social_posts(client_id, published_at);

COMMENT ON INDEX idx_social_posts_client_date IS 'Optimizes queries filtering posts by client and publish date';

-- Index for network filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_network 
  ON social_posts(network);

COMMENT ON INDEX idx_social_posts_network IS 'Optimizes filtering by social network (facebook, instagram, etc.)';

-- Index for post type filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_type 
  ON social_posts(post_type);

COMMENT ON INDEX idx_social_posts_type IS 'Optimizes filtering by post type (feed, story, reel, etc.)';

-- Index for profile filtering
CREATE INDEX IF NOT EXISTS idx_social_posts_profile 
  ON social_posts(profile);

COMMENT ON INDEX idx_social_posts_profile IS 'Optimizes filtering by social media profile';

-- ============================================================================
-- DATA UPLOADS INDEXES
-- ============================================================================

-- Index for querying uploads by client and upload date
CREATE INDEX IF NOT EXISTS idx_data_uploads_client 
  ON data_uploads(client_id, uploaded_at);

COMMENT ON INDEX idx_data_uploads_client IS 'Optimizes queries filtering uploads by client and date';

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_data_uploads_status 
  ON data_uploads(status);

COMMENT ON INDEX idx_data_uploads_status IS 'Optimizes filtering by upload status';

-- Index for source type filtering
CREATE INDEX IF NOT EXISTS idx_data_uploads_source_type 
  ON data_uploads(source_type);

COMMENT ON INDEX idx_data_uploads_source_type IS 'Optimizes filtering by data source type';

-- ============================================================================
-- CLIENTS INDEXES
-- ============================================================================

-- Index for slug lookups (used in URLs)
CREATE INDEX IF NOT EXISTS idx_clients_slug 
  ON clients(slug);

COMMENT ON INDEX idx_clients_slug IS 'Optimizes client lookups by slug (URL-friendly identifier)';

-- Partial index for active clients (soft delete support)
CREATE INDEX IF NOT EXISTS idx_clients_active 
  ON clients(id) 
  WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_clients_active IS 'Optimizes queries for active (non-deleted) clients';

-- ============================================================================
-- USERS INDEXES
-- ============================================================================

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

COMMENT ON INDEX idx_users_email IS 'Optimizes user lookups by email for authentication';

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_users_role 
  ON users(role);

COMMENT ON INDEX idx_users_role IS 'Optimizes filtering users by role';
