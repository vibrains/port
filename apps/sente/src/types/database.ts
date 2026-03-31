/**
 * Database type definitions for the Sente Dashboard
 * These types match the PostgreSQL schema defined in the database migrations
 * @module types/database
 */

/**
 * Client entity - represents a client organization
 * Multi-tenancy ready with soft delete support
 */
export interface Client {
  id: string;
  name: string;
  slug: string;
  settings: ClientSettings;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/**
 * Client settings stored as JSONB
 */
export interface ClientSettings {
  timezone?: string;
  currency?: string;
  logo_url?: string;
  primary_color?: string;
  [key: string]: unknown;
}

/**
 * Data upload tracking entity
 * Tracks all CSV uploads with status and metadata
 */
export interface DataUpload {
  id: string;
  client_id: string;
  source_type: DataSourceType;
  file_name: string | null;
  row_count: number | null;
  period_start: string | null;
  period_end: string | null;
  report_month: string | null;
  uploaded_by: string | null;
  uploaded_at: string;
  status: UploadStatus;
  error_message: string | null;
  metadata: UploadMetadata;
}

/**
 * Supported data source types
 */
export type DataSourceType =
  | "klaviyo_campaigns"
  | "klaviyo_flows"
  | "pardot_campaigns"
  | "pardot_flows"
  | "ga4_pages"
  | "ga4_acquisition"
  | "sprout_social";

/**
 * Upload status values
 */
export type UploadStatus = "processing" | "completed" | "failed" | "partial";

/**
 * Upload metadata stored as JSONB
 */
export interface UploadMetadata {
  original_filename?: string;
  column_mapping?: Record<string, string>;
  validation_errors?: string[];
  processed_rows?: number;
  skipped_rows?: number;
  [key: string]: unknown;
}

/**
 * Klaviyo Flow Performance entity
 */
export interface KlaviyoFlow {
  id: string;
  client_id: string;
  upload_id: string | null;
  flow_id: string | null;
  flow_name: string | null;
  period: string | null;
  period_start: string | null;
  period_end: string | null;
  channel: string | null;
  status: string | null;
  total_recipients: number;
  open_rate: number | null;
  click_rate: number | null;
  unsubscribe_rate: number | null;
  bounce_rate: number | null;
  spam_rate: number | null;
  sms_failed_rate: number | null;
  total_placed_order: number;
  placed_order_rate: number | null;
  revenue: number | null;
  tags: string[] | null;
  created_at: string;
}

/**
 * Email Campaign entity (Klaviyo + Pardot)
 */
export interface EmailCampaign {
  id: string;
  client_id: string;
  upload_id: string | null;
  source: "klaviyo" | "pardot";
  campaign_id: string | null;
  campaign_name: string | null;
  subject: string | null;
  preview_text: string | null;
  send_date: string | null;
  send_time: string | null;
  day_of_week: string | null;
  segment_name: string | null;
  total_recipients: number;
  delivered: number;
  delivery_rate: number | null;
  unique_opens: number;
  open_rate: number | null;
  unique_clicks: number;
  click_rate: number | null;
  click_to_open_rate: number | null;
  unsubscribes: number;
  unsubscribe_rate: number | null;
  bounces: number;
  bounce_rate: number | null;
  spam_complaints: number;
  spam_rate: number | null;
  revenue: number | null;
  tags: string[] | null;
  created_at: string;
}

/**
 * Pardot Automation Flow entity
 */
export interface PardotFlow {
  id: string;
  client_id: string;
  upload_id: string | null;
  program_name: string | null;
  step_type: string | null;
  step_name: string | null;
  asset_name: string | null;
  sent: number;
  skipped: number;
  delivered: number;
  delivery_rate: number | null;
  unique_opens: number;
  open_rate: number | null;
  unique_clicks: number;
  click_rate: number | null;
  click_to_open_rate: number | null;
  opt_outs: number;
  opt_out_rate: number | null;
  bounces: number;
  bounce_rate: number | null;
  created_at: string;
}

/**
 * GA4 Page Performance entity
 */
export interface GA4Page {
  id: string;
  client_id: string;
  upload_id: string | null;
  period_start: string | null;
  period_end: string | null;
  page_path: string | null;
  page_title: string | null;
  source_medium: string | null;
  source: string | null;
  medium: string | null;
  views: number;
  active_users: number;
  views_per_user: number | null;
  avg_engagement_time: number | null;
  event_count: number;
  first_visits: number;
  key_events: number;
  total_revenue: number;
  created_at: string;
}

/**
 * GA4 User Acquisition entity
 */
export interface GA4Acquisition {
  id: string;
  client_id: string;
  upload_id: string | null;
  period_start: string | null;
  period_end: string | null;
  first_user_source: string | null;
  sessions: number;
  new_users: number;
  total_users: number;
  returning_users: number;
  engaged_sessions: number;
  engagement_rate: number | null;
  avg_engagement_time: number | null;
  event_count: number;
  key_events: number;
  total_revenue: number;
  user_key_event_rate: number | null;
  created_at: string;
}

/**
 * Social Media Post entity
 */
export interface SocialPost {
  id: string;
  client_id: string;
  upload_id: string | null;
  post_id: string | null;
  network: SocialNetwork;
  post_type: string | null;
  content_type: string | null;
  profile: string | null;
  published_at: string | null;
  post_url: string | null;
  post_text: string | null;
  permalink: string | null;
  impressions: number;
  organic_impressions: number;
  paid_impressions: number;
  reach: number;
  organic_reach: number;
  paid_reach: number;
  engagement_rate: number | null;
  engagements: number;
  reactions: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  post_clicks: number;
  link_clicks: number;
  video_views: number;
  organic_video_views: number;
  paid_video_views: number;
  full_video_views: number;
  full_video_view_rate: number | null;
  avg_watch_time_seconds: number | null;
  story_taps_back: number;
  story_taps_forward: number;
  story_exits: number;
  tags: string[] | null;
  created_at: string;
}

/**
 * Supported social networks
 */
export type SocialNetwork =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "twitter"
  | "tiktok"
  | "youtube"
  | "pinterest";

/**
 * User entity for authentication
 */
export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  client_ids: string[];
  created_at: string;
  last_login_at: string | null;
}

