/**
 * Mock data for the Sente Dashboard portfolio demo
 * Health/wellness brand client: "Vitality Wellness Co."
 * Data covers Dec 2025 - Mar 2026 with month-over-month growth
 * @module lib/mock-data
 */

import type {
  GA4Page,
  GA4Acquisition,
  SocialPost,
  EmailCampaign,
  KlaviyoFlow,
  PardotFlow,
  DataUpload,
  User,
  Insight,
} from "@/types/database";

// ─── Constants ──────────────────────────────────────────────────────────────

export const MOCK_CLIENT_ID = "550e8400-e29b-41d4-a716-446655440000";

// ─── Helper ─────────────────────────────────────────────────────────────────

function uuid(suffix: string): string {
  return `00000000-0000-4000-8000-${suffix.padStart(12, "0")}`;
}

// ─── Executive Summary (per-channel) ────────────────────────────────────────

export const mockExecutiveSummaries: Record<string, Record<string, string>> = {
  overview: {
    "2025-12": "<p>December saw strong holiday performance across all channels. Email revenue surged 34% due to Black Friday/Cyber Monday campaigns. Web traffic peaked with 45K unique visitors. Social engagement rate hit 4.2%, our highest quarter-end figure.</p>",
    "2026-01": "<p>January started with solid momentum. New Year wellness campaigns drove a 22% increase in email signups. Web sessions grew 8% MoM as blog content around resolutions gained traction. Instagram Reels continued to outperform static posts.</p>",
    "2026-02": "<p>February performance remained strong. Valentine's Day gift guide campaigns generated $18.4K in attributed revenue. Organic search traffic increased 12% following our SEO content push. LinkedIn B2B outreach saw a 15% lift in engagement.</p>",
    "2026-03": "<p>March is trending positively with spring product launches driving early interest. Email open rates improved to 28.4% with our new segmentation strategy. Social reach expanded 18% through influencer partnerships.</p>",
  },
  email: {
    "2025-12": "<p>Holiday email campaigns delivered exceptional results. The \"12 Days of Wellness\" series achieved a 32% open rate and 4.8% CTR. Revenue attribution reached $42.3K across 18 campaigns.</p>",
    "2026-01": "<p>January's \"New Year, New You\" email series drove strong engagement with 29.1% open rates. We introduced personalized product recommendations which boosted click-through rates by 18%.</p>",
    "2026-02": "<p>Valentine's wellness gift guide was our top performer with 35.2% open rate. A/B testing on subject lines showed emoji usage increased opens by 12%. Total email revenue: $28.7K.</p>",
    "2026-03": "<p>Spring launch pre-sale emails are performing above benchmarks. Early access campaign hit 31% open rate. Segmented campaigns by purchase history show 2x higher conversion.</p>",
  },
  "email-flows": {
    "2025-12": "<p>Automated flows generated $28.5K in December. Welcome series conversion rate hit 8.2%. Cart abandonment recovery rate improved to 12.4% after subject line optimization.</p>",
    "2026-01": "<p>Flow revenue reached $24.1K. New post-purchase upsell flow launched with 6.8% conversion. SMS flows showed 3x higher engagement than email equivalents.</p>",
    "2026-02": "<p>February flow revenue: $26.3K. Browse abandonment flow added, recovering an estimated $4.2K. Win-back flow re-engaged 340 lapsed customers.</p>",
    "2026-03": "<p>March flows on track for $30K+ revenue. New loyalty program flow driving repeat purchases. Welcome series refined with dynamic content blocks.</p>",
  },
  "web-traffic": {
    "2025-12": "<p>Website traffic surged during the holiday season with 142K page views. Organic search drove 38% of sessions. Mobile traffic reached 67% of total visits. Average engagement time: 2m 14s.</p>",
    "2026-01": "<p>January maintained strong traffic with 128K views. Blog posts about wellness resolutions drove significant organic traffic. New users increased 15% from referral partnerships.</p>",
    "2026-02": "<p>February web performance: 135K views with improved engagement. Gift guide landing pages converted at 3.2%. Site speed optimizations reduced bounce rate by 8%.</p>",
    "2026-03": "<p>March traffic growing with spring collection pages. Product pages seeing 22% more engagement time. Google Discover driving incremental organic traffic.</p>",
  },
  "web-pages": {
    "2025-12": "<p>Top performing pages: Homepage (28K views), Holiday Gift Guide (12K views), Product Category pages (collectively 34K views). Blog content drove 18% of total views.</p>",
    "2026-01": "<p>\"2026 Wellness Guide\" blog post was the breakout hit with 8.4K views. Product detail pages saw 14% increase in engagement time. FAQ page redesign reduced support tickets 20%.</p>",
    "2026-02": "<p>Valentine's Gift Guide page generated 9.2K views with 4.1% conversion rate. Collection pages showing strong performance with new filtering UX.</p>",
    "2026-03": "<p>Spring Collection launch page trending as top performer. Blog content strategy focusing on seasonal wellness topics driving strong organic traffic.</p>",
  },
  social: {
    "2025-12": "<p>Holiday social campaigns reached 890K impressions across platforms. Instagram Stories drove 42% of total engagement. User-generated content campaign exceeded expectations with 156 submissions. LinkedIn B2B posts generated 28 qualified leads.</p>",
    "2026-01": "<p>January social performance was solid with 720K impressions. Wellness challenge campaign on Instagram generated 12K engagements. TikTok experiments showed promising early results with 3 viral posts.</p>",
    "2026-02": "<p>February reached 810K impressions. Valentine's campaign on Instagram achieved 5.2% engagement rate. LinkedIn thought leadership posts drove 340 website visits. Facebook community group grew to 2.4K members.</p>",
    "2026-03": "<p>Spring content calendar performing well. Influencer collaborations driving 35% increase in reach. Video content consistently outperforming static by 2.8x in engagement.</p>",
  },
};

