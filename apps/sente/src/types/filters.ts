/**
 * Filter-related type definitions for the Sente Dashboard
 * @module types/filters
 */

import type { DateRangePreset } from "@/lib/utils/dates";
import type { DataSourceType, SocialNetwork } from "./database";

/**
 * Date range filter state
 */
export interface DateRangeFilter {
  preset: DateRangePreset | "custom";
  startDate: string | null;
  endDate: string | null;
}

/**
 * Email source filter options
 */
export type EmailSource = "all" | "klaviyo" | "pardot";

/**
 * Email filter state
 */
export interface EmailFilters {
  dateRange: DateRangeFilter;
  source: EmailSource;
  campaignType?: "campaigns" | "flows";
  searchQuery?: string;
  tags?: string[];
}

/**
 * Web analytics filter state
 */
export interface WebFilters {
  dateRange: DateRangeFilter;
  source?: string;
  medium?: string;
  pagePath?: string;
  searchQuery?: string;
}

/**
 * Social media filter state
 */
export interface SocialFilters {
  dateRange: DateRangeFilter;
  networks: SocialNetwork[];
  postType?: string;
  contentType?: string;
  searchQuery?: string;
  tags?: string[];
}

/**
 * Global dashboard filter state
 */
export interface DashboardFilters {
  clientId: string;
  dateRange: DateRangeFilter;
}

/**
 * Filter option for select components
 */
export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
  disabled?: boolean;
}

/**
 * Sort direction
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort state for tables
 */
export interface SortState<T = string> {
  column: T;
  direction: SortDirection;
}

/**
 * Pagination state
 */
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

/**
 * Combined filter and pagination state for data tables
 */
export interface TableState<TFilters, TSortColumn = string> {
  filters: TFilters;
  sort: SortState<TSortColumn>;
  pagination: PaginationState;
}

/**
 * URL search params for filter state serialization
 */
export interface FilterSearchParams {
  datePreset?: DateRangePreset | "custom";
  startDate?: string;
  endDate?: string;
  source?: string;
  network?: string;
  search?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: SortDirection;
  [key: string]: string | undefined;
}

/**
 * Filter change handler type
 */
export type FilterChangeHandler<T> = (filters: Partial<T>) => void;

/**
 * Available page sizes for pagination
 */
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

/**
 * Default pagination values
 */
export const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 25,
  total: 0,
};

/**
 * Default date range filter
 */
export const DEFAULT_DATE_RANGE: DateRangeFilter = {
  preset: "last30days",
  startDate: null,
  endDate: null,
};

/**
 * Network filter options
 */
export const NETWORK_OPTIONS: FilterOption<SocialNetwork | "all">[] = [
  { value: "all", label: "All Networks" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "tiktok", label: "TikTok" },
];

/**
 * Email source filter options
 */
export const EMAIL_SOURCE_OPTIONS: FilterOption<EmailSource>[] = [
  { value: "all", label: "All Sources" },
  { value: "klaviyo", label: "Klaviyo" },
  { value: "pardot", label: "Pardot" },
];

/**
 * Data source display names
 */
export const DATA_SOURCE_LABELS: Record<DataSourceType, string> = {
  klaviyo_campaigns: "Klaviyo Campaigns",
  klaviyo_flows: "Klaviyo Flows",
  pardot_campaigns: "Pardot Campaigns",
  pardot_flows: "Pardot Flows",
  ga4_pages: "GA4 Pages",
  ga4_acquisition: "GA4 Acquisition",
  sprout_social: "Sprout Social",
};
