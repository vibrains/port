-- Seed Data for Development
-- Description: Sample data for local development and testing
-- Note: This data is for development purposes only

-- ============================================================================
-- SEED CLIENT
-- ============================================================================

-- Ensure Sente client exists
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

-- ============================================================================
-- SEED DATA UPLOADS
-- ============================================================================

INSERT INTO data_uploads (id, client_id, source_type, file_name, row_count, period_start, period_end, uploaded_by, status, metadata)
VALUES 
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'klaviyo_campaigns',
    'Klaviyo_emailExport_2026-01-29.csv',
    45,
    '2026-01-01',
    '2026-01-29',
    'admin@sente.com',
    'completed',
    '{"original_filename": "emailExport.csv", "processed_rows": 45, "skipped_rows": 0}'::jsonb
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'ga4_pages',
    'GA4_Pages_January_2026.csv',
    128,
    '2026-01-01',
    '2026-01-31',
    'admin@sente.com',
    'completed',
    '{"original_filename": "Pages_and_screens.csv", "processed_rows": 128, "skipped_rows": 2}'::jsonb
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    'sprout_social',
    'Post_Performance_January_2026.csv',
    24,
    '2026-01-01',
    '2026-01-31',
    'admin@sente.com',
    'completed',
    '{"original_filename": "Post Performance.csv", "processed_rows": 24, "skipped_rows": 0}'::jsonb
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED EMAIL CAMPAIGNS
-- ============================================================================

INSERT INTO email_campaigns (
  id, client_id, upload_id, source, campaign_id, campaign_name, subject, preview_text,
  send_date, send_time, day_of_week, segment_name, total_recipients, delivered, delivery_rate,
  unique_opens, open_rate, unique_clicks, click_rate, click_to_open_rate,
  unsubscribes, unsubscribe_rate, bounces, bounce_rate, spam_complaints, spam_rate, revenue, tags
)
VALUES 
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440001',
    'klaviyo',
    'campaign_001',
    'January Newsletter - New Year, New Glow',
    'Start the year with radiant skin ✨',
    'Discover our latest skincare essentials for your best skin yet...',
    '2026-01-15 10:00:00+00',
    '10:00:00',
    'Wednesday',
    'All Subscribers',
    15420,
    15285,
    0.9912,
    3856,
    0.2523,
    892,
    0.0584,
    0.2313,
    45,
    0.0029,
    135,
    0.0088,
    3,
    0.0002,
    12450.00,
    ARRAY['newsletter', 'january', 'skincare']
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440001',
    'klaviyo',
    'campaign_002',
    'Flash Sale: 24 Hours Only!',
    '⚡ 30% off ends tonight - don''t miss out!',
    'Your favorite products are on sale for one day only...',
    '2026-01-22 14:30:00+00',
    '14:30:00',
    'Wednesday',
    'Engaged Customers',
    8750,
    8680,
    0.9920,
    2890,
    0.3330,
    1245,
    0.1434,
    0.4308,
    23,
    0.0027,
    70,
    0.0081,
    1,
    0.0001,
    28750.00,
    ARRAY['promotion', 'flash-sale', 'january']
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED GA4 PAGE ANALYTICS
-- ============================================================================

INSERT INTO ga4_pages (
  id, client_id, upload_id, period_start, period_end, page_path, page_title,
  source_medium, source, medium, views, active_users, views_per_user,
  avg_engagement_time, event_count, first_visits, key_events, total_revenue
)
VALUES 
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440002',
    '2026-01-01',
    '2026-01-31',
    '/products/hydrating-serum',
    'Hydrating Serum - Sente Skincare',
    'google/organic',
    'google',
    'organic',
    4520,
    3240,
    1.3951,
    145.2500,
    8920,
    890,
    124,
    8750.00
  ),
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440002',
    '2026-01-01',
    '2026-01-31',
    '/blog/skincare-routine-2026',
    'The Ultimate Skincare Routine for 2026 | Sente Blog',
    'email/newsletter',
    'email',
    'newsletter',
    2890,
    2150,
    1.3442,
    210.5000,
    5670,
    425,
    67,
    2340.00
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED GA4 ACQUISITION DATA
-- ============================================================================

