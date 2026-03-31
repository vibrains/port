-- Migration: 001_initial_schema.sql
-- Description: Initial database schema for Sente Marketing Performance Dashboard
-- Created: 2026-02-03

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CLIENTS TABLE
-- Multi-tenancy ready client organization table with soft delete support
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE clients IS 'Client organizations for multi-tenancy. Each client has isolated data.';
COMMENT ON COLUMN clients.id IS 'Unique identifier for the client';
COMMENT ON COLUMN clients.name IS 'Display name of the client organization';
COMMENT ON COLUMN clients.slug IS 'URL-friendly unique identifier for the client';
COMMENT ON COLUMN clients.settings IS 'JSONB storage for client-specific configuration (timezone, currency, colors, etc.)';
COMMENT ON COLUMN clients.created_at IS 'Timestamp when the client was created';
COMMENT ON COLUMN clients.updated_at IS 'Timestamp when the client was last updated';
COMMENT ON COLUMN clients.deleted_at IS 'Soft delete timestamp - NULL if active, set when deleted';

-- ============================================================================
-- DATA UPLOADS TABLE
-- Tracks all CSV/data imports with status and metadata
-- ============================================================================
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

COMMENT ON TABLE data_uploads IS 'Tracks all data imports/uploads from various marketing platforms';
COMMENT ON COLUMN data_uploads.id IS 'Unique identifier for the upload';
COMMENT ON COLUMN data_uploads.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN data_uploads.source_type IS 'Type of data source: klaviyo_campaigns, klaviyo_flows, pardot_campaigns, pardot_flows, ga4_pages, ga4_acquisition, sprout_social';
COMMENT ON COLUMN data_uploads.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN data_uploads.row_count IS 'Number of rows processed from the upload';
COMMENT ON COLUMN data_uploads.period_start IS 'Start date of the data period covered';
COMMENT ON COLUMN data_uploads.period_end IS 'End date of the data period covered';
COMMENT ON COLUMN data_uploads.uploaded_by IS 'Identifier of the user who performed the upload';
COMMENT ON COLUMN data_uploads.uploaded_at IS 'Timestamp when the upload occurred';
COMMENT ON COLUMN data_uploads.status IS 'Processing status: processing, completed, failed, partial';
COMMENT ON COLUMN data_uploads.error_message IS 'Error details if the upload failed';
COMMENT ON COLUMN data_uploads.metadata IS 'JSONB storage for additional upload metadata (column mappings, validation errors, etc.)';

-- ============================================================================
-- KLAVIYO FLOWS TABLE
-- Klaviyo Flow Performance data
-- ============================================================================
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