// ─── Users ──────────────────────────────────────────────────────────────────

export const mockUsers: User[] = [
  {
    id: uuid("1"),
    email: "demo@sente.com",
    name: "Demo User",
    role: "admin",
    client_ids: [MOCK_CLIENT_ID],
    created_at: "2025-10-01T00:00:00Z",
    last_login_at: "2026-03-23T09:00:00Z",
  },
  {
    id: uuid("2"),
    email: "sarah.chen@vitalitywellness.com",
    name: "Sarah Chen",
    role: "admin",
    client_ids: [MOCK_CLIENT_ID],
    created_at: "2025-10-15T00:00:00Z",
    last_login_at: "2026-03-22T14:30:00Z",
  },
  {
    id: uuid("3"),
    email: "mike.rodriguez@vitalitywellness.com",
    name: "Mike Rodriguez",
    role: "editor",
    client_ids: [MOCK_CLIENT_ID],
    created_at: "2025-11-01T00:00:00Z",
    last_login_at: "2026-03-20T11:00:00Z",
  },
  {
    id: uuid("4"),
    email: "jessica.park@vitalitywellness.com",
    name: "Jessica Park",
    role: "viewer",
    client_ids: [MOCK_CLIENT_ID],
    created_at: "2025-12-01T00:00:00Z",
    last_login_at: "2026-03-18T16:45:00Z",
  },
];

// ─── Uploads ────────────────────────────────────────────────────────────────

export const mockUploads: DataUpload[] = [
  {
    id: uuid("u1"),
    client_id: MOCK_CLIENT_ID,
    source_type: "klaviyo_campaigns",
    file_name: "klaviyo_campaigns_mar2026.csv",
    row_count: 14,
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    report_month: "2026-03",
    uploaded_by: uuid("1"),
    uploaded_at: "2026-03-20T10:00:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "klaviyo_campaigns_mar2026.csv" },
  },
  {
    id: uuid("u2"),
    client_id: MOCK_CLIENT_ID,
    source_type: "ga4_pages",
    file_name: "ga4_pages_mar2026.csv",
    row_count: 86,
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    report_month: "2026-03",
    uploaded_by: uuid("1"),
    uploaded_at: "2026-03-19T14:30:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "ga4_pages_mar2026.csv" },
  },
  {
    id: uuid("u3"),
    client_id: MOCK_CLIENT_ID,
    source_type: "sprout_social",
    file_name: "sprout_social_mar2026.csv",
    row_count: 42,
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    report_month: "2026-03",
    uploaded_by: uuid("2"),
    uploaded_at: "2026-03-18T09:15:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "sprout_social_mar2026.csv" },
  },
  {
    id: uuid("u4"),
    client_id: MOCK_CLIENT_ID,
    source_type: "klaviyo_flows",
    file_name: "klaviyo_flows_feb2026.csv",
    row_count: 12,
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    report_month: "2026-02",
    uploaded_by: uuid("1"),
    uploaded_at: "2026-03-02T11:00:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "klaviyo_flows_feb2026.csv" },
  },
  {
    id: uuid("u5"),
    client_id: MOCK_CLIENT_ID,
    source_type: "pardot_campaigns",
    file_name: "pardot_campaigns_feb2026.csv",
    row_count: 8,
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    report_month: "2026-02",
    uploaded_by: uuid("2"),
    uploaded_at: "2026-03-01T16:00:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "pardot_campaigns_feb2026.csv" },
  },
  {
    id: uuid("u6"),
    client_id: MOCK_CLIENT_ID,
    source_type: "ga4_acquisition",
    file_name: "ga4_acquisition_jan2026.csv",
    row_count: 24,
    period_start: "2026-01-01",
    period_end: "2026-01-31",
    report_month: "2026-01",
    uploaded_by: uuid("1"),
    uploaded_at: "2026-02-03T10:00:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "ga4_acquisition_jan2026.csv" },
  },
  {
    id: uuid("u7"),
    client_id: MOCK_CLIENT_ID,
    source_type: "sprout_social",
    file_name: "sprout_social_dec2025.csv",
    row_count: 38,
    period_start: "2025-12-01",
    period_end: "2025-12-31",
    report_month: "2025-12",
    uploaded_by: uuid("2"),
    uploaded_at: "2026-01-05T09:00:00Z",
    status: "completed",
    error_message: null,
    metadata: { original_filename: "sprout_social_dec2025.csv" },
  },
  {
    id: uuid("u8"),
    client_id: MOCK_CLIENT_ID,
    source_type: "klaviyo_campaigns",
    file_name: "klaviyo_campaigns_corrupted.csv",
    row_count: null,
    period_start: null,
    period_end: null,
    report_month: "2026-01",
    uploaded_by: uuid("3"),
    uploaded_at: "2026-01-28T13:00:00Z",
    status: "failed",
    error_message: "Invalid CSV format: missing required columns",
    metadata: { original_filename: "klaviyo_campaigns_corrupted.csv" },
  },
];

// ─── Insights ───────────────────────────────────────────────────────────────

const groupId1 = "g-" + uuid("i100");
const groupId2 = "g-" + uuid("i200");

