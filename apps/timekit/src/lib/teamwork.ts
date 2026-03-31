/**
 * Teamwork API Client
 * Backend Lead Agent - Phase 2
 *
 * Client for interacting with Teamwork API v3
 * Documentation: https://apidocs.teamwork.com/docs/teamwork
 */

import { TeamworkTimeLog, TeamworkProject, TeamworkCompany, ApprovalStatus } from './types';
import { logger, logExternalAPI } from './logger';

// Request timeout in milliseconds (30 seconds)
const REQUEST_TIMEOUT_MS = 30000;

// Teamwork API v3 Response Types
interface TeamworkTimeLogResponse {
  id: number; // v3 uses numbers, not strings
  userId: number;
  projectId: number;
  taskId: number | null;
  minutes: number;
  description: string;
  timeLogged: string; // v3 uses timeLogged instead of date
  billable: boolean;
  isBillable: boolean;
  dateCreated: string;
  createdAt: string;
  dateEdited: string;
  updatedAt: string;
  deleted: boolean;
  deletedAt: string | null;
  hasStartTime: boolean;
  isLocked: boolean;
  // Relationships
  user: { id: number; type: string };
  project: { id: number; type: string };
  task: { id: number; type: string } | null;
}

interface TeamworkTimeEntriesResponse {
  timelogs: TeamworkTimeLogResponse[];
  included?: {
    projects?: Record<
      string,
      {
        id: number;
        name: string;
        status: string;
        companyId: number;
        isBillable: boolean;
      }
    >;
    users?: Record<
      string,
      {
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        companyId: number;
        deleted: boolean;
      }
    >;
    tasks?: Record<
      string,
      {
        id: number;
        name: string;
        projectId: number;
      }
    >;
  };
  meta: {
    page: {
      count: number;
      hasMore: boolean;
      pageOffset: number;
      pageSize: number;
    };
  };
}

interface TeamworkProjectsResponse {
  projects: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
  meta: {
    page: {
      count: number;
      hasMore: boolean;
    };
  };
}

interface TeamworkApproval {
  id: number;
  status: 'approved' | 'inReview' | 'needsChanges';
  userId: number;
  dateStart: string;
  dateEnd: string;
}

interface TeamworkApprovalsResponse {
  timeApprovals: TeamworkApproval[];
  meta: {
    page: {
      count: number;
      hasMore: boolean;
      pageOffset: number;
      pageSize: number;
    };
  };
}

interface TeamworkApprovalTimelogsResponse {
  timeApprovalTimelogs: {
    timelogs: Array<{ id: number }>;
  };
  included?: {
    timelogs?: Record<
      string,
      {
        id: number;
        projectId: number;
        taskId: number | null;
        userId: number;
        minutes: number;
      }
    >;
  };
}

// API Client Configuration
interface TeamworkClientConfig {
  apiKey: string;
  siteName: string;
  baseUrl?: string;
  // Rate limiting configuration
  rateLimit?: {
    maxRequestsPerMinute?: number; // Default: 400 (2000 per 5 min / 5)
    retryAttempts?: number; // Default: 3
    retryBaseDelay?: number; // Default: 1000ms
  };
}

/**
 * Token Bucket Rate Limiter
 * Implements token bucket algorithm for API rate limiting
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per millisecond

  constructor(maxTokens: number, refillPerMinute: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
    this.refillRate = refillPerMinute / 60000; // convert to tokens per ms
  }

  /**
   * Try to consume a token. Returns true if successful, false if rate limited.
   */
  tryConsume(): boolean {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Wait until a token is available, then consume it
   */
  async consume(): Promise<void> {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // Calculate wait time until next token is available
    const tokensNeeded = 1 - this.tokens;
    const waitMs = Math.ceil(tokensNeeded / this.refillRate);

    await new Promise((resolve) => setTimeout(resolve, waitMs));
    this.tokens = 0; // Consumed during wait
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = elapsed * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current available tokens
   */
  getAvailableTokens(): number {
    this.refill();
    return this.tokens;
  }
}

/**
 * Custom Field Cache Entry
 */
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Query Parameters for Time Entries
export interface TimeLogQueryParams {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  projectIds?: string[]; // Array of project IDs
  taskIds?: string[]; // Array of task IDs
  billableType?: 'all' | 'billable' | 'non-billable';
  invoicedType?: 'all' | 'invoiced' | 'noninvoiced';
  page?: number;
  pageSize?: number;
  orderBy?: 'date' | 'project' | 'user' | 'description';
  orderMode?: 'asc' | 'desc';
  updatedAfter?: string; // ISO8601 timestamp
}

// Custom Error Classes
export class TeamworkAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'TeamworkAPIError';
  }
}