COMMENT ON TABLE klaviyo_flows IS 'Klaviyo email and SMS flow performance metrics';
COMMENT ON COLUMN klaviyo_flows.id IS 'Unique identifier for the flow record';
COMMENT ON COLUMN klaviyo_flows.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN klaviyo_flows.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN klaviyo_flows.flow_id IS 'Klaviyo external flow identifier';
COMMENT ON COLUMN klaviyo_flows.flow_name IS 'Human-readable name of the flow';
COMMENT ON COLUMN klaviyo_flows.period IS 'Reporting period label (e.g., Last 30 Days)';
COMMENT ON COLUMN klaviyo_flows.period_start IS 'Start date of the reporting period';
COMMENT ON COLUMN klaviyo_flows.period_end IS 'End date of the reporting period';
COMMENT ON COLUMN klaviyo_flows.channel IS 'Channel type: email, sms';
COMMENT ON COLUMN klaviyo_flows.status IS 'Flow status in Klaviyo (active, draft, etc.)';
COMMENT ON COLUMN klaviyo_flows.total_recipients IS 'Total number of recipients who entered the flow';
COMMENT ON COLUMN klaviyo_flows.open_rate IS 'Percentage of recipients who opened (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.click_rate IS 'Percentage of recipients who clicked (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.unsubscribe_rate IS 'Percentage who unsubscribed (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.bounce_rate IS 'Percentage of emails that bounced (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.spam_rate IS 'Percentage marked as spam (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.sms_failed_rate IS 'Percentage of SMS that failed to deliver (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.total_placed_order IS 'Number of recipients who placed an order';
COMMENT ON COLUMN klaviyo_flows.placed_order_rate IS 'Percentage who placed an order (0.0 to 1.0)';
COMMENT ON COLUMN klaviyo_flows.revenue IS 'Total revenue attributed to this flow';
COMMENT ON COLUMN klaviyo_flows.tags IS 'Array of tags associated with the flow';
COMMENT ON COLUMN klaviyo_flows.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- EMAIL CAMPAIGNS TABLE
-- Email Campaign Performance (Klaviyo + Pardot)
-- ============================================================================
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

COMMENT ON TABLE email_campaigns IS 'Email campaign performance data from Klaviyo and Pardot';
COMMENT ON COLUMN email_campaigns.id IS 'Unique identifier for the campaign record';
COMMENT ON COLUMN email_campaigns.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN email_campaigns.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN email_campaigns.source IS 'Platform source: klaviyo or pardot';
COMMENT ON COLUMN email_campaigns.campaign_id IS 'External campaign identifier from the source platform';
COMMENT ON COLUMN email_campaigns.campaign_name IS 'Human-readable campaign name';
COMMENT ON COLUMN email_campaigns.subject IS 'Email subject line';
COMMENT ON COLUMN email_campaigns.preview_text IS 'Email preview/preheader text';
COMMENT ON COLUMN email_campaigns.send_date IS 'Date and time when the campaign was sent';
COMMENT ON COLUMN email_campaigns.send_time IS 'Time component of send (for time-of-day analysis)';
COMMENT ON COLUMN email_campaigns.day_of_week IS 'Day of week when sent (Monday, Tuesday, etc.)';
COMMENT ON COLUMN email_campaigns.segment_name IS 'Name of the audience segment targeted';
COMMENT ON COLUMN email_campaigns.total_recipients IS 'Total number of recipients';
COMMENT ON COLUMN email_campaigns.delivered IS 'Number of emails successfully delivered';
COMMENT ON COLUMN email_campaigns.delivery_rate IS 'Percentage successfully delivered (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.unique_opens IS 'Number of unique opens';
COMMENT ON COLUMN email_campaigns.open_rate IS 'Percentage who opened (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.unique_clicks IS 'Number of unique clicks';
COMMENT ON COLUMN email_campaigns.click_rate IS 'Percentage who clicked (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.click_to_open_rate IS 'Clicks divided by opens (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.unsubscribes IS 'Number of unsubscribes';
COMMENT ON COLUMN email_campaigns.unsubscribe_rate IS 'Percentage who unsubscribed (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.bounces IS 'Number of bounced emails';
COMMENT ON COLUMN email_campaigns.bounce_rate IS 'Percentage that bounced (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.spam_complaints IS 'Number of spam complaints';
COMMENT ON COLUMN email_campaigns.spam_rate IS 'Percentage marked as spam (0.0 to 1.0)';
COMMENT ON COLUMN email_campaigns.revenue IS 'Revenue attributed to this campaign';
COMMENT ON COLUMN email_campaigns.tags IS 'Array of tags associated with the campaign';
COMMENT ON COLUMN email_campaigns.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- PARDOT FLOWS TABLE
-- Pardot Automation Flow/Program Performance
-- ============================================================================
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

COMMENT ON TABLE pardot_flows IS 'Pardot automation program and engagement studio performance metrics';
COMMENT ON COLUMN pardot_flows.id IS 'Unique identifier for the flow record';
COMMENT ON COLUMN pardot_flows.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN pardot_flows.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN pardot_flows.program_name IS 'Name of the Pardot automation program';
COMMENT ON COLUMN pardot_flows.step_type IS 'Type of step in the automation (email, trigger, rule, etc.)';
COMMENT ON COLUMN pardot_flows.step_name IS 'Name of the specific step';
COMMENT ON COLUMN pardot_flows.asset_name IS 'Name of the email asset used';
COMMENT ON COLUMN pardot_flows.sent IS 'Number of emails sent';
COMMENT ON COLUMN pardot_flows.skipped IS 'Number of prospects skipped';
COMMENT ON COLUMN pardot_flows.delivered IS 'Number of emails successfully delivered';
COMMENT ON COLUMN pardot_flows.delivery_rate IS 'Percentage successfully delivered (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.unique_opens IS 'Number of unique opens';
COMMENT ON COLUMN pardot_flows.open_rate IS 'Percentage who opened (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.unique_clicks IS 'Number of unique clicks';
COMMENT ON COLUMN pardot_flows.click_rate IS 'Percentage who clicked (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.click_to_open_rate IS 'Clicks divided by opens (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.opt_outs IS 'Number of opt-outs/unsubscribes';
COMMENT ON COLUMN pardot_flows.opt_out_rate IS 'Percentage who opted out (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.bounces IS 'Number of bounced emails';
COMMENT ON COLUMN pardot_flows.bounce_rate IS 'Percentage that bounced (0.0 to 1.0)';
COMMENT ON COLUMN pardot_flows.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- GA4 PAGES TABLE
-- GA4 Page and Screen Performance
-- ============================================================================
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

COMMENT ON TABLE ga4_pages IS 'Google Analytics 4 page and screen performance metrics';
COMMENT ON COLUMN ga4_pages.id IS 'Unique identifier for the page record';
COMMENT ON COLUMN ga4_pages.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN ga4_pages.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN ga4_pages.period_start IS 'Start date of the reporting period';
COMMENT ON COLUMN ga4_pages.period_end IS 'End date of the reporting period';
COMMENT ON COLUMN ga4_pages.page_path IS 'URL path of the page';
COMMENT ON COLUMN ga4_pages.page_title IS 'Title of the page';
COMMENT ON COLUMN ga4_pages.source_medium IS 'Combined source/medium (e.g., google/organic)';
COMMENT ON COLUMN ga4_pages.source IS 'Traffic source (e.g., google, direct, email)';
COMMENT ON COLUMN ga4_pages.medium IS 'Traffic medium (e.g., organic, cpc, email)';
COMMENT ON COLUMN ga4_pages.views IS 'Number of page views';
COMMENT ON COLUMN ga4_pages.active_users IS 'Number of active users';
COMMENT ON COLUMN ga4_pages.views_per_user IS 'Average views per user';
COMMENT ON COLUMN ga4_pages.avg_engagement_time IS 'Average engagement time in seconds';
COMMENT ON COLUMN ga4_pages.event_count IS 'Total number of events';
COMMENT ON COLUMN ga4_pages.first_visits IS 'Number of first-time visits';
COMMENT ON COLUMN ga4_pages.key_events IS 'Number of key/conversion events';
COMMENT ON COLUMN ga4_pages.total_revenue IS 'Total revenue attributed';
COMMENT ON COLUMN ga4_pages.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- GA4 ACQUISITION TABLE
-- GA4 User Acquisition Data
-- ============================================================================
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

COMMENT ON TABLE ga4_acquisition IS 'Google Analytics 4 user acquisition metrics by first user source';
COMMENT ON COLUMN ga4_acquisition.id IS 'Unique identifier for the acquisition record';
COMMENT ON COLUMN ga4_acquisition.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN ga4_acquisition.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN ga4_acquisition.period_start IS 'Start date of the reporting period';
COMMENT ON COLUMN ga4_acquisition.period_end IS 'End date of the reporting period';
COMMENT ON COLUMN ga4_acquisition.first_user_source IS 'First user source (e.g., google, direct, email, social)';
COMMENT ON COLUMN ga4_acquisition.sessions IS 'Total number of sessions';
COMMENT ON COLUMN ga4_acquisition.new_users IS 'Number of new users';
COMMENT ON COLUMN ga4_acquisition.total_users IS 'Total number of users';
COMMENT ON COLUMN ga4_acquisition.returning_users IS 'Number of returning users';
COMMENT ON COLUMN ga4_acquisition.engaged_sessions IS 'Number of engaged sessions';
COMMENT ON COLUMN ga4_acquisition.engagement_rate IS 'Percentage of engaged sessions (0.0 to 1.0)';
COMMENT ON COLUMN ga4_acquisition.avg_engagement_time IS 'Average engagement time in seconds';
COMMENT ON COLUMN ga4_acquisition.event_count IS 'Total number of events';
COMMENT ON COLUMN ga4_acquisition.key_events IS 'Number of key/conversion events';
COMMENT ON COLUMN ga4_acquisition.total_revenue IS 'Total revenue attributed';
COMMENT ON COLUMN ga4_acquisition.user_key_event_rate IS 'Key events per user rate (0.0 to 1.0)';
COMMENT ON COLUMN ga4_acquisition.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- SOCIAL POSTS TABLE
-- Social Media Post Performance
-- ============================================================================
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

COMMENT ON TABLE social_posts IS 'Social media post performance metrics from various platforms';
COMMENT ON COLUMN social_posts.id IS 'Unique identifier for the social post record';
COMMENT ON COLUMN social_posts.client_id IS 'Reference to the client who owns this data';
COMMENT ON COLUMN social_posts.upload_id IS 'Reference to the upload that created this record';
COMMENT ON COLUMN social_posts.post_id IS 'External post identifier from the social platform';
COMMENT ON COLUMN social_posts.network IS 'Social network: facebook, instagram, linkedin, twitter, tiktok, youtube, pinterest';
COMMENT ON COLUMN social_posts.post_type IS 'Type of post (feed, story, reel, video, etc.)';
COMMENT ON COLUMN social_posts.content_type IS 'Content type (photo, video, link, text, etc.)';
COMMENT ON COLUMN social_posts.profile IS 'Social media profile/handle that posted';
COMMENT ON COLUMN social_posts.published_at IS 'Timestamp when the post was published';
COMMENT ON COLUMN social_posts.post_url IS 'Direct URL to the post';
COMMENT ON COLUMN social_posts.post_text IS 'Text content of the post';
COMMENT ON COLUMN social_posts.permalink IS 'Permanent link to the post';
COMMENT ON COLUMN social_posts.impressions IS 'Total impressions (organic + paid)';
COMMENT ON COLUMN social_posts.organic_impressions IS 'Organic impressions only';
COMMENT ON COLUMN social_posts.paid_impressions IS 'Paid impressions only';
COMMENT ON COLUMN social_posts.reach IS 'Total unique reach (organic + paid)';
COMMENT ON COLUMN social_posts.organic_reach IS 'Organic reach only';
COMMENT ON COLUMN social_posts.paid_reach IS 'Paid reach only';
COMMENT ON COLUMN social_posts.engagement_rate IS 'Engagements divided by impressions (0.0 to 1.0)';
COMMENT ON COLUMN social_posts.engagements IS 'Total engagements (reactions + comments + shares + saves)';
COMMENT ON COLUMN social_posts.reactions IS 'Total reactions (varies by platform)';
COMMENT ON COLUMN social_posts.likes IS 'Number of likes';
COMMENT ON COLUMN social_posts.comments IS 'Number of comments';
COMMENT ON COLUMN social_posts.shares IS 'Number of shares/retweets';
COMMENT ON COLUMN social_posts.saves IS 'Number of saves/bookmarks';
COMMENT ON COLUMN social_posts.post_clicks IS 'Total clicks on the post';
COMMENT ON COLUMN social_posts.link_clicks IS 'Clicks on links within the post';
COMMENT ON COLUMN social_posts.video_views IS 'Total video views (organic + paid)';
COMMENT ON COLUMN social_posts.organic_video_views IS 'Organic video views only';
COMMENT ON COLUMN social_posts.paid_video_views IS 'Paid video views only';
COMMENT ON COLUMN social_posts.full_video_views IS 'Number of full video views (watched 95%+)';
COMMENT ON COLUMN social_posts.full_video_view_rate IS 'Percentage who watched full video (0.0 to 1.0)';
COMMENT ON COLUMN social_posts.avg_watch_time_seconds IS 'Average watch time in seconds';
COMMENT ON COLUMN social_posts.story_taps_back IS 'Number of taps back (stories only)';
COMMENT ON COLUMN social_posts.story_taps_forward IS 'Number of taps forward (stories only)';
COMMENT ON COLUMN social_posts.story_exits IS 'Number of story exits (stories only)';
COMMENT ON COLUMN social_posts.tags IS 'Array of tags/campaigns associated with the post';
COMMENT ON COLUMN social_posts.created_at IS 'Timestamp when this record was created';

-- ============================================================================
-- USERS TABLE
-- User authentication and authorization
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'viewer',
  client_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

COMMENT ON TABLE users IS 'Application users for authentication and authorization';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN users.name IS 'Display name of the user';
COMMENT ON COLUMN users.role IS 'User role: admin, editor, or viewer';
COMMENT ON COLUMN users.client_ids IS 'Array of client IDs the user has access to (empty array = all clients for admins)';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user was created';
COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the most recent login';

-- ============================================================================
-- TRIGGER FUNCTION FOR UPDATED_AT
-- Automatically updates the updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically update the updated_at column';

-- Apply updated_at trigger to clients table
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