/**
 * User role types
 */
export type UserRole = "admin" | "editor" | "viewer";

/**
 * AI-generated insight entity
 */
export interface Insight {
  id: string;
  client_id: string;
  channel: string | null;
  title: string;
  content: string;
  generated_by: string | null;
  model: string | null;
  prompt_context: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Database table names for type-safe queries
 */
export type TableName =
  | "clients"
  | "data_uploads"
  | "klaviyo_flows"
  | "email_campaigns"
  | "pardot_flows"
  | "ga4_pages"
  | "ga4_acquisition"
  | "social_posts"
  | "users"
  | "insights";

/**
 * Type mapping for database tables
 */
export interface DatabaseTables {
  clients: Client;
  data_uploads: DataUpload;
  klaviyo_flows: KlaviyoFlow;
  email_campaigns: EmailCampaign;
  pardot_flows: PardotFlow;
  ga4_pages: GA4Page;
  ga4_acquisition: GA4Acquisition;
  social_posts: SocialPost;
  users: User;
  insights: Insight;
}

/**
 * Insert types (omit auto-generated fields)
 */
export type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at">;
export type DataUploadInsert = Omit<DataUpload, "id" | "uploaded_at">;
export type KlaviyoFlowInsert = Omit<KlaviyoFlow, "id" | "created_at">;
export type EmailCampaignInsert = Omit<EmailCampaign, "id" | "created_at">;
export type PardotFlowInsert = Omit<PardotFlow, "id" | "created_at">;
export type GA4PageInsert = Omit<GA4Page, "id" | "created_at">;
export type GA4AcquisitionInsert = Omit<GA4Acquisition, "id" | "created_at">;
export type SocialPostInsert = Omit<SocialPost, "id" | "created_at">;
export type UserInsert = Omit<User, "id" | "created_at">;

/**
 * Update types (all fields optional except id)
 */
export type ClientUpdate = Partial<Omit<Client, "id">> & { id: string };
export type DataUploadUpdate = Partial<Omit<DataUpload, "id">> & { id: string };
export type KlaviyoFlowUpdate = Partial<Omit<KlaviyoFlow, "id" | "created_at">> & { id: string };
export type EmailCampaignUpdate = Partial<Omit<EmailCampaign, "id" | "created_at">> & { id: string };
export type PardotFlowUpdate = Partial<Omit<PardotFlow, "id" | "created_at">> & { id: string };
export type GA4PageUpdate = Partial<Omit<GA4Page, "id" | "created_at">> & { id: string };
export type GA4AcquisitionUpdate = Partial<Omit<GA4Acquisition, "id" | "created_at">> & { id: string };
export type SocialPostUpdate = Partial<Omit<SocialPost, "id" | "created_at">> & { id: string };
export type UserUpdate = Partial<Omit<User, "id" | "created_at">> & { id: string };
