/**
 * Sync Service
 * Backend Lead Agent - Phase 2
 *
 * Handles synchronization of time logs from Teamwork API to database
 */

import { prisma } from './db';
import { getTeamworkClient } from './teamwork';
import type { TeamworkTimeLog, ApprovalStatus } from './types';
import { logger, logSync, logCritical } from './logger';
import { formatDatePT } from './utils';

const JOB_NUMBER_CACHE_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours - reduced from 24h to prevent stale job numbers
const UPSERT_CHUNK_SIZE = 100;

// Sync result interface
export interface SyncResult {
  success: boolean;
  syncedProjects: number;
  syncedTimeLogs: number;
  errors: string[];
  timestamp: Date;
  syncType: 'full' | 'incremental';
}

// Sync options
export interface SyncOptions {
  incremental?: boolean;
  startDate?: Date;
  endDate?: Date;
  projectIds?: string[];
}

/**
 * Sync Service Class
 * Orchestrates data synchronization from Teamwork to database
 */
export class SyncService {
  private teamworkClient = getTeamworkClient();
  private lastCustomFieldErrors: string[] = [];

  /**
   * Perform full or incremental sync of time logs
   */
  async syncTimeLogs(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let syncedProjects = 0;
    let syncedTimeLogs = 0;

    // Clear previous custom field errors
    this.lastCustomFieldErrors = [];

    try {
      logSync({
        operation: 'start',
        incremental: options.incremental || false,
      });

      // Step 1: Sync projects first (required for foreign keys)
      try {
        syncedProjects = await this.syncProjects();
        logger.info({ syncedProjects }, 'Synced projects');
      } catch (error) {
        const errorMsg = `Failed to sync projects: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error({ err: errorMsg }, 'Project sync failed');
        // Continue with time logs even if projects fail (existing projects may be sufficient)
      }

      // Step 2: Determine sync strategy
      let timeLogs: TeamworkTimeLog[] = [];
      let users: Map<
        number,
        { firstName: string; lastName: string; email: string; companyId: number }
      > = new Map();
      let companies: Map<number, { name: string }> = new Map();

      if (options.incremental) {
        // Incremental sync: only get logs updated since last sync
        const lastSyncDate = await this.getLastSyncDate();
        if (lastSyncDate) {
          logger.info(
            { lastSyncDate: lastSyncDate.toISOString() },
            'Incremental sync from last sync date'
          );
          const result = await this.teamworkClient.getTimeLogsUpdatedAfter(lastSyncDate, {
            startDate: options.startDate?.toISOString().split('T')[0],
            endDate: options.endDate?.toISOString().split('T')[0],
            projectIds: options.projectIds,
          });
          timeLogs = result.timeLogs;
          users = result.users;
          companies = result.companies;
        } else {
          logger.info({}, 'No previous sync found, performing full sync');
          const result = await this.teamworkClient.getTimeLogs({
            startDate: options.startDate?.toISOString().split('T')[0],
            endDate: options.endDate?.toISOString().split('T')[0],
            projectIds: options.projectIds,
          });
          timeLogs = result.timeLogs;
          users = result.users;
          companies = result.companies;
        }
      } else {
        // Full sync: get all approved time logs
        logger.info({}, 'Performing full sync');
        const result = await this.teamworkClient.getTimeLogs({
          startDate: options.startDate?.toISOString().split('T')[0],
          endDate: options.endDate?.toISOString().split('T')[0],
          projectIds: options.projectIds,
        });
        timeLogs = result.timeLogs;
        users = result.users;
        companies = result.companies;
      }

      logger.info(
        { timeLogCount: timeLogs.length, userCount: users.size, companyCount: companies.size },
        'Fetched data from Teamwork'
      );

      // Step 2.5: Sync companies first (required for foreign keys)
      try {
        const syncedCompanies = await this.syncCompanies(companies);
        logger.info({ syncedCompanies }, 'Synced companies');
      } catch (error) {
        const errorMsg = `Failed to sync companies: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error({ err: errorMsg }, 'Company sync failed');
      }

      // Step 3: Enrich time logs with job numbers from custom fields
      const enrichedTimeLogs = await this.enrichTimeLogsWithJobNumbers(timeLogs);
      logger.debug({}, 'Enriched time logs with job numbers');

      // Step 3.5: Fetch approval status for time logs
      try {
        logger.debug({}, 'Fetching approval status from Teamwork');
        const approvalStatusMap = await this.teamworkClient.buildApprovalStatusMap();
        logger.info(
          { approvalStatusCount: approvalStatusMap.size },
          'Got approval status from Teamwork'
        );

        for (const log of enrichedTimeLogs) {
          const status = approvalStatusMap.get(log.id);
          if (status !== undefined) {
            log.approvalStatus = status;
          }
        }

        const approvedCount = enrichedTimeLogs.filter(
          (l) => l.approvalStatus === 'approved'
        ).length;
        const inReviewCount = enrichedTimeLogs.filter(
          (l) => l.approvalStatus === 'inreview'
        ).length;
        const needsChangesCount = enrichedTimeLogs.filter(
          (l) => l.approvalStatus === 'needschanges'
        ).length;
        const noStatusCount = enrichedTimeLogs.filter((l) => l.approvalStatus === null).length;

        logger.info(
          { approvedCount, inReviewCount, needsChangesCount, noStatusCount },
          'Approval status breakdown'
        );
      } catch (error) {
        const errorMsg = `Failed to fetch approval status: ${error instanceof Error ? error.message : 'Unknown error'}`;
        errors.push(errorMsg);
        logger.error({ err: errorMsg }, 'Approval status fetch failed');
      }

      // Step 4: Sync time logs to database
      syncedTimeLogs = await this.upsertTimeLogs(enrichedTimeLogs, users);
      logger.info({ syncedTimeLogs }, 'Upserted time logs to database');

      // Include custom field errors in result
      errors.push(...this.lastCustomFieldErrors);

      const duration = Date.now() - startTime;

      // Log final status
      logSync({
        operation: 'complete',
        incremental: options.incremental || false,
        syncedProjects,
        syncedLogs: syncedTimeLogs,
        duration,
        customFieldErrors: this.lastCustomFieldErrors.length,
      });

      return {
        success: errors.length === 0,
        syncedProjects,
        syncedTimeLogs,
        errors,
        timestamp: new Date(),
        syncType: options.incremental ? 'incremental' : 'full',
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown sync error';
      errors.push(errorMsg);

      // Include custom field errors even on critical failure
      errors.push(...this.lastCustomFieldErrors);

      logSync({
        operation: 'error',
        incremental: options.incremental || false,
        syncedProjects,
        syncedLogs: syncedTimeLogs,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error : new Error(errorMsg),
        customFieldErrors: this.lastCustomFieldErrors.length,
      });

      // Log critical error for immediate attention
      if (error instanceof Error) {
        logCritical({
          message: 'Sync operation failed completely',
          error,
          context: {
            incremental: options.incremental || false,
            syncedProjects,
            syncedTimeLogs,
            totalErrors: errors.length,
          },
        });
      }

      return {
        success: false,
        syncedProjects,
        syncedTimeLogs,
        errors,
        timestamp: new Date(),
        syncType: options.incremental ? 'incremental' : 'full',
      };
    }
  }

  private async syncCompanies(companies: Map<number, { name: string }>): Promise<number> {
    if (companies.size === 0) return 0;

    const companyIds = Array.from(companies.keys());
    const existing = await prisma.company.findMany({
      where: { teamworkCompanyId: { in: companyIds } },
      select: { teamworkCompanyId: true },
    });
    const existingIds = new Set(existing.map((c) => c.teamworkCompanyId));

    const newCompanies: Array<{ teamworkCompanyId: number; name: string }> = [];
    const updates: Array<{ teamworkCompanyId: number; name: string }> = [];

    for (const [teamworkCompanyId, data] of companies.entries()) {
      if (existingIds.has(teamworkCompanyId)) {
        updates.push({ teamworkCompanyId, name: data.name });
      } else {
        newCompanies.push({ teamworkCompanyId, name: data.name });
      }
    }

    let syncedCount = 0;

    if (newCompanies.length > 0) {
      const result = await prisma.company.createMany({
        data: newCompanies,
        skipDuplicates: true,
      });
      syncedCount += result.count;
    }

    if (updates.length > 0) {
      for (let i = 0; i < updates.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = updates.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.$transaction(
          chunk.map((u) =>
            prisma.company.update({
              where: { teamworkCompanyId: u.teamworkCompanyId },
              data: { name: u.name, updatedAt: new Date() },
            })
          )
        );
        syncedCount += chunk.length;
      }
    }

    return syncedCount;
  }

  private async syncProjects(): Promise<number> {
    const projects = await this.teamworkClient.getProjects();
    if (projects.length === 0) return 0;

    const projectIds = projects.map((project) => project.id);

    let projectJobCodes = new Map<number, string | null>();
    try {
      projectJobCodes = await this.resolveProjectJobNumbers(projectIds);
    } catch (error) {
      logger.error(
        { err: error instanceof Error ? error.message : 'Unknown error' },
        'Failed to resolve project job numbers from cache'
      );
      projectJobCodes = new Map<number, string | null>();
    }

    const existing = await prisma.project.findMany({
      where: { teamworkProjectId: { in: projectIds } },
      select: { teamworkProjectId: true },
    });
    const existingIds = new Set(existing.map((p) => p.teamworkProjectId));

    const newProjects: Array<{ teamworkProjectId: number; name: string; jobCode: string | null }> =
      [];
    const updates: Array<{ teamworkProjectId: number; name: string; jobCode: string | null }> = [];

    for (const project of projects) {
      const jobCode = projectJobCodes.get(project.id) ?? null;
      if (existingIds.has(project.id)) {
        updates.push({ teamworkProjectId: project.id, name: project.name, jobCode });
      } else {
        newProjects.push({ teamworkProjectId: project.id, name: project.name, jobCode });
      }
    }

    let syncedCount = 0;

    if (newProjects.length > 0) {
      const result = await prisma.project.createMany({
        data: newProjects,
        skipDuplicates: true,
      });
      syncedCount += result.count;
    }

    if (updates.length > 0) {
      for (let i = 0; i < updates.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = updates.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.$transaction(
          chunk.map((u) =>
            prisma.project.update({
              where: { teamworkProjectId: u.teamworkProjectId },
              data: { name: u.name, jobCode: u.jobCode, updatedAt: new Date() },
            })
          )
        );
        syncedCount += chunk.length;
      }
    }

    return syncedCount;
  }

  /**
   * Enrich time logs with job numbers from custom fields
   * Step 5: Job Number Mapping
   *
   * Features:
   * - Graceful error handling: continues even if custom field API fails
   * - Implements fallback strategy: task → project → null
   * - Returns partial results on API failures
   * - Detailed error logging with context
   *
   * Fallback strategy:
   * 1. Check task custom field (primary)
   * 2. Check project custom field (fallback)
   * 3. Set to null if both missing or failed
   */
  private async enrichTimeLogsWithJobNumbers(
    timeLogs: TeamworkTimeLog[]
  ): Promise<TeamworkTimeLog[]> {
    if (timeLogs.length === 0) {
      return timeLogs;
    }

    const customFieldErrors: string[] = [];

    try {
      logger.debug({}, 'Resolving job numbers with persistent cache');

      const taskIds = [
        ...new Set(timeLogs.filter((log) => log.taskId !== null).map((log) => log.taskId!)),
      ];
      const projectIds = [...new Set(timeLogs.map((log) => log.projectId))];

      logger.debug(
        { taskCount: taskIds.length, projectCount: projectIds.length },
        'Found unique tasks and projects'
      );

      const results = await Promise.allSettled([
        taskIds.length > 0
          ? this.resolveTaskJobNumbers(taskIds)
          : Promise.resolve(new Map<number, string | null>()),
        this.resolveProjectJobNumbers(projectIds),
      ]);

      let taskJobNumbers = new Map<number, string | null>();
      let projectJobNumbers = new Map<number, string | null>();

      if (results[0].status === 'fulfilled') {
        taskJobNumbers = results[0].value;
        logger.debug({ count: taskJobNumbers.size }, 'Task job numbers resolved');
      } else {
        const errorMsg = `Task job number resolution failed: ${results[0].reason instanceof Error ? results[0].reason.message : 'Unknown error'}`;
        customFieldErrors.push(errorMsg);
        logger.error({ err: errorMsg }, 'Task job number resolution failed');
      }

      if (results[1].status === 'fulfilled') {
        projectJobNumbers = results[1].value;
        logger.debug({ count: projectJobNumbers.size }, 'Project job numbers resolved');
      } else {
        const errorMsg = `Project job number resolution failed: ${results[1].reason instanceof Error ? results[1].reason.message : 'Unknown error'}`;
        customFieldErrors.push(errorMsg);
        logger.error({ err: errorMsg }, 'Project job number resolution failed');
      }

      let resolvedFromTask = 0;
      let resolvedFromProject = 0;
      let missing = 0;

      const enrichedLogs = timeLogs.map((log) => {
        let jobNumber: string | null = null;

        if (log.taskId !== null) {
          const taskJobNumber = taskJobNumbers.get(log.taskId);
          if (taskJobNumber !== undefined && taskJobNumber !== null) {
            jobNumber = taskJobNumber;
            resolvedFromTask++;
          }
        }

        if (jobNumber === null) {
          const projectJobNumber = projectJobNumbers.get(log.projectId);
          if (projectJobNumber !== undefined && projectJobNumber !== null) {
            jobNumber = projectJobNumber;
            resolvedFromProject++;
          }
        }

        if (jobNumber === null) {
          missing++;
        }

        return {
          ...log,
          jobNumber,
        };
      });

      const total = timeLogs.length;
      const resolved = resolvedFromTask + resolvedFromProject;
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

      logger.info(
        {
          total,
          resolved,
          resolutionRate,
          resolvedFromTask,
          resolvedFromProject,
          missing,
          missingRate: Math.round((missing / total) * 100),
        },
        'Job number resolution statistics'
      );

      if (customFieldErrors.length > 0) {
        logger.warn(
          { errorCount: customFieldErrors.length, errors: customFieldErrors },
          'Custom field errors during job number resolution'
        );
        this.lastCustomFieldErrors = customFieldErrors;
      }

      return enrichedLogs;
    } catch (error) {
      const errorMsg = `Failed to enrich time logs with job numbers: ${error instanceof Error ? error.message : 'Unknown error'}`;
      logger.error({ err: errorMsg }, 'Failed to enrich time logs with job numbers');
      this.lastCustomFieldErrors = [errorMsg];
      logger.warn({}, 'Continuing sync without job numbers due to critical error');
      return timeLogs;
    }
  }

  private isCacheEntryFresh(fetchedAt: Date): boolean {
    return Date.now() - fetchedAt.getTime() <= JOB_NUMBER_CACHE_TTL_MS;
  }

  private async resolveTaskJobNumbers(taskIds: number[]): Promise<Map<number, string | null>> {
    if (taskIds.length === 0) {
      return new Map();
    }

    const cachedEntries = await prisma.taskJobNumberCache.findMany({
      where: {
        taskId: {
          in: taskIds,
        },
      },
    });

    const freshMap = new Map<number, string | null>();
    const needsRefresh = new Set<number>();

    for (const entry of cachedEntries) {
      if (this.isCacheEntryFresh(entry.fetchedAt)) {
        freshMap.set(entry.taskId, entry.jobNumber ?? null);
      } else {
        needsRefresh.add(entry.taskId);
      }
    }

    for (const taskId of taskIds) {
      if (!freshMap.has(taskId) && !needsRefresh.has(taskId)) {
        needsRefresh.add(taskId);
      }
    }

    if (needsRefresh.size > 0) {
      const ids = Array.from(needsRefresh);
      const apiResults = await this.teamworkClient.getTaskCustomFields(ids);
      const persistenceMap = new Map<number, string | null>();

      for (const taskId of ids) {
        const value = apiResults.get(taskId) ?? null;
        persistenceMap.set(taskId, value);
        freshMap.set(taskId, value);
      }

      await this.persistTaskJobNumbers(persistenceMap);
    }

    return freshMap;
  }

  private async resolveProjectJobNumbers(
    projectIds: number[]
  ): Promise<Map<number, string | null>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const cachedEntries = await prisma.projectJobNumberCache.findMany({
      where: {
        projectId: {
          in: projectIds,
        },
      },
    });

    const freshMap = new Map<number, string | null>();
    const needsRefresh = new Set<number>();

    for (const entry of cachedEntries) {
      if (this.isCacheEntryFresh(entry.fetchedAt)) {
        freshMap.set(entry.projectId, entry.jobNumber ?? null);
      } else {
        needsRefresh.add(entry.projectId);
      }
    }

    for (const projectId of projectIds) {
      if (!freshMap.has(projectId) && !needsRefresh.has(projectId)) {
        needsRefresh.add(projectId);
      }
    }

    if (needsRefresh.size > 0) {
      const ids = Array.from(needsRefresh);
      const apiResults = await this.teamworkClient.getProjectCustomFields(ids);
      const persistenceMap = new Map<number, string | null>();

      for (const projectId of ids) {
        const value = apiResults.get(projectId) ?? null;
        persistenceMap.set(projectId, value);
        freshMap.set(projectId, value);
      }

      await this.persistProjectJobNumbers(persistenceMap);
    }

    return freshMap;
  }