export class TeamworkRateLimitError extends TeamworkAPIError {
  public readonly retryAfterMs: number | undefined;

  constructor(retryAfterSeconds?: number) {
    super('Rate limit exceeded', 429);
    this.name = 'TeamworkRateLimitError';
    this.retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : undefined;
  }
}

export class TeamworkAuthError extends TeamworkAPIError {
  constructor() {
    super('Authentication failed', 401);
    this.name = 'TeamworkAuthError';
  }
}

/**
 * Teamwork API Client
 * Handles all interactions with Teamwork API v3
 */
export class TeamworkClient {
  private baseUrl: string;
  private apiKey: string;
  private headers: HeadersInit;
  private rateLimiter: TokenBucket;
  private retryAttempts: number;
  private retryBaseDelay: number;

  // Custom field caches with 1 hour TTL
  private taskCustomFieldCache: Map<number, CacheEntry<string | null>>;
  private projectCustomFieldCache: Map<number, CacheEntry<string | null>>;
  private readonly cacheTTL: number = 4 * 60 * 60 * 1000; // 4 hours - reduced from 24h to prevent stale job numbers

  constructor(config?: TeamworkClientConfig) {
    this.apiKey = config?.apiKey || process.env.TEAMWORK_API_KEY || '';
    const siteName = config?.siteName || process.env.TEAMWORK_SITE_NAME || '';

    if (!this.apiKey) {
      throw new Error('Teamwork API key is required');
    }
    if (!siteName) {
      throw new Error('Teamwork site name is required');
    }

    this.baseUrl = config?.baseUrl || `https://${siteName}.teamwork.com`;

    // Teamwork API requires Basic auth for personal API tokens
    // Format: base64-encode "apiKey:xxx" where xxx can be any string
    const authString = Buffer.from(`${this.apiKey}:xxx`).toString('base64');

    this.headers = {
      Authorization: `Basic ${authString}`,
      'Content-Type': 'application/json',
    };

    // Initialize rate limiter
    // Teamwork default: 2000 requests per 5 minutes = 400 per minute
    // We use conservative 350 per minute to leave buffer
    const maxRequestsPerMinute = config?.rateLimit?.maxRequestsPerMinute || 350;
    this.rateLimiter = new TokenBucket(maxRequestsPerMinute, maxRequestsPerMinute);

    // Initialize retry configuration
    this.retryAttempts = config?.rateLimit?.retryAttempts || 3;
    this.retryBaseDelay = config?.rateLimit?.retryBaseDelay || 1000;

    // Initialize caches
    this.taskCustomFieldCache = new Map();
    this.projectCustomFieldCache = new Map();
  }