export const mockInsights: Insight[] = [
  // March 2026 group
  {
    id: uuid("i1"),
    client_id: MOCK_CLIENT_ID,
    channel: null,
    title: "Cross-Channel Strategic Analysis",
    content: "## Key Findings\n\nMarch 2026 shows strong cross-channel synergy. Email campaigns referencing social content saw 24% higher open rates. Website visitors from email had 3.2x higher conversion rates than organic. Recommendation: Continue integrated campaign approach with consistent messaging across email, social, and web.\n\n### Growth Opportunities\n- Leverage spring product launches for coordinated campaigns\n- Increase cross-promotional content between Instagram and email\n- Test TikTok-to-email funnel with exclusive offers",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId1, monthLabel: "March 2026", targetMonth: "2026-03", sortOrder: 0 },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: uuid("i2"),
    client_id: MOCK_CLIENT_ID,
    channel: "email",
    title: "Email Channel Analysis",
    content: "## Email Performance Summary\n\nEmail continues to be the highest-ROI channel with $4.80 revenue per email sent. Key wins:\n- Segmented campaigns outperformed blast emails by 42% in CTR\n- Welcome series automation generating $8.2K/month\n- Subject line A/B tests showing personalized subject lines win 73% of the time\n\n### Recommendations\n- Implement AI-powered send-time optimization\n- Expand SMS integration with Klaviyo flows\n- Test interactive email elements (polls, carousels)",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId1, monthLabel: "March 2026", targetMonth: "2026-03", sortOrder: 1 },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: uuid("i3"),
    client_id: MOCK_CLIENT_ID,
    channel: "web",
    title: "Web Channel Analysis",
    content: "## Web Analytics Summary\n\nOrganic traffic grew 12% MoM driven by blog content strategy. Key metrics:\n- Average session duration increased to 2m 18s (+8%)\n- Mobile conversion rate improved to 2.1% after UX optimizations\n- Top landing pages: Homepage, Spring Collection, Wellness Blog\n\n### Recommendations\n- Accelerate Core Web Vitals improvements (LCP currently 2.8s)\n- Expand product page content with customer reviews and UGC\n- Implement structured data for product rich snippets",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId1, monthLabel: "March 2026", targetMonth: "2026-03", sortOrder: 2 },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  {
    id: uuid("i4"),
    client_id: MOCK_CLIENT_ID,
    channel: "social",
    title: "Social Channel Analysis",
    content: "## Social Media Summary\n\nSocial reach expanded 18% through influencer partnerships. Platform highlights:\n- Instagram: Reels generating 3.2x more engagement than static posts\n- LinkedIn: B2B content driving 28 qualified leads per month\n- Facebook: Community group engagement up 45%\n\n### Recommendations\n- Increase Reels production cadence to 4x/week\n- Launch employee advocacy program on LinkedIn\n- Test paid amplification on top-performing organic posts",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId1, monthLabel: "March 2026", targetMonth: "2026-03", sortOrder: 3 },
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
  },
  // February 2026 group
  {
    id: uuid("i5"),
    client_id: MOCK_CLIENT_ID,
    channel: null,
    title: "Cross-Channel Strategic Analysis",
    content: "## February 2026 Cross-Channel Review\n\nValentine's Day campaign was a standout success, generating $18.4K in attributed revenue across channels. Email drove 62% of campaign revenue, with social driving awareness that lifted email open rates by 15% during the campaign window.",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId2, monthLabel: "February 2026", targetMonth: "2026-02", sortOrder: 0 },
    created_at: "2026-02-28T10:00:00Z",
    updated_at: "2026-02-28T10:00:00Z",
  },
  {
    id: uuid("i6"),
    client_id: MOCK_CLIENT_ID,
    channel: "email",
    title: "Email Channel Analysis",
    content: "## February Email Performance\n\nValentine's gift guide email was the top performer with 35.2% open rate and 5.1% CTR. Total email revenue: $28.7K. A/B testing showed emoji subject lines increased opens by 12%.",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId2, monthLabel: "February 2026", targetMonth: "2026-02", sortOrder: 1 },
    created_at: "2026-02-28T10:00:00Z",
    updated_at: "2026-02-28T10:00:00Z",
  },
  {
    id: uuid("i7"),
    client_id: MOCK_CLIENT_ID,
    channel: "web",
    title: "Web Channel Analysis",
    content: "## February Web Performance\n\n135K page views with improved engagement. Gift guide landing pages converted at 3.2%. Site speed optimizations reduced bounce rate by 8%.",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId2, monthLabel: "February 2026", targetMonth: "2026-02", sortOrder: 2 },
    created_at: "2026-02-28T10:00:00Z",
    updated_at: "2026-02-28T10:00:00Z",
  },
  {
    id: uuid("i8"),
    client_id: MOCK_CLIENT_ID,
    channel: "social",
    title: "Social Channel Analysis",
    content: "## February Social Performance\n\n810K impressions across platforms. Valentine's Instagram campaign achieved 5.2% engagement rate. LinkedIn thought leadership drove 340 website visits.",
    generated_by: "claude-3.5-sonnet",
    model: "claude-3.5-sonnet-20241022",
    prompt_context: { groupId: groupId2, monthLabel: "February 2026", targetMonth: "2026-02", sortOrder: 3 },
    created_at: "2026-02-28T10:00:00Z",
    updated_at: "2026-02-28T10:00:00Z",
  },
];

// ─── Email Campaigns ────────────────────────────────────────────────────────