  private async persistTaskJobNumbers(jobNumbers: Map<number, string | null>): Promise<void> {
    if (jobNumbers.size === 0) {
      return;
    }

    const entries = Array.from(jobNumbers.entries());
    for (let i = 0; i < entries.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = entries.slice(i, i + UPSERT_CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map(([taskId, jobNumber]) =>
          prisma.taskJobNumberCache.upsert({
            where: { taskId },
            update: {
              jobNumber,
              fetchedAt: new Date(),
            },
            create: {
              taskId,
              jobNumber,
            },
          })
        )
      );
    }
  }

  private async persistProjectJobNumbers(jobNumbers: Map<number, string | null>): Promise<void> {
    if (jobNumbers.size === 0) {
      return;
    }

    const entries = Array.from(jobNumbers.entries());
    for (let i = 0; i < entries.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = entries.slice(i, i + UPSERT_CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map(([projectId, jobNumber]) =>
          prisma.projectJobNumberCache.upsert({
            where: { projectId },
            update: {
              jobNumber,
              fetchedAt: new Date(),
            },
            create: {
              projectId,
              jobNumber,
            },
          })
        )
      );
    }
  }

  /**
   * Upsert time logs to database
   * Uses upsert to handle both new and updated logs
   */
  private async upsertTimeLogs(
    timeLogs: TeamworkTimeLog[],
    users: Map<number, { firstName: string; lastName: string; email: string; companyId: number }>
  ): Promise<number> {
    if (timeLogs.length === 0) {
      return 0;
    }

    // Ensure we have user snapshots for every time log
    for (const log of timeLogs) {
      if (!users.has(log.userId)) {
        users.set(log.userId, {
          firstName: 'Teamwork',
          lastName: `User ${log.userId}`,
          email: `teamwork-user-${log.userId}@placeholder.local`,
          companyId: 0,
        });
      }
    }

    const userIdMap = await this.ensureUsers(users);
    const projectIdMap = await this.getProjectIdMap(timeLogs.map((log) => log.projectId));

    const teamworkLogIds = timeLogs.map((log) => log.id);
    const existingLogs = await prisma.timeLog.findMany({
      where: {
        teamworkLogId: {
          in: teamworkLogIds,
        },
      },
      select: {
        teamworkLogId: true,
      },
    });
    const existingLogIds = new Set(existingLogs.map((log) => log.teamworkLogId));

    const now = new Date();
    const newLogPayload: Array<{
      teamworkLogId: number;
      userId: string;
      projectId: string;
      date: Date;
      minutes: number;
      description: string | null;
      jobNumber: string | null;
      approvalStatus: string | null;
      billable: boolean;
      syncedAt: Date;
      deletedAt: Date | null;
    }> = [];
    const updatePayload: Array<{
      teamworkLogId: number;
      data: {
        userId: string;
        projectId: string;
        date: Date;
        minutes: number;
        description: string | null;
        jobNumber: string | null;
        approvalStatus: string | null;
        billable: boolean;
        syncedAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
      };
    }> = [];

    for (const log of timeLogs) {
      const userId = userIdMap.get(log.userId);
      const projectId = projectIdMap.get(log.projectId);

      if (!userId || !projectId) {
        logger.warn(
          { timeLogId: log.id, teamworkUserId: log.userId, teamworkProjectId: log.projectId },
          'Missing user/project mapping for time log'
        );
        continue;
      }

      // Validate and parse date
      let parsedDate: Date;
      try {
        if (!log.date || typeof log.date !== 'string') {
          throw new Error(`Invalid date format: ${JSON.stringify(log.date)}`);
        }

        // Parse YYYY-MM-DD format at noon UTC
        if (/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
          parsedDate = new Date(`${log.date}T12:00:00.000Z`);
        } else {
          // Full datetime format (e.g., "2025-12-16T03:15:00.000Z")
          // Convert to Pacific Time first, then extract date, to match Teamwork's display
          const utcDate = new Date(log.date);
          if (isNaN(utcDate.getTime())) {
            throw new Error(`Unparseable date: ${log.date}`);
          }
          // Get the date in Pacific Time (what users see in Teamwork)
          const dateInPT = formatDatePT(utcDate);
          parsedDate = new Date(`${dateInPT}T12:00:00.000Z`);
        }

        // Verify the date is valid
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid Date object created from: ${log.date}`);
        }
      } catch (error) {
        logger.error(
          { timeLogId: log.id, err: error instanceof Error ? error.message : 'Invalid date' },
          'Skipping time log due to date error'
        );
        continue;
      }

      const baseData = {
        userId,
        projectId,
        date: parsedDate,
        minutes: log.minutes,
        description: log.description,
        jobNumber: log.jobNumber,
        approvalStatus: log.approvalStatus,
        billable: log.billable,
        syncedAt: now,
        // Soft delete: set deletedAt when Teamwork marks record as deleted, clear when restored
        deletedAt: log.deleted ? now : null,
      };

      if (existingLogIds.has(log.id)) {
        updatePayload.push({
          teamworkLogId: log.id,
          data: {
            ...baseData,
            updatedAt: now,
          },
        });
      } else {
        newLogPayload.push({
          teamworkLogId: log.id,
          ...baseData,
        });
      }
    }

    await this.bulkCreateTimeLogs(newLogPayload);
    await this.bulkUpdateTimeLogs(updatePayload);

    return newLogPayload.length + updatePayload.length;
  }

  private async ensureUsers(
    users: Map<number, { firstName: string; lastName: string; email: string; companyId: number }>
  ): Promise<Map<number, string>> {
    if (users.size === 0) {
      return new Map();
    }

    const normalizedUsers = Array.from(users.entries()).map(([teamworkUserId, info]) => {
      const email = info?.email || `teamwork-user-${teamworkUserId}@placeholder.local`;
      const name =
        `${info?.firstName || 'Teamwork'} ${info?.lastName || `User ${teamworkUserId}`}`.trim();
      return {
        teamworkUserId,
        googleId: `teamwork-${teamworkUserId}`,
        email,
        name,
        teamworkCompanyId: info?.companyId ?? null,
      };
    });

    const companyIds = Array.from(
      new Set(
        normalizedUsers
          .map((user) => user.teamworkCompanyId)
          .filter((id): id is number => typeof id === 'number' && id > 0)
      )
    );

    let companyMap = new Map<number, string>();
    if (companyIds.length > 0) {
      const companies = await prisma.company.findMany({
        where: {
          teamworkCompanyId: {
            in: companyIds,
          },
        },
        select: {
          id: true,
          teamworkCompanyId: true,
        },
      });
      companyMap = new Map(companies.map((company) => [company.teamworkCompanyId, company.id]));
    }

    const preparedUsers = normalizedUsers.map((user) => ({
      ...user,
      prismaCompanyId: user.teamworkCompanyId
        ? (companyMap.get(user.teamworkCompanyId) ?? null)
        : null,
    }));

    const googleIds = preparedUsers.map((user) => user.googleId);
    const existingUsers = await prisma.user.findMany({
      where: {
        googleId: {
          in: googleIds,
        },
      },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        companyId: true,
      },
    });
    const existingMap = new Map(existingUsers.map((user) => [user.googleId, user]));

    const newUsers: typeof preparedUsers = [];
    const updates: Array<{
      googleId: string;
      data: { email: string; name: string; companyId: string | null };
    }> = [];

    for (const user of preparedUsers) {
      const existing = existingMap.get(user.googleId);
      if (!existing) {
        newUsers.push(user);
        continue;
      }

      const desiredCompanyId = user.prismaCompanyId ?? null;
      if (
        existing.email !== user.email ||
        existing.name !== user.name ||
        existing.companyId !== desiredCompanyId
      ) {
        updates.push({
          googleId: user.googleId,
          data: {
            email: user.email,
            name: user.name,
            companyId: desiredCompanyId,
          },
        });
      }
    }

    if (newUsers.length > 0) {
      for (let i = 0; i < newUsers.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = newUsers.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.user.createMany({
          data: chunk.map((user) => ({
            googleId: user.googleId,
            email: user.email,
            name: user.name,
            companyId: user.prismaCompanyId,
          })),
          skipDuplicates: true,
        });
      }
    }

    if (updates.length > 0) {
      const emailsToUpdate = updates.map((u) => u.data.email);
      const existingEmails = await prisma.user.findMany({
        where: { email: { in: emailsToUpdate } },
        select: { email: true, googleId: true },
      });
      const emailToGoogleId = new Map(existingEmails.map((u) => [u.email, u.googleId]));

      for (let i = 0; i < updates.length; i += UPSERT_CHUNK_SIZE) {
        const slice = updates.slice(i, i + UPSERT_CHUNK_SIZE);
        await prisma.$transaction(
          slice.map((update) => {
            const conflictingGoogleId = emailToGoogleId.get(update.data.email);
            const emailConflicts =
              conflictingGoogleId !== undefined && conflictingGoogleId !== update.googleId;

            return prisma.user.update({
              where: {
                googleId: update.googleId,
              },
              data: emailConflicts
                ? { name: update.data.name, companyId: update.data.companyId }
                : update.data,
            });
          })
        );
      }
    }

    const hydratedUsers = await prisma.user.findMany({
      where: {
        googleId: {
          in: googleIds,
        },
      },
      select: {
        id: true,
        googleId: true,
      },
    });

    const googleIdMap = new Map<string, number>();
    preparedUsers.forEach((user) => {
      googleIdMap.set(user.googleId, user.teamworkUserId);
    });

    const userIdMap = new Map<number, string>();
    for (const user of hydratedUsers) {
      const teamworkUserId = googleIdMap.get(user.googleId);
      if (teamworkUserId !== undefined) {
        userIdMap.set(teamworkUserId, user.id);
      }
    }

    return userIdMap;
  }

  private async getProjectIdMap(projectIds: number[]): Promise<Map<number, string>> {
    if (projectIds.length === 0) {
      return new Map();
    }

    const uniqueIds = [...new Set(projectIds)];
    const projects = await prisma.project.findMany({
      where: {
        teamworkProjectId: {
          in: uniqueIds,
        },
      },
      select: {
        id: true,
        teamworkProjectId: true,
      },
    });

    return new Map(projects.map((project) => [project.teamworkProjectId, project.id]));
  }

  private async bulkCreateTimeLogs(
    payload: Array<{
      teamworkLogId: number;
      userId: string;
      projectId: string;
      date: Date;
      minutes: number;
      description: string | null;
      jobNumber: string | null;
      approvalStatus: string | null;
      billable: boolean;
      syncedAt: Date;
      deletedAt: Date | null;
    }>
  ): Promise<void> {
    if (payload.length === 0) {
      return;
    }

    for (let i = 0; i < payload.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = payload.slice(i, i + UPSERT_CHUNK_SIZE);
      await prisma.timeLog.createMany({
        data: chunk,
        skipDuplicates: true,
      });
    }
  }

  private async bulkUpdateTimeLogs(
    payload: Array<{
      teamworkLogId: number;
      data: {
        userId: string;
        projectId: string;
        date: Date;
        minutes: number;
        description: string | null;
        jobNumber: string | null;
        approvalStatus: string | null;
        billable: boolean;
        syncedAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
      };
    }>
  ): Promise<void> {
    if (payload.length === 0) {
      return;
    }

    for (let i = 0; i < payload.length; i += UPSERT_CHUNK_SIZE) {
      const chunk = payload.slice(i, i + UPSERT_CHUNK_SIZE);
      await prisma.$transaction(
        chunk.map((item) =>
          prisma.timeLog.update({
            where: { teamworkLogId: item.teamworkLogId },
            data: item.data,
          })
        )
      );
    }
  }

  /**
   * Get the timestamp of the last successful sync
   */
  private async getLastSyncDate(): Promise<Date | null> {
    const lastLog = await prisma.timeLog.findFirst({
      orderBy: {
        syncedAt: 'desc',
      },
      select: {
        syncedAt: true,
      },
    });

    return lastLog?.syncedAt || null;
  }

  /**
   * Validate Teamwork API connection
   */
  async validateConnection(): Promise<boolean> {
    return this.teamworkClient.validateConnection();
  }

  /**
   * Get sync service health status
   */
  async getHealth(): Promise<{
    teamworkConnected: boolean;
    databaseConnected: boolean;
    lastSyncDate: Date | null;
    error?: string;
  }> {
    try {
      const teamworkHealth = await this.teamworkClient.getHealth();
      const lastSyncDate = await this.getLastSyncDate();

      // Test database connection
      let databaseConnected = false;
      try {
        await prisma.$queryRaw`SELECT 1`;
        databaseConnected = true;
      } catch (error) {
        logger.error(
          { err: error instanceof Error ? error.message : 'Unknown error' },
          'Database health check failed'
        );
      }

      return {
        teamworkConnected: teamworkHealth.connected,
        databaseConnected,
        lastSyncDate,
        error: teamworkHealth.error,
      };
    } catch (error) {
      return {
        teamworkConnected: false,
        databaseConnected: false,
        lastSyncDate: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * Singleton instance for application-wide use
 */
let syncService: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncService) {
    syncService = new SyncService();
  }
  return syncService;
}

/**
 * Helper function to perform sync with default options
 */
export async function syncTimeLogs(options: SyncOptions = {}): Promise<SyncResult> {
  const service = getSyncService();
  return service.syncTimeLogs(options);
}

export default SyncService;