INSERT INTO ga4_acquisition (
  id, client_id, upload_id, period_start, period_end, first_user_source,
  sessions, new_users, total_users, returning_users, engaged_sessions,
  engagement_rate, avg_engagement_time, event_count, key_events, total_revenue, user_key_event_rate
)
VALUES 
  (
    '990e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440002',
    '2026-01-01',
    '2026-01-31',
    'google',
    12540,
    5420,
    8750,
    3330,
    6890,
    0.5494,
    185.2500,
    45280,
    520,
    45250.00,
    0.0594
  ),
  (
    '990e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440002',
    '2026-01-01',
    '2026-01-31',
    'email',
    4280,
    420,
    1850,
    1430,
    2980,
    0.6963,
    245.7500,
    18750,
    285,
    28750.00,
    0.1541
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED SOCIAL POSTS
-- ============================================================================

INSERT INTO social_posts (
  id, client_id, upload_id, post_id, network, post_type, content_type, profile,
  published_at, post_url, post_text, permalink, impressions, organic_impressions,
  paid_impressions, reach, organic_reach, paid_reach, engagement_rate, engagements,
  reactions, likes, comments, shares, saves, post_clicks, link_clicks, video_views,
  organic_video_views, paid_video_views, full_video_views, full_video_view_rate,
  avg_watch_time_seconds, tags
)
VALUES 
  (
    'aa0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440003',
    'post_001',
    'instagram',
    'feed',
    'photo',
    '@sente_skincare',
    '2026-01-10 15:00:00+00',
    'https://instagram.com/p/ABC123',
    '✨ New Year, New Glow ✨ Our bestselling Hydrating Serum is flying off the shelves! Tap to shop and start your year with radiant skin. #SenteSkincare #HydratingSerum #NewYearNewGlow',
    'https://instagram.com/p/ABC123',
    45200,
    38500,
    6700,
    12800,
    11200,
    1600,
    0.0458,
    2070,
    1245,
    1245,
    89,
    156,
    580,
    320,
    280,
    0,
    0,
    0,
    0,
    0,
    0,
    ARRAY['product-launch', 'instagram', 'skincare']
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440003',
    'post_002',
    'facebook',
    'video',
    'video',
    'Sente Skincare',
    '2026-01-18 12:00:00+00',
    'https://facebook.com/sente/videos/XYZ789',
    '🎥 Watch: Our founder shares her morning skincare routine using Sente favorites. What''s your must-have step?',
    'https://facebook.com/sente/videos/XYZ789',
    28500,
    22100,
    6400,
    8900,
    7200,
    1700,
    0.0684,
    1950,
    980,
    980,
    145,
    320,
    45,
    460,
    380,
    12500,
    9800,
    2700,
    3125,
    0.2500,
    45.50,
    ARRAY['video', 'facebook', 'routine', 'founder']
  )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED SAMPLE USER
-- ============================================================================

INSERT INTO users (id, email, name, role, client_ids, created_at, last_login_at)
VALUES (
  'bb0e8400-e29b-41d4-a716-446655440001',
  'admin@sente.com',
  'Admin User',
  'admin',
  ARRAY['550e8400-e29b-41d4-a716-446655440000']::UUID[],
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SEED KLAVIYO FLOWS
-- ============================================================================

INSERT INTO klaviyo_flows (
  id, client_id, upload_id, flow_id, flow_name, period, period_start, period_end,
  channel, status, total_recipients, open_rate, click_rate, unsubscribe_rate,
  bounce_rate, spam_rate, sms_failed_rate, total_placed_order, placed_order_rate,
  revenue, tags
)
VALUES 
  (
    'cc0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440001',
    'flow_001',
    'Welcome Series - New Subscribers',
    'Last 30 Days',
    '2026-01-01',
    '2026-01-31',
    'email',
    'active',
    3240,
    0.6850,
    0.2450,
    0.0080,
    0.0120,
    0.0005,
    NULL,
    485,
    0.1497,
    15250.00,
    ARRAY['automation', 'welcome', 'email']
  ),
  (
    'cc0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440001',
    'flow_002',
    'Abandoned Cart Recovery',
    'Last 30 Days',
    '2026-01-01',
    '2026-01-31',
    'email',
    'active',
    1850,
    0.5250,
    0.1850,
    0.0050,
    0.0080,
    0.0003,
    NULL,
    320,
    0.1730,
    18500.00,
    ARRAY['automation', 'abandoned-cart', 'email']
  )
ON CONFLICT DO NOTHING;