function makeKlaviyoCampaign(
  idx: number,
  name: string,
  subject: string,
  date: string,
  day: string,
  time: string,
  recipients: number,
  openRate: number,
  clickRate: number,
  revenue: number
): EmailCampaign {
  return {
    id: uuid(`ec${idx}`),
    client_id: MOCK_CLIENT_ID,
    upload_id: uuid("u1"),
    source: "klaviyo",
    campaign_id: `kc-${idx}`,
    campaign_name: name,
    subject,
    preview_text: subject.slice(0, 40) + "...",
    send_date: date,
    send_time: time,
    day_of_week: day,
    segment_name: "All Subscribers",
    total_recipients: recipients,
    delivered: Math.round(recipients * 0.97),
    delivery_rate: 97.2,
    unique_opens: Math.round(recipients * openRate / 100),
    open_rate: openRate,
    unique_clicks: Math.round(recipients * clickRate / 100),
    click_rate: clickRate,
    click_to_open_rate: Math.round((clickRate / openRate) * 100 * 10) / 10,
    unsubscribes: Math.round(recipients * 0.002),
    unsubscribe_rate: 0.2,
    bounces: Math.round(recipients * 0.015),
    bounce_rate: 1.5,
    spam_complaints: Math.round(recipients * 0.0005),
    spam_rate: 0.05,
    revenue,
    tags: ["b2c"],
    created_at: date + "T12:00:00Z",
  };
}

function makePardotCampaign(
  idx: number,
  name: string,
  subject: string,
  date: string,
  day: string,
  time: string,
  recipients: number,
  openRate: number,
  clickRate: number
): EmailCampaign {
  return {
    id: uuid(`ecp${idx}`),
    client_id: MOCK_CLIENT_ID,
    upload_id: uuid("u5"),
    source: "pardot",
    campaign_id: `pc-${idx}`,
    campaign_name: name,
    subject,
    preview_text: null,
    send_date: date,
    send_time: time,
    day_of_week: day,
    segment_name: "B2B Prospects",
    total_recipients: recipients,
    delivered: Math.round(recipients * 0.95),
    delivery_rate: 95.0,
    unique_opens: Math.round(recipients * openRate / 100),
    open_rate: openRate,
    unique_clicks: Math.round(recipients * clickRate / 100),
    click_rate: clickRate,
    click_to_open_rate: Math.round((clickRate / openRate) * 100 * 10) / 10,
    unsubscribes: Math.round(recipients * 0.003),
    unsubscribe_rate: 0.3,
    bounces: Math.round(recipients * 0.03),
    bounce_rate: 3.0,
    spam_complaints: 0,
    spam_rate: 0,
    revenue: 0,
    tags: ["b2b"],
    created_at: date + "T12:00:00Z",
  };
}

export const mockEmailCampaigns: EmailCampaign[] = [
  // March 2026 (B2C)
  makeKlaviyoCampaign(1, "Spring Collection Launch", "Introducing our Spring Wellness Line", "2026-03-15", "Saturday", "10:00 AM", 28500, 31.2, 4.8, 8420),
  makeKlaviyoCampaign(2, "Weekly Wellness Tips #12", "5 habits for better sleep", "2026-03-12", "Wednesday", "8:00 AM", 26800, 28.4, 3.6, 2150),
  makeKlaviyoCampaign(3, "Flash Sale: 48 Hours Only", "24% off everything — spring into savings", "2026-03-08", "Saturday", "9:00 AM", 30100, 34.6, 6.2, 12800),
  makeKlaviyoCampaign(4, "New Blog: Mindful Movement", "Transform your morning routine", "2026-03-05", "Wednesday", "7:30 AM", 25200, 26.8, 3.1, 980),
  makeKlaviyoCampaign(5, "March Subscriber Exclusive", "Your exclusive March offer inside", "2026-03-01", "Saturday", "10:30 AM", 27400, 29.5, 4.2, 5600),
  // February 2026 (B2C)
  makeKlaviyoCampaign(6, "Valentine's Gift Guide", "The perfect wellness gift for your valentine", "2026-02-10", "Monday", "9:00 AM", 29200, 35.2, 5.1, 9800),
  makeKlaviyoCampaign(7, "Self-Love February Sale", "Treat yourself this Valentine's", "2026-02-14", "Friday", "8:00 AM", 31500, 32.8, 5.8, 11200),
  makeKlaviyoCampaign(8, "Weekly Wellness Tips #8", "Heart-healthy habits for February", "2026-02-05", "Wednesday", "8:00 AM", 26100, 27.3, 3.4, 1870),
  makeKlaviyoCampaign(9, "New Arrivals: Winter Wellness", "Fresh products for cold-weather self-care", "2026-02-18", "Tuesday", "10:00 AM", 27800, 28.9, 3.8, 4200),
  // January 2026 (B2C)
  makeKlaviyoCampaign(10, "New Year New You Challenge", "Join our 30-day wellness challenge", "2026-01-02", "Thursday", "8:00 AM", 32000, 29.1, 4.5, 6400),
  makeKlaviyoCampaign(11, "Resolution Bundle Sale", "Start 2026 right with 30% off bundles", "2026-01-05", "Sunday", "9:00 AM", 30500, 30.8, 5.4, 14200),
  makeKlaviyoCampaign(12, "Weekly Wellness Tips #1", "Kickstart your wellness journey", "2026-01-08", "Wednesday", "8:00 AM", 25800, 27.5, 3.2, 1450),
  makeKlaviyoCampaign(13, "January Detox Guide", "Cleanse and reset with our top picks", "2026-01-15", "Wednesday", "9:30 AM", 28100, 28.2, 3.9, 3800),
  // December 2025 (B2C)
  makeKlaviyoCampaign(14, "Holiday Gift Guide 2025", "The ultimate wellness gift guide", "2025-12-01", "Monday", "10:00 AM", 33000, 32.4, 5.2, 12400),
  makeKlaviyoCampaign(15, "12 Days of Wellness", "Day 1: Exclusive savings inside", "2025-12-10", "Wednesday", "8:00 AM", 31200, 31.8, 4.8, 8900),
  makeKlaviyoCampaign(16, "Last Minute Gifts", "Still need a gift? We've got you", "2025-12-20", "Saturday", "7:00 AM", 34500, 33.6, 6.1, 15800),
  makeKlaviyoCampaign(17, "Year in Review", "Your wellness journey in 2025", "2025-12-28", "Sunday", "10:00 AM", 28000, 26.2, 2.8, 1200),
  makeKlaviyoCampaign(18, "New Year Preview", "Sneak peek: What's coming in 2026", "2025-12-30", "Tuesday", "9:00 AM", 29500, 28.8, 3.5, 2100),
  // B2B Pardot Campaigns
  makePardotCampaign(1, "B2B Partner Newsletter Feb", "Corporate Wellness Programs: Q1 Update", "2026-02-15", "Saturday", "11:00 AM", 2400, 24.2, 3.1),
  makePardotCampaign(2, "B2B Partner Newsletter Jan", "2026 Corporate Wellness Trends", "2026-01-20", "Monday", "10:00 AM", 2350, 22.8, 2.8),
  makePardotCampaign(3, "B2B Partner Newsletter Dec", "Year-End Corporate Wellness Recap", "2025-12-18", "Thursday", "11:00 AM", 2200, 23.5, 3.0),
  makePardotCampaign(4, "B2B Webinar Invite: Workplace Wellness", "Join us: Employee Wellness Strategies", "2026-03-10", "Monday", "9:00 AM", 1800, 26.4, 4.2),
  makePardotCampaign(5, "B2B Case Study: TechCorp", "How TechCorp reduced sick days 40%", "2026-03-18", "Wednesday", "10:30 AM", 1600, 28.1, 4.8),
];