  /**
   * Make HTTP request to Teamwork API with error handling and retries
   * Implements:
   * - Token bucket rate limiting
   * - Exponential backoff for 429 errors
   * - Automatic retries with configurable attempts
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    attemptNumber: number = 0
  ): Promise<T> {
    // Wait for rate limiter token
    await this.rateLimiter.consume();

    const url = `${this.baseUrl}${endpoint}`;

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (!response.ok) {
        // Check if this is a rate limit error and we should retry
        if (response.status === 429 && attemptNumber < this.retryAttempts) {
          const retryAfter = response.headers.get('Retry-After');
          const retryDelay = retryAfter
            ? parseInt(retryAfter) * 1000
            : this.retryBaseDelay * Math.pow(2, attemptNumber); // Exponential backoff

          logger.warn(
            { retryDelay, attempt: attemptNumber + 1, maxAttempts: this.retryAttempts },
            'Teamwork rate limit hit, retrying'
          );

          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          return this.request<T>(endpoint, options, attemptNumber + 1);
        }

        await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof TeamworkAPIError) {
        throw error;
      }

      // Handle timeout errors specifically
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorType = isTimeout ? 'Timeout' : 'Network';

      // Network or timeout errors - retry if we have attempts left
      if (attemptNumber < this.retryAttempts) {
        const retryDelay = this.retryBaseDelay * Math.pow(2, attemptNumber);
        logger.warn(
          { errorType, retryDelay, attempt: attemptNumber + 1, maxAttempts: this.retryAttempts },
          `Teamwork ${errorType} error, retrying`
        );

        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        return this.request<T>(endpoint, options, attemptNumber + 1);
      }

      const message = isTimeout
        ? `Request timed out after ${REQUEST_TIMEOUT_MS}ms`
        : `Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`;

      throw new TeamworkAPIError(message, undefined, error);
    }
  }

  /**
   * Handle error responses from Teamwork API
   */
  private async handleErrorResponse(response: Response): Promise<never> {
    const statusCode = response.status;

    // Try to parse error message from response
    let errorMessage = `HTTP ${statusCode}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.MESSAGE) {
        errorMessage = errorData.MESSAGE;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // If parsing fails, use status text
    }

    // Handle specific status codes
    switch (statusCode) {
      case 401:
      case 403:
        throw new TeamworkAuthError();
      case 429:
        const retryAfter = response.headers.get('Retry-After');
        throw new TeamworkRateLimitError(retryAfter ? parseInt(retryAfter) : undefined);
      case 404:
        throw new TeamworkAPIError('Resource not found', 404);
      case 422:
        throw new TeamworkAPIError(`Validation error: ${errorMessage}`, 422);
      case 500:
      case 502:
      case 503:
        throw new TeamworkAPIError('Teamwork server error', statusCode);
      default:
        throw new TeamworkAPIError(errorMessage, statusCode);
    }
  }

  /**
   * Build query string from parameters
   */
  private buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          searchParams.append(key, value.join(','));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Get cached custom field value
   * Returns null if not cached or expired
   */
  private getCachedValue<T>(cache: Map<number, CacheEntry<T>>, key: number): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached custom field value with TTL
   */
  private setCachedValue<T>(cache: Map<number, CacheEntry<T>>, key: number, value: T): void {
    cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheTTL,
    });
  }

  /**
   * Clear expired cache entries (garbage collection)
   */
  private cleanCache<T>(cache: Map<number, CacheEntry<T>>): void {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (now > entry.expiresAt) {
        cache.delete(key);
      }
    }
  }

  /**
   * Clear all caches (useful for testing or manual refresh)
   */
  clearCaches(): void {
    this.taskCustomFieldCache.clear();
    this.projectCustomFieldCache.clear();
    logger.info({}, 'Teamwork caches cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    taskCache: { size: number; hits: number };
    projectCache: { size: number; hits: number };
  } {
    // Clean expired entries first
    this.cleanCache(this.taskCustomFieldCache);
    this.cleanCache(this.projectCustomFieldCache);

    return {
      taskCache: {
        size: this.taskCustomFieldCache.size,
        hits: 0, // Would need to track hits separately
      },
      projectCache: {
        size: this.projectCustomFieldCache.size,
        hits: 0,
      },
    };
  }

  /**
   * Get time entries with optional filtering
   * Returns approved time logs and user information
   */
  async getTimeLogs(params: TimeLogQueryParams = {}): Promise<{
    timeLogs: TeamworkTimeLog[];
    users: Map<number, { firstName: string; lastName: string; email: string; companyId: number }>;
    companies: Map<number, { name: string }>;
  }> {
    const defaultParams: TimeLogQueryParams = {
      page: 1,
      pageSize: 500, // Maximum page size to reduce API calls
      orderBy: 'date',
      orderMode: 'desc',
      billableType: 'all',
      ...params,
    };

    const allTimeLogs: TeamworkTimeLog[] = [];
    const allUsers = new Map<
      number,
      { firstName: string; lastName: string; email: string; companyId: number }
    >();
    const allCompanies = new Map<number, { name: string }>();
    let currentPage = defaultParams.page!;
    let hasMore = true;

    // Fetch all pages
    while (hasMore) {
      const queryParams = {
        ...defaultParams,
        page: currentPage,
        include: 'tasks,projects,users', // Include related resources
        showDeleted: true, // Include deleted records so sync can set deletedAt
      };

      const queryString = this.buildQueryString(queryParams);
      const response = await this.request<TeamworkTimeEntriesResponse>(
        `/projects/api/v3/time.json${queryString}`
      );

      // Extract user information from included data
      if (response.included?.users) {
        Object.values(response.included.users).forEach((user) => {
          allUsers.set(user.id, {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            companyId: user.companyId,
          });
        });
      }

      // Extract company information from included projects
      if (response.included?.projects) {
        Object.values(response.included.projects).forEach((project) => {
          // Add company from project if not already added
          if (project.companyId && !allCompanies.has(project.companyId)) {
            // We'll need to fetch company names separately or extract from context
            // For now, we'll fetch companies in bulk after collecting IDs
            allCompanies.set(project.companyId, { name: `Company ${project.companyId}` });
          }
        });
      }

      // Extract company IDs from users too
      if (response.included?.users) {
        Object.values(response.included.users).forEach((user) => {
          if (user.companyId && !allCompanies.has(user.companyId)) {
            allCompanies.set(user.companyId, { name: `Company ${user.companyId}` });
          }
        });
      }

      // Transform Teamwork API response to our format
      const transformedLogs = response.timelogs.map((log) =>
        this.transformTimeLog(log, response.included)
      );

      allTimeLogs.push(...transformedLogs);

      const pageInfo = response.meta.page;
      const totalPages =
        pageInfo.pageSize > 0 ? Math.ceil(pageInfo.count / pageInfo.pageSize) : undefined;

      hasMore = pageInfo.hasMore && !(typeof totalPages === 'number' && currentPage >= totalPages);

      if (!hasMore) {
        break;
      }

      currentPage++;

      if (currentPage > 100) {
        logger.warn({ maxPages: 100 }, 'Teamwork reached maximum page limit for time logs');
        break;
      }
    }

    // Fetch real company names for all company IDs we found
    const companyIds = Array.from(allCompanies.keys());
    if (companyIds.length > 0) {
      const companies = await this.getCompanies(companyIds);
      companies.forEach((company) => {
        allCompanies.set(company.id, { name: company.name });
      });
    }

    return {
      timeLogs: allTimeLogs,
      users: allUsers,
      companies: allCompanies,
    };
  }

  /**
   * Get time logs for a specific project
   */
  async getProjectTimeLogs(
    projectId: string,
    params: TimeLogQueryParams = {}
  ): Promise<{
    timeLogs: TeamworkTimeLog[];
    users: Map<number, { firstName: string; lastName: string; email: string; companyId: number }>;
    companies: Map<number, { name: string }>;
  }> {
    return this.getTimeLogs({
      ...params,
      projectIds: [projectId],
    });
  }

  /**
   * Get time logs updated after a specific date (for incremental sync)
   */
  async getTimeLogsUpdatedAfter(
    updatedAfter: Date,
    params: TimeLogQueryParams = {}
  ): Promise<{
    timeLogs: TeamworkTimeLog[];
    users: Map<number, { firstName: string; lastName: string; email: string; companyId: number }>;
    companies: Map<number, { name: string }>;
  }> {
    return this.getTimeLogs({
      ...params,
      updatedAfter: updatedAfter.toISOString(),
    });
  }

  /**
   * Get all projects
   */
  async getProjects(): Promise<TeamworkProject[]> {
    const allProjects: TeamworkProject[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.request<TeamworkProjectsResponse>(
        `/projects/api/v3/projects.json?page=${currentPage}&pageSize=500`
      );

      const transformedProjects = response.projects.map((project) => ({
        id: parseInt(project.id),
        name: project.name,
        description: project.description,
      }));

      allProjects.push(...transformedProjects);

      hasMore = response.meta.page.hasMore;
      currentPage++;

      // Safety check
      if (currentPage > 100) {
        logger.warn({ maxPages: 100 }, 'Teamwork reached maximum page limit for projects');
        break;
      }
    }

    return allProjects;
  }

  private async fetchCompaniesBatch(companyIds: number[]): Promise<TeamworkCompany[]> {
    const query = companyIds.length > 0 ? `?ids=${companyIds.join(',')}` : '';
    const response = await this.request<{
      companies: Array<{
        id: number;
        name: string;
      }>;
    }>(`/projects/api/v3/companies.json${query}`);

    return response.companies.map((company) => ({
      id: company.id,
      name: company.name,
    }));
  }

  /**
   * Get companies by IDs
   * Fetches company details for the given company IDs
   */
  async getCompanies(companyIds: number[]): Promise<TeamworkCompany[]> {
    const uniqueIds = [...new Set(companyIds)];
    if (uniqueIds.length === 0) {
      return [];
    }

    const companies: TeamworkCompany[] = [];
    const chunkSize = 50;

    for (let i = 0; i < uniqueIds.length; i += chunkSize) {
      const chunk = uniqueIds.slice(i, i + chunkSize);
      try {
        const batch = await this.fetchCompaniesBatch(chunk);
        companies.push(...batch);
      } catch (error) {
        logger.warn(
          { err: error instanceof Error ? error.message : 'Unknown error' },
          'Teamwork targeted company fetch failed, retrying with full list'
        );
        try {
          const fallback = await this.fetchCompaniesBatch([]);
          companies.push(...fallback);
        } catch (fallbackError) {
          logger.error(
            { err: fallbackError instanceof Error ? fallbackError.message : 'Unknown error' },
            'Teamwork failed to fetch companies'
          );
        }
        break;
      }
    }

    const companyMap = new Map<number, TeamworkCompany>();
    companies.forEach((company) => {
      if (!companyMap.has(company.id)) {
        companyMap.set(company.id, company);
      }
    });

    return uniqueIds.map(
      (id) =>
        companyMap.get(id) || {
          id,
          name: `Company ${id}`,
        }
    );
  }

  /**
   * Normalize job number by stripping common prefixes
   * Examples:
   *   "JOB-12345" → "12345"
   *   "Job-12345" → "12345"
   *   "job-12345" → "12345"
   *   "12345" → "12345"
   *   "12345-001" → "12345-001" (preserves internal dashes)
   */
  private normalizeJobNumber(value: string): string {
    // Strip "JOB-", "Job-", "job-" prefix (case-insensitive)
    return value.replace(/^job-/i, '').trim();
  }

  /**
   * Transform Teamwork API v3 timelog response to our internal format
   */
  private transformTimeLog(
    log: TeamworkTimeLogResponse,
    _included?: TeamworkTimeEntriesResponse['included']
  ): TeamworkTimeLog {
    return {
      id: log.id,
      userId: log.userId,
      projectId: log.projectId,
      taskId: log.taskId,
      date: log.timeLogged,
      minutes: log.minutes,
      description: log.description || null,
      jobNumber: null,
      approvalStatus: null,
      billable: log.isBillable,
      deleted: log.deleted,
    };
  }

  /**
   * Validate API connection and credentials
   */
  async validateConnection(): Promise<boolean> {
    try {
      // Try to fetch a single project as a connection test
      await this.request<TeamworkProjectsResponse>('/projects/api/v3/projects.json?pageSize=1');
      return true;
    } catch (error) {
      if (error instanceof TeamworkAuthError) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get API health status
   */
  async getHealth(): Promise<{
    connected: boolean;
    error?: string;
  }> {
    try {
      const isConnected = await this.validateConnection();
      return { connected: isConnected };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get custom field values for multiple tasks (batched)
   * Step 3: Task Custom Fields Fetching
   *
   * Features:
   * - Checks cache first (1 hour TTL)
   * - Batches API requests (100 per batch)
   * - Uses include=customfieldTasks to get actual values from included data
   * - Uses rate limiter automatically via request()
   * - Normalizes job numbers
   *
   * @param taskIds Array of task IDs to fetch custom fields for
   * @param customFieldId Optional specific custom field ID (defaults to TEAMWORK_JOB_NUMBER_TASK_FIELD_ID)
   * @returns Map of taskId -> job number value
   */
  async getTaskCustomFields(
    taskIds: number[],
    customFieldId?: number
  ): Promise<Map<number, string | null>> {
    const fieldId = customFieldId || parseInt(process.env.TEAMWORK_JOB_NUMBER_TASK_FIELD_ID || '0');

    if (!fieldId) {
      logger.warn({}, 'Teamwork no task custom field ID configured');
      return new Map();
    }

    if (taskIds.length === 0) {
      return new Map();
    }

    const jobNumbers = new Map<number, string | null>();
    const uncachedTaskIds: number[] = [];

    // Check cache first
    for (const taskId of taskIds) {
      const cached = this.getCachedValue(this.taskCustomFieldCache, taskId);
      if (cached !== null) {
        jobNumbers.set(taskId, cached);
      } else {
        uncachedTaskIds.push(taskId);
      }
    }

    if (uncachedTaskIds.length === 0) {
      logger.debug({ cacheHits: taskIds.length }, 'Teamwork task custom fields all from cache');
      return jobNumbers;
    }

    logger.debug(
      { cached: jobNumbers.size, fetching: uncachedTaskIds.length },
      'Teamwork task custom fields cache status'
    );

    try {
      // Use include=customfieldTasks to get the actual custom field values
      // The values are returned in response.included.customfieldTasks
      const batchSize = 100;
      for (let i = 0; i < uncachedTaskIds.length; i += batchSize) {
        const batch = uncachedTaskIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');

        const response = await this.request<{
          tasks: Array<{
            id: number;
            customFieldValueIds?: number[] | null;
          }>;
          included?: {
            customfieldTasks?: Record<
              string,
              {
                id: number;
                customfieldId: number;
                value: string | number;
                taskId: number;
              }
            >;
          };
        }>(`/projects/api/v3/tasks.json?taskIds=${idsParam}&pageSize=100&include=customfieldTasks`);

        // Build a map of taskId -> job number from included data
        const taskJobNumbers = new Map<number, string | null>();

        // Initialize all tasks in batch with null
        for (const taskId of batch) {
          taskJobNumbers.set(taskId, null);
        }

        // Extract job numbers from included.customfieldTasks
        if (response.included?.customfieldTasks) {
          for (const cfValue of Object.values(response.included.customfieldTasks)) {
            // Only look at the job number field
            if (cfValue.customfieldId === fieldId && cfValue.taskId) {
              const jobNumber =
                cfValue.value != null ? this.normalizeJobNumber(String(cfValue.value)) : null;
              taskJobNumbers.set(cfValue.taskId, jobNumber);
            }
          }
        }

        // Update results and cache
        for (const [taskId, jobNumber] of taskJobNumbers) {
          jobNumbers.set(taskId, jobNumber);
          this.setCachedValue(this.taskCustomFieldCache, taskId, jobNumber);
        }
      }
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : 'Unknown error' },
        'Teamwork failed to fetch task custom fields'
      );
      // Return partial results if any
    }

    return jobNumbers;
  }

  /**
   * Get custom field values for multiple projects (batched)
   * Step 4: Project Custom Fields Fetching
   *
   * Features:
   * - Checks cache first (1 hour TTL)
   * - Batches API requests (100 per batch)
   * - Uses include=customfieldProjects to get actual values from included data
   * - Uses rate limiter automatically via request()
   * - Normalizes job numbers
   *
   * @param projectIds Array of project IDs to fetch custom fields for
   * @param customFieldId Optional specific custom field ID (defaults to TEAMWORK_JOB_NUMBER_PROJECT_FIELD_ID)
   * @returns Map of projectId -> job number value
   */
  async getProjectCustomFields(
    projectIds: number[],
    customFieldId?: number
  ): Promise<Map<number, string | null>> {
    const fieldId =
      customFieldId || parseInt(process.env.TEAMWORK_JOB_NUMBER_PROJECT_FIELD_ID || '0');

    if (!fieldId) {
      logger.warn({}, 'Teamwork no project custom field ID configured');
      return new Map();
    }

    if (projectIds.length === 0) {
      return new Map();
    }

    const jobNumbers = new Map<number, string | null>();
    const uncachedProjectIds: number[] = [];

    // Check cache first
    for (const projectId of projectIds) {
      const cached = this.getCachedValue(this.projectCustomFieldCache, projectId);
      if (cached !== null) {
        jobNumbers.set(projectId, cached);
      } else {
        uncachedProjectIds.push(projectId);
      }
    }

    if (uncachedProjectIds.length === 0) {
      logger.debug(
        { cacheHits: projectIds.length },
        'Teamwork project custom fields all from cache'
      );
      return jobNumbers;
    }

    logger.debug(
      { cached: jobNumbers.size, fetching: uncachedProjectIds.length },
      'Teamwork project custom fields cache status'
    );

    try {
      // Use include=customfieldProjects to get the actual custom field values
      // The values are returned in response.included.customfieldProjects
      const batchSize = 100;
      for (let i = 0; i < uncachedProjectIds.length; i += batchSize) {
        const batch = uncachedProjectIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');

        try {
          const response = await this.request<{
            projects: Array<{
              id: number;
              customFieldValueIds?: number[] | null;
            }>;
            included?: {
              customfieldProjects?: Record<
                string,
                {
                  id: number;
                  customfieldId: number;
                  value: string | number;
                  projectId: number;
                }
              >;
            };
          }>(
            `/projects/api/v3/projects.json?projectIds=${idsParam}&pageSize=100&include=customfieldProjects`
          );

          // Build a map of projectId -> job number from included data
          const projectJobNumbers = new Map<number, string | null>();

          // Initialize all projects in batch with null
          for (const projectId of batch) {
            projectJobNumbers.set(projectId, null);
          }

          // Extract job numbers from included.customfieldProjects
          if (response.included?.customfieldProjects) {
            for (const cfValue of Object.values(response.included.customfieldProjects)) {
              // Only look at the job number field
              if (cfValue.customfieldId === fieldId && cfValue.projectId) {
                const jobNumber =
                  cfValue.value != null ? this.normalizeJobNumber(String(cfValue.value)) : null;
                projectJobNumbers.set(cfValue.projectId, jobNumber);
              }
            }
          }

          // Update results and cache
          for (const [projectId, jobNumber] of projectJobNumbers) {
            jobNumbers.set(projectId, jobNumber);
            this.setCachedValue(this.projectCustomFieldCache, projectId, jobNumber);
          }
        } catch (batchError) {
          // If batch fails, try fetching individually with include=customfieldProjects
          logger.warn(
            { err: batchError instanceof Error ? batchError.message : 'Unknown error' },
            'Teamwork batch project fetch failed, trying individual requests'
          );

          for (const projectId of batch) {
            try {
              const response = await this.request<{
                project: {
                  id: number;
                  customFieldValueIds?: number[] | null;
                };
                included?: {
                  customfieldProjects?: Record<
                    string,
                    {
                      id: number;
                      customfieldId: number;
                      value: string | number;
                      projectId: number;
                    }
                  >;
                };
              }>(`/projects/api/v3/projects/${projectId}.json?include=customfieldProjects`);

              let jobNumber: string | null = null;

              // Extract job number from included.customfieldProjects
              if (response.included?.customfieldProjects) {
                for (const cfValue of Object.values(response.included.customfieldProjects)) {
                  if (cfValue.customfieldId === fieldId) {
                    jobNumber =
                      cfValue.value != null ? this.normalizeJobNumber(String(cfValue.value)) : null;
                    break;
                  }
                }
              }

              jobNumbers.set(projectId, jobNumber);
              this.setCachedValue(this.projectCustomFieldCache, projectId, jobNumber);
            } catch (individualError) {
              logger.error(
                {
                  projectId,
                  err: individualError instanceof Error ? individualError.message : 'Unknown error',
                },
                'Teamwork failed to fetch custom fields for project'
              );
              jobNumbers.set(projectId, null);
              this.setCachedValue(this.projectCustomFieldCache, projectId, null);
            }
          }
        }
      }
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : 'Unknown error' },
        'Teamwork failed to fetch project custom fields'
      );
      // Return partial results if any
    }

    return jobNumbers;
  }

  async getTimeApprovals(
    statuses: Array<'approved' | 'inReview' | 'needsChanges'> = [
      'approved',
      'inReview',
      'needsChanges',
    ]
  ): Promise<TeamworkApproval[]> {
    const allApprovals: TeamworkApproval[] = [];
    let currentPage = 1;
    let hasMore = true;

    const statusesParam = statuses.join(',');

    while (hasMore) {
      const response = await this.request<TeamworkApprovalsResponse>(
        `/projects/api/v3/time/approvals.json?statuses=${statusesParam}&page=${currentPage}&pageSize=250`
      );

      allApprovals.push(...response.timeApprovals);

      const pageInfo = response.meta.page;
      hasMore = pageInfo.hasMore;
      currentPage++;

      if (currentPage > 100) {
        logger.warn({ maxPages: 100 }, 'Teamwork reached maximum page limit for approvals');
        break;
      }
    }

    logger.info({ count: allApprovals.length }, 'Teamwork fetched time approvals');
    return allApprovals;
  }

  async getApprovalTimeLogIds(approvalId: number): Promise<number[]> {
    try {
      const response = await this.request<TeamworkApprovalTimelogsResponse>(
        `/projects/api/v3/time/approvals/${approvalId}/time.json?include=timelogs`
      );

      const timelogIds = response.timeApprovalTimelogs.timelogs.map((t) => t.id);
      return timelogIds;
    } catch (error) {
      logger.error(
        { approvalId, err: error instanceof Error ? error.message : 'Unknown error' },
        'Teamwork failed to fetch time logs for approval'
      );
      return [];
    }
  }

  async buildApprovalStatusMap(): Promise<Map<number, ApprovalStatus>> {
    const statusMap = new Map<number, ApprovalStatus>();

    const approvals = await this.getTimeApprovals();
    logger.info({ approvalCount: approvals.length }, 'Teamwork building approval status map');

    const statusMapping: Record<string, ApprovalStatus> = {
      approved: 'approved',
      inReview: 'inreview',
      needsChanges: 'needschanges',
    };

    let processed = 0;
    for (const approval of approvals) {
      const timelogIds = await this.getApprovalTimeLogIds(approval.id);
      const normalizedStatus = statusMapping[approval.status] || null;

      for (const timelogId of timelogIds) {
        statusMap.set(timelogId, normalizedStatus);
      }

      processed++;
      if (processed % 50 === 0) {
        logger.debug(
          { processed, total: approvals.length },
          'Teamwork approval processing progress'
        );
      }
    }

    logger.info({ timeLogEntries: statusMap.size }, 'Teamwork built approval status map');
    return statusMap;
  }
}

/**
 * Singleton instance for application-wide use
 */
let teamworkClient: TeamworkClient | null = null;

export function getTeamworkClient(): TeamworkClient {
  if (!teamworkClient) {
    teamworkClient = new TeamworkClient();
  }
  return teamworkClient;
}

export default TeamworkClient;