// ─── Klaviyo Flows ──────────────────────────────────────────────────────────

export const mockKlaviyoFlows: KlaviyoFlow[] = [
  { id: uuid("kf1"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-welcome", flow_name: "Welcome Series", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "email", status: "live", total_recipients: 4200, open_rate: 42.8, click_rate: 8.2, unsubscribe_rate: 0.8, bounce_rate: 1.2, spam_rate: 0.05, sms_failed_rate: null, total_placed_order: 340, placed_order_rate: 8.1, revenue: 8200, tags: ["onboarding"], created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("kf2"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-abandon-cart", flow_name: "Cart Abandonment", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "email", status: "live", total_recipients: 3100, open_rate: 38.5, click_rate: 12.4, unsubscribe_rate: 0.4, bounce_rate: 0.8, spam_rate: 0.02, sms_failed_rate: null, total_placed_order: 380, placed_order_rate: 12.3, revenue: 11400, tags: ["recovery"], created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("kf3"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-post-purchase", flow_name: "Post-Purchase Upsell", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "email", status: "live", total_recipients: 2800, open_rate: 35.2, click_rate: 6.8, unsubscribe_rate: 0.3, bounce_rate: 0.6, spam_rate: 0.01, sms_failed_rate: null, total_placed_order: 190, placed_order_rate: 6.8, revenue: 4800, tags: ["upsell"], created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("kf4"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-winback", flow_name: "Win-Back Series", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "email", status: "live", total_recipients: 1800, open_rate: 22.4, click_rate: 3.2, unsubscribe_rate: 1.8, bounce_rate: 2.4, spam_rate: 0.1, sms_failed_rate: null, total_placed_order: 58, placed_order_rate: 3.2, revenue: 1740, tags: ["retention"], created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("kf5"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-browse-abandon", flow_name: "Browse Abandonment", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "email", status: "live", total_recipients: 2200, open_rate: 28.6, click_rate: 5.4, unsubscribe_rate: 0.6, bounce_rate: 1.0, spam_rate: 0.03, sms_failed_rate: null, total_placed_order: 120, placed_order_rate: 5.5, revenue: 3600, tags: ["recovery"], created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("kf6"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-sms-welcome", flow_name: "SMS Welcome", period: "March 2026", period_start: "2026-03-01", period_end: "2026-03-31", channel: "sms", status: "live", total_recipients: 1200, open_rate: null, click_rate: 14.2, unsubscribe_rate: 1.2, bounce_rate: null, spam_rate: null, sms_failed_rate: 2.1, total_placed_order: 96, placed_order_rate: 8.0, revenue: 2400, tags: ["sms", "onboarding"], created_at: "2026-03-01T00:00:00Z" },
  // February flows
  { id: uuid("kf7"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-welcome", flow_name: "Welcome Series", period: "February 2026", period_start: "2026-02-01", period_end: "2026-02-28", channel: "email", status: "live", total_recipients: 3800, open_rate: 41.2, click_rate: 7.8, unsubscribe_rate: 0.9, bounce_rate: 1.3, spam_rate: 0.06, sms_failed_rate: null, total_placed_order: 296, placed_order_rate: 7.8, revenue: 7100, tags: ["onboarding"], created_at: "2026-02-01T00:00:00Z" },
  { id: uuid("kf8"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u4"), flow_id: "flow-abandon-cart", flow_name: "Cart Abandonment", period: "February 2026", period_start: "2026-02-01", period_end: "2026-02-28", channel: "email", status: "live", total_recipients: 2900, open_rate: 37.1, click_rate: 11.8, unsubscribe_rate: 0.5, bounce_rate: 0.9, spam_rate: 0.03, sms_failed_rate: null, total_placed_order: 342, placed_order_rate: 11.8, revenue: 10200, tags: ["recovery"], created_at: "2026-02-01T00:00:00Z" },
];

// ─── Pardot Flows ───────────────────────────────────────────────────────────

export const mockPardotFlows: PardotFlow[] = [
  { id: uuid("pf1"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u5"), program_name: "B2B Lead Nurture", step_type: "email", step_name: "Initial Outreach", asset_name: "Welcome to Corporate Wellness", sent: 450, skipped: 12, delivered: 428, delivery_rate: 95.1, unique_opens: 142, open_rate: 33.2, unique_clicks: 38, click_rate: 8.9, click_to_open_rate: 26.8, opt_outs: 4, opt_out_rate: 0.9, bounces: 10, bounce_rate: 2.2, created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("pf2"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u5"), program_name: "B2B Lead Nurture", step_type: "email", step_name: "Case Study Follow-Up", asset_name: "See How Companies Thrive", sent: 380, skipped: 8, delivered: 362, delivery_rate: 95.3, unique_opens: 118, open_rate: 32.6, unique_clicks: 32, click_rate: 8.8, click_to_open_rate: 27.1, opt_outs: 3, opt_out_rate: 0.8, bounces: 10, bounce_rate: 2.6, created_at: "2026-03-01T00:00:00Z" },
  { id: uuid("pf3"), client_id: MOCK_CLIENT_ID, upload_id: uuid("u5"), program_name: "Webinar Registration", step_type: "email", step_name: "Invite", asset_name: "Join Our Workplace Wellness Webinar", sent: 620, skipped: 15, delivered: 590, delivery_rate: 95.2, unique_opens: 186, open_rate: 31.5, unique_clicks: 62, click_rate: 10.5, click_to_open_rate: 33.3, opt_outs: 5, opt_out_rate: 0.8, bounces: 15, bounce_rate: 2.4, created_at: "2026-03-01T00:00:00Z" },
];

// ─── Social Posts ───────────────────────────────────────────────────────────

function makeSocialPost(
  idx: number,
  network: "instagram" | "facebook" | "linkedin",
  postType: string,
  contentType: string,
  date: string,
  text: string,
  impressions: number,
  engagements: number,
  engagementRate: number,
  likes: number,
  comments: number,
  shares: number,
  videoViews?: number
): SocialPost {
  return {
    id: uuid(`sp${idx}`),
    client_id: MOCK_CLIENT_ID,
    upload_id: uuid("u3"),
    post_id: `post-${idx}`,
    network,
    post_type: postType,
    content_type: contentType,
    profile: `VitalityWellness_${network}`,
    published_at: date + "T12:00:00Z",
    post_url: `https://${network}.com/p/${idx}`,
    post_text: text,
    permalink: `https://${network}.com/p/${idx}`,
    impressions,
    organic_impressions: Math.round(impressions * 0.7),
    paid_impressions: Math.round(impressions * 0.3),
    reach: Math.round(impressions * 0.82),
    organic_reach: Math.round(impressions * 0.6),
    paid_reach: Math.round(impressions * 0.22),
    engagement_rate: engagementRate,
    engagements,
    reactions: likes,
    likes,
    comments,
    shares,
    saves: Math.round(engagements * 0.12),
    post_clicks: Math.round(engagements * 0.35),
    link_clicks: Math.round(engagements * 0.18),
    video_views: videoViews ?? 0,
    organic_video_views: videoViews ? Math.round(videoViews * 0.65) : 0,
    paid_video_views: videoViews ? Math.round(videoViews * 0.35) : 0,
    full_video_views: videoViews ? Math.round(videoViews * 0.32) : 0,
    full_video_view_rate: videoViews ? 32.0 : null,
    avg_watch_time_seconds: videoViews ? 18.4 : null,
    story_taps_back: 0,
    story_taps_forward: 0,
    story_exits: 0,
    tags: [contentType.toLowerCase()],
    created_at: date + "T12:00:00Z",
  };
}

export const mockSocialPosts: SocialPost[] = [
  // March 2026
  makeSocialPost(1, "instagram", "Reel", "Video", "2026-03-18", "Spring is here! Check out our new wellness collection", 24500, 1820, 7.4, 1200, 145, 280, 18400),
  makeSocialPost(2, "instagram", "Carousel", "Image", "2026-03-15", "5 morning habits that changed our founder's life", 18200, 1340, 7.4, 890, 120, 180),
  makeSocialPost(3, "instagram", "Single Image", "Image", "2026-03-12", "Your daily dose of wellness motivation", 12800, 680, 5.3, 520, 48, 62),
  makeSocialPost(4, "instagram", "Reel", "Video", "2026-03-08", "Behind the scenes: How we source our ingredients", 21300, 1560, 7.3, 980, 132, 248, 16200),
  makeSocialPost(5, "facebook", "Link", "Article", "2026-03-17", "New blog: The science behind mindful movement", 8400, 420, 5.0, 280, 42, 68),
  makeSocialPost(6, "facebook", "Photo", "Image", "2026-03-14", "Happy customers sharing their wellness journey", 6200, 310, 5.0, 210, 35, 45),
  makeSocialPost(7, "facebook", "Video", "Video", "2026-03-10", "Quick 5-minute desk stretch routine", 9800, 580, 5.9, 380, 62, 88, 7200),
  makeSocialPost(8, "linkedin", "Article", "Text", "2026-03-16", "How corporate wellness programs reduce turnover by 34%", 5600, 340, 6.1, 180, 42, 85),
  makeSocialPost(9, "linkedin", "Document", "PDF", "2026-03-11", "2026 Workplace Wellness Trends Report", 4200, 280, 6.7, 140, 28, 78),
  // February 2026
  makeSocialPost(10, "instagram", "Reel", "Video", "2026-02-14", "Valentine's wellness gift ideas for your loved ones", 28600, 2240, 7.8, 1480, 186, 340, 22100),
  makeSocialPost(11, "instagram", "Carousel", "Image", "2026-02-10", "Self-love Sunday: 7 ways to practice self-care", 16400, 1180, 7.2, 780, 108, 162),
  makeSocialPost(12, "instagram", "Single Image", "Image", "2026-02-06", "February wellness challenge: Day 6", 11200, 620, 5.5, 460, 42, 58),
  makeSocialPost(13, "facebook", "Photo", "Image", "2026-02-12", "Love yourself first - Valentine's special collection", 7800, 380, 4.9, 260, 38, 52),
  makeSocialPost(14, "facebook", "Video", "Video", "2026-02-08", "Heart-healthy smoothie recipe", 8200, 460, 5.6, 310, 48, 72, 6100),
  makeSocialPost(15, "linkedin", "Article", "Text", "2026-02-18", "Case study: How TechCorp improved employee wellness", 4800, 310, 6.5, 160, 38, 82),
  // January 2026
  makeSocialPost(16, "instagram", "Reel", "Video", "2026-01-05", "New Year wellness challenge starts NOW", 22400, 1680, 7.5, 1100, 156, 260, 17200),
  makeSocialPost(17, "instagram", "Carousel", "Image", "2026-01-12", "2026 resolution: Move your body every day", 14800, 1020, 6.9, 680, 92, 148),
  makeSocialPost(18, "instagram", "Single Image", "Image", "2026-01-20", "Mindful Monday: Start your week with intention", 10600, 540, 5.1, 400, 38, 52),
  makeSocialPost(19, "facebook", "Link", "Article", "2026-01-08", "Blog: Top wellness trends for 2026", 7200, 360, 5.0, 240, 36, 54),
  makeSocialPost(20, "linkedin", "Article", "Text", "2026-01-15", "Why workplace wellness is the #1 employee benefit in 2026", 5200, 320, 6.2, 168, 36, 84),
  // December 2025
  makeSocialPost(21, "instagram", "Reel", "Video", "2025-12-15", "Holiday gift guide: Top 10 wellness gifts", 26800, 2080, 7.8, 1380, 172, 328, 20600),
  makeSocialPost(22, "instagram", "Carousel", "Image", "2025-12-10", "12 days of wellness: Day 1", 19200, 1420, 7.4, 940, 128, 202),
  makeSocialPost(23, "instagram", "Single Image", "Image", "2025-12-22", "Wishing you a healthy holiday season", 15400, 880, 5.7, 680, 62, 88),
  makeSocialPost(24, "facebook", "Photo", "Image", "2025-12-12", "Holiday collection is here! Shop now", 8800, 440, 5.0, 300, 42, 68),
  makeSocialPost(25, "facebook", "Video", "Video", "2025-12-20", "Quick holiday stress-relief tips", 10200, 620, 6.1, 420, 58, 92, 7800),
  makeSocialPost(26, "linkedin", "Article", "Text", "2025-12-18", "Year in review: Corporate wellness wins of 2025", 5400, 360, 6.7, 188, 44, 92),
];

// ─── GA4 Pages ──────────────────────────────────────────────────────────────

function makeGA4Page(
  idx: number,
  path: string,
  title: string,
  source: string,
  medium: string,
  periodStart: string,
  periodEnd: string,
  views: number,
  users: number,
  engTime: number,
  revenue: number
): GA4Page {
  return {
    id: uuid(`gp${idx}`),
    client_id: MOCK_CLIENT_ID,
    upload_id: uuid("u2"),
    period_start: periodStart,
    period_end: periodEnd,
    page_path: path,
    page_title: title,
    source_medium: `${source} / ${medium}`,
    source,
    medium,
    views,
    active_users: users,
    views_per_user: Math.round((views / users) * 10) / 10,
    avg_engagement_time: engTime,
    event_count: Math.round(views * 2.4),
    first_visits: Math.round(users * 0.45),
    key_events: Math.round(views * 0.032),
    total_revenue: revenue,
    created_at: periodEnd + "T00:00:00Z",
  };
}

export const mockGA4Pages: GA4Page[] = [
  // March 2026
  makeGA4Page(1, "/", "Home | Vitality Wellness", "google", "organic", "2026-03-01", "2026-03-31", 28400, 18200, 42.5, 0),
  makeGA4Page(2, "/collections/spring-2026", "Spring Collection 2026", "google", "organic", "2026-03-01", "2026-03-31", 12800, 8400, 68.2, 18400),
  makeGA4Page(3, "/blog/mindful-movement-guide", "Mindful Movement Guide", "google", "organic", "2026-03-01", "2026-03-31", 8400, 6200, 124.6, 0),
  makeGA4Page(4, "/products/wellness-bundle", "Wellness Starter Bundle", "(direct)", "(none)", "2026-03-01", "2026-03-31", 6800, 4200, 92.3, 12600),
  makeGA4Page(5, "/blog/spring-wellness-tips", "Spring Wellness Tips", "google", "organic", "2026-03-01", "2026-03-31", 5600, 4100, 108.4, 0),
  makeGA4Page(6, "/about", "About Us", "google", "organic", "2026-03-01", "2026-03-31", 4200, 3400, 38.2, 0),
  makeGA4Page(7, "/products/sleep-supplement", "Natural Sleep Support", "email", "klaviyo", "2026-03-01", "2026-03-31", 3800, 2600, 86.4, 8200),
  makeGA4Page(8, "/collections/all", "All Products", "(direct)", "(none)", "2026-03-01", "2026-03-31", 3400, 2800, 52.8, 4600),
  // February 2026
  makeGA4Page(9, "/", "Home | Vitality Wellness", "google", "organic", "2026-02-01", "2026-02-28", 26200, 16800, 40.8, 0),
  makeGA4Page(10, "/valentines-gift-guide", "Valentine's Wellness Gift Guide", "email", "klaviyo", "2026-02-01", "2026-02-28", 9200, 6400, 78.4, 14200),
  makeGA4Page(11, "/blog/heart-healthy-habits", "Heart-Healthy Habits for February", "google", "organic", "2026-02-01", "2026-02-28", 7800, 5800, 118.2, 0),
  makeGA4Page(12, "/products/self-care-kit", "Self-Care Essentials Kit", "(direct)", "(none)", "2026-02-01", "2026-02-28", 5400, 3600, 88.6, 9800),
  // January 2026
  makeGA4Page(13, "/", "Home | Vitality Wellness", "google", "organic", "2026-01-01", "2026-01-31", 24800, 15600, 38.4, 0),
  makeGA4Page(14, "/new-year-wellness-challenge", "30-Day Wellness Challenge", "email", "klaviyo", "2026-01-01", "2026-01-31", 8400, 6800, 142.6, 6400),
  makeGA4Page(15, "/blog/wellness-trends-2026", "Top Wellness Trends for 2026", "google", "organic", "2026-01-01", "2026-01-31", 7200, 5400, 128.4, 0),
  makeGA4Page(16, "/collections/resolution-bundles", "Resolution Bundle Sale", "email", "klaviyo", "2026-01-01", "2026-01-31", 6200, 4200, 72.8, 14200),
  // December 2025
  makeGA4Page(17, "/", "Home | Vitality Wellness", "google", "organic", "2025-12-01", "2025-12-31", 28000, 18400, 44.2, 0),
  makeGA4Page(18, "/holiday-gift-guide", "Holiday Gift Guide 2025", "email", "klaviyo", "2025-12-01", "2025-12-31", 12000, 8200, 82.6, 24800),
  makeGA4Page(19, "/collections/holiday", "Holiday Collection", "(direct)", "(none)", "2025-12-01", "2025-12-31", 9800, 6400, 68.4, 18200),
  makeGA4Page(20, "/blog/holiday-stress-relief", "Holiday Stress Relief Tips", "google", "organic", "2025-12-01", "2025-12-31", 6400, 4800, 112.8, 0),
];

// ─── GA4 Acquisition ────────────────────────────────────────────────────────

function makeAcquisition(
  idx: number,
  source: string,
  periodStart: string,
  periodEnd: string,
  sessions: number,
  newUsers: number,
  engRate: number,
  engTime: number,
  revenue: number
): GA4Acquisition {
  const totalUsers = Math.round(sessions * 0.85);
  return {
    id: uuid(`ga${idx}`),
    client_id: MOCK_CLIENT_ID,
    upload_id: uuid("u6"),
    period_start: periodStart,
    period_end: periodEnd,
    first_user_source: source,
    sessions,
    new_users: newUsers,
    total_users: totalUsers,
    returning_users: totalUsers - newUsers,
    engaged_sessions: Math.round(sessions * engRate / 100),
    engagement_rate: engRate,
    avg_engagement_time: engTime,
    event_count: Math.round(sessions * 4.2),
    key_events: Math.round(sessions * 0.045),
    total_revenue: revenue,
    user_key_event_rate: 4.5,
    created_at: periodEnd + "T00:00:00Z",
  };
}

export const mockGA4Acquisition: GA4Acquisition[] = [
  // March 2026
  makeAcquisition(1, "google", "2026-03-01", "2026-03-31", 14200, 8400, 62.4, 128.6, 24800),
  makeAcquisition(2, "(direct)", "2026-03-01", "2026-03-31", 8600, 3200, 58.2, 98.4, 18200),
  makeAcquisition(3, "email", "2026-03-01", "2026-03-31", 6400, 1800, 72.8, 142.2, 28400),
  makeAcquisition(4, "instagram", "2026-03-01", "2026-03-31", 3800, 2600, 48.6, 68.4, 4200),
  makeAcquisition(5, "facebook", "2026-03-01", "2026-03-31", 2200, 1400, 52.4, 82.6, 2800),
  makeAcquisition(6, "linkedin", "2026-03-01", "2026-03-31", 1200, 680, 64.2, 108.8, 1600),
  // February 2026
  makeAcquisition(7, "google", "2026-02-01", "2026-02-28", 13400, 7800, 60.8, 124.2, 22400),
  makeAcquisition(8, "(direct)", "2026-02-01", "2026-02-28", 8200, 3000, 56.4, 94.8, 16800),
  makeAcquisition(9, "email", "2026-02-01", "2026-02-28", 5800, 1600, 70.2, 138.6, 26200),
  makeAcquisition(10, "instagram", "2026-02-01", "2026-02-28", 3400, 2400, 46.8, 64.2, 3800),
  // January 2026
  makeAcquisition(11, "google", "2026-01-01", "2026-01-31", 12800, 7200, 58.6, 118.4, 20200),
  makeAcquisition(12, "(direct)", "2026-01-01", "2026-01-31", 7600, 2800, 54.2, 90.2, 14600),
  makeAcquisition(13, "email", "2026-01-01", "2026-01-31", 5200, 1400, 68.4, 132.8, 24800),
  // December 2025
  makeAcquisition(14, "google", "2025-12-01", "2025-12-31", 15200, 9200, 64.2, 132.4, 28400),
  makeAcquisition(15, "(direct)", "2025-12-01", "2025-12-31", 9400, 3600, 60.8, 102.6, 20400),
  makeAcquisition(16, "email", "2025-12-01", "2025-12-31", 7200, 2200, 74.6, 148.2, 32200),
];
