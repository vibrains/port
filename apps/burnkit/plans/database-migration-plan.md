# Database Migration Plan - Teamwork Integration

## Overview

This document outlines the database schema changes required for Teamwork integration, including migration scripts and rollback procedures.

## Schema Changes Summary

### New Tables: 3

- `teamwork_config` - API configuration storage
- `teamwork_sync_log` - Sync operation tracking
- `teamwork_entity_mapping` - Entity ID mapping

### Modified Tables: 1

- `fact_time_entries` - Add Teamwork tracking fields

### New Enums: 2

- `SyncStatus` - Sync operation status
- `EntityType` - Entity type for mappings
- `SourceType` - Data source type

## Detailed Schema Changes

### 1. New Enum: SyncStatus

```prisma
enum SyncStatus {
  pending
  running
  completed
  failed
}
```

**Purpose**: Track the status of sync operations

### 2. New Enum: EntityType

```prisma
enum EntityType {
  person
  client
  project
  time_entry
}
```

**Purpose**: Identify entity types in mapping table

### 3. New Enum: SourceType

```prisma
enum SourceType {
  manual    // Excel upload
  teamwork  // Teamwork sync
}
```

**Purpose**: Distinguish data source for time entries

### 4. New Table: teamwork_config

```prisma
model TeamworkConfig {
  id              Int       @id @default(autoincrement())
  userId          String    @unique @map("user_id")
  installationUrl String    @map("installation_url")
  apiKey          String    @map("api_key")
  isActive        Boolean   @default(true) @map("is_active")
  lastSyncAt      DateTime? @map("last_sync_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("teamwork_config")
}
```

**Indexes**:

- Primary key on `id`
- Unique constraint on `user_id`
- Foreign key to `users(id)` with CASCADE delete

**Notes**:

- `apiKey` will be encrypted before storage
- `installationUrl` format: `company.teamwork.com`
- One config per user

### 5. New Table: teamwork_sync_log

```prisma
model TeamworkSyncLog {
  id              Int       @id @default(autoincrement())
  userId          String    @map("user_id")
  status          SyncStatus
  startedAt       DateTime  @default(now()) @map("started_at")
  completedAt     DateTime? @map("completed_at")
  dateRangeStart  DateTime  @map("date_range_start") @db.Date
  dateRangeEnd    DateTime  @map("date_range_end") @db.Date
  entriesProcessed Int      @default(0) @map("entries_processed")
  entriesCreated  Int       @default(0) @map("entries_created")
  entriesUpdated  Int       @default(0) @map("entries_updated")
  errorMessage    String?   @map("error_message") @db.Text

  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, startedAt])
  @@index([status])
  @@map("teamwork_sync_log")
}
```

**Indexes**:

- Primary key on `id`
- Composite index on `(user_id, started_at)` for user history queries
- Index on `status` for filtering active syncs
- Foreign key to `users(id)` with CASCADE delete

**Notes**:

- Tracks all sync operations
- `errorMessage` stored as TEXT for detailed errors
- Metrics for monitoring and reporting

### 6. New Table: teamwork_entity_mapping

```prisma
model TeamworkEntityMapping {
  id              Int       @id @default(autoincrement())
  entityType      EntityType @map("entity_type")
  teamworkId      String    @map("teamwork_id")
  burnkitId       Int       @map("burnkit_id")
  createdAt       DateTime  @default(now()) @map("created_at")

  @@unique([entityType, teamworkId])
  @@index([entityType, burnkitId])
  @@map("teamwork_entity_mapping")
}
```

**Indexes**:

- Primary key on `id`
- Unique constraint on `(entity_type, teamwork_id)` - prevent duplicates
- Index on `(entity_type, burnkit_id)` for reverse lookups

**Notes**:

- Maps Teamwork IDs to BurnKit IDs
- Enables bidirectional lookups
- Used for sync deduplication

### 7. Modified Table: TimeEntry

**Add Fields**:

```prisma
model TimeEntry {
  // ... existing fields ...

  teamworkId      String?     @map("teamwork_id") @unique
  sourceType      SourceType  @default(manual) @map("source_type")

  // ... existing relations ...

  @@index([teamworkId])
  @@index([sourceType])
}
```

**New Indexes**:

- Unique constraint on `teamwork_id` (nullable)
- Index on `teamwork_id` for lookups
- Index on `source_type` for filtering

**Notes**:

- `teamworkId` is nullable (Excel entries won't have it)
- `sourceType` defaults to `manual` for backward compatibility
- Enables filtering by data source

### 8. Modified Table: User

**Add Relations**:

```prisma
model User {
  // ... existing fields ...

  teamworkConfig  TeamworkConfig?
  teamworkSyncLogs TeamworkSyncLog[]

  // ... existing relations ...
}
```

**Notes**:

- One-to-one relation with `TeamworkConfig`
- One-to-many relation with `TeamworkSyncLog`

## Migration Scripts

### Migration 1: Add Enums

**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_teamwork_enums/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('pending', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('person', 'client', 'project', 'time_entry');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('manual', 'teamwork');
```

### Migration 2: Create teamwork_config Table

**File**: `prisma/migrations/YYYYMMDDHHMMSS_create_teamwork_config/migration.sql`

```sql
-- CreateTable
CREATE TABLE "teamwork_config" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "installation_url" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teamwork_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teamwork_config_user_id_key" ON "teamwork_config"("user_id");

-- AddForeignKey
ALTER TABLE "teamwork_config" ADD CONSTRAINT "teamwork_config_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Migration 3: Create teamwork_sync_log Table

**File**: `prisma/migrations/YYYYMMDDHHMMSS_create_teamwork_sync_log/migration.sql`

```sql
-- CreateTable
CREATE TABLE "teamwork_sync_log" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "date_range_start" DATE NOT NULL,
    "date_range_end" DATE NOT NULL,
    "entries_processed" INTEGER NOT NULL DEFAULT 0,
    "entries_created" INTEGER NOT NULL DEFAULT 0,
    "entries_updated" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,

    CONSTRAINT "teamwork_sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teamwork_sync_log_user_id_started_at_idx" ON "teamwork_sync_log"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "teamwork_sync_log_status_idx" ON "teamwork_sync_log"("status");

-- AddForeignKey
ALTER TABLE "teamwork_sync_log" ADD CONSTRAINT "teamwork_sync_log_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Migration 4: Create teamwork_entity_mapping Table

**File**: `prisma/migrations/YYYYMMDDHHMMSS_create_teamwork_entity_mapping/migration.sql`

```sql
-- CreateTable
CREATE TABLE "teamwork_entity_mapping" (
    "id" SERIAL NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "teamwork_id" TEXT NOT NULL,
    "burnkit_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teamwork_entity_mapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "teamwork_entity_mapping_entity_type_teamwork_id_key"
    ON "teamwork_entity_mapping"("entity_type", "teamwork_id");

-- CreateIndex
CREATE INDEX "teamwork_entity_mapping_entity_type_burnkit_id_idx"
    ON "teamwork_entity_mapping"("entity_type", "burnkit_id");
```

### Migration 5: Update TimeEntry Table

**File**: `prisma/migrations/YYYYMMDDHHMMSS_update_time_entry_for_teamwork/migration.sql`

```sql
-- AlterTable
ALTER TABLE "fact_time_entries"
    ADD COLUMN "teamwork_id" TEXT,
    ADD COLUMN "source_type" "SourceType" NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE UNIQUE INDEX "fact_time_entries_teamwork_id_key" ON "fact_time_entries"("teamwork_id");

-- CreateIndex
CREATE INDEX "fact_time_entries_teamwork_id_idx" ON "fact_time_entries"("teamwork_id");

-- CreateIndex
CREATE INDEX "fact_time_entries_source_type_idx" ON "fact_time_entries"("source_type");
```

## Migration Execution Plan

### Pre-Migration Checklist

- [ ] Backup production database
- [ ] Test migrations on staging environment
- [ ] Verify Prisma schema is up to date
- [ ] Review migration SQL for correctness
- [ ] Notify users of maintenance window (if needed)
- [ ] Prepare rollback scripts

### Execution Steps

1. **Generate Migrations**

   ```bash
   npx prisma migrate dev --name add_teamwork_integration
   ```

2. **Review Generated SQL**

   - Check all migration files in `prisma/migrations/`
   - Verify indexes and constraints
   - Confirm foreign key relationships

3. **Test on Staging**

   ```bash
   # Apply to staging database
   DATABASE_URL="<staging-url>" npx prisma migrate deploy

   # Verify schema
   DATABASE_URL="<staging-url>" npx prisma db pull

   # Run application tests
   npm test
   ```

4. **Deploy to Production**

   ```bash
   # Apply migrations
   npx prisma migrate deploy

   # Verify deployment
   npx prisma migrate status

   # Generate Prisma client
   npx prisma generate
   ```

5. **Post-Migration Verification**
   - Check all tables exist
   - Verify indexes are created
   - Test foreign key constraints
   - Confirm application starts successfully

### Rollback Procedures

#### Rollback Migration 5 (TimeEntry Updates)

```sql
-- Remove indexes
DROP INDEX IF EXISTS "fact_time_entries_source_type_idx";
DROP INDEX IF EXISTS "fact_time_entries_teamwork_id_idx";
DROP INDEX IF EXISTS "fact_time_entries_teamwork_id_key";

-- Remove columns
ALTER TABLE "fact_time_entries" DROP COLUMN IF EXISTS "source_type";
ALTER TABLE "fact_time_entries" DROP COLUMN IF EXISTS "teamwork_id";
```

#### Rollback Migration 4 (Entity Mapping)

```sql
DROP TABLE IF EXISTS "teamwork_entity_mapping";
```

#### Rollback Migration 3 (Sync Log)

```sql
DROP TABLE IF EXISTS "teamwork_sync_log";
```

#### Rollback Migration 2 (Config)

```sql
DROP TABLE IF EXISTS "teamwork_config";
```

#### Rollback Migration 1 (Enums)

```sql
DROP TYPE IF EXISTS "SourceType";
DROP TYPE IF EXISTS "EntityType";
DROP TYPE IF EXISTS "SyncStatus";
```

#### Complete Rollback Script

```sql
-- Drop tables in reverse order
DROP TABLE IF EXISTS "teamwork_entity_mapping";
DROP TABLE IF EXISTS "teamwork_sync_log";
DROP TABLE IF EXISTS "teamwork_config";

-- Remove columns from fact_time_entries
ALTER TABLE "fact_time_entries" DROP COLUMN IF EXISTS "source_type";
ALTER TABLE "fact_time_entries" DROP COLUMN IF EXISTS "teamwork_id";

-- Drop enums
DROP TYPE IF EXISTS "SourceType";
DROP TYPE IF EXISTS "EntityType";
DROP TYPE IF EXISTS "SyncStatus";
```

## Data Migration

### No Data Migration Required

Since this is a new feature:

- No existing data needs to be migrated
- All new fields have sensible defaults
- Existing time entries will have `source_type = 'manual'`
- No data loss risk

### Future Data Considerations

If switching from Excel to Teamwork:

1. Historical Excel data remains unchanged
2. New Teamwork syncs create new entries
3. Both sources can coexist
4. Filter by `source_type` to distinguish

## Testing Strategy

### Unit Tests

```typescript
// Test enum values
describe("Enums", () => {
  it("should have correct SyncStatus values", () => {
    expect(SyncStatus.pending).toBeDefined();
    expect(SyncStatus.running).toBeDefined();
    expect(SyncStatus.completed).toBeDefined();
    expect(SyncStatus.failed).toBeDefined();
  });
});

// Test model creation
describe("TeamworkConfig", () => {
  it("should create config with encrypted key", async () => {
    const config = await prisma.teamworkConfig.create({
      data: {
        userId: "test-user",
        installationUrl: "test.teamwork.com",
        apiKey: encryptApiKey("test-key"),
        isActive: true,
      },
    });
    expect(config.id).toBeDefined();
  });
});
```

### Integration Tests

```typescript
describe("Teamwork Integration", () => {
  it("should create sync log and track progress", async () => {
    const log = await prisma.teamworkSyncLog.create({
      data: {
        userId: "test-user",
        status: SyncStatus.running,
        dateRangeStart: new Date("2024-01-01"),
        dateRangeEnd: new Date("2024-01-31"),
      },
    });

    // Update progress
    await prisma.teamworkSyncLog.update({
      where: { id: log.id },
      data: {
        entriesProcessed: 100,
        status: SyncStatus.completed,
        completedAt: new Date(),
      },
    });

    const updated = await prisma.teamworkSyncLog.findUnique({
      where: { id: log.id },
    });

    expect(updated.status).toBe(SyncStatus.completed);
    expect(updated.entriesProcessed).toBe(100);
  });
});
```

### Performance Tests

```typescript
describe("Performance", () => {
  it("should handle large entity mapping inserts", async () => {
    const mappings = Array.from({ length: 1000 }, (_, i) => ({
      entityType: EntityType.time_entry,
      teamworkId: `tw-${i}`,
      burnkitId: i,
    }));

    const start = Date.now();
    await prisma.teamworkEntityMapping.createMany({
      data: mappings,
    });
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // Should complete in < 5s
  });
});
```

## Monitoring and Maintenance

### Database Metrics to Monitor

1. **Table Sizes**

   ```sql
   SELECT
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE tablename IN ('teamwork_config', 'teamwork_sync_log', 'teamwork_entity_mapping')
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

2. **Index Usage**

   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes
   WHERE tablename LIKE 'teamwork%'
   ORDER BY idx_scan DESC;
   ```

3. **Sync Log Growth**
   ```sql
   SELECT
     DATE(started_at) as date,
     COUNT(*) as sync_count,
     AVG(entries_processed) as avg_entries,
     COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count
   FROM teamwork_sync_log
   GROUP BY DATE(started_at)
   ORDER BY date DESC
   LIMIT 30;
   ```

### Maintenance Tasks

#### Weekly

- Review sync log for failures
- Check entity mapping growth
- Monitor table sizes

#### Monthly

- Archive old sync logs (> 90 days)
- Vacuum and analyze tables
- Review index usage

#### Quarterly

- Performance review
- Schema optimization review
- Capacity planning

### Cleanup Queries

#### Archive Old Sync Logs

```sql
-- Archive logs older than 90 days
DELETE FROM teamwork_sync_log
WHERE started_at < NOW() - INTERVAL '90 days'
  AND status IN ('completed', 'failed');
```

#### Remove Orphaned Mappings

```sql
-- Find mappings for deleted time entries
DELETE FROM teamwork_entity_mapping
WHERE entity_type = 'time_entry'
  AND burnkit_id NOT IN (SELECT id FROM fact_time_entries);
```

## Risk Assessment

### Migration Risks

| Risk                    | Impact | Likelihood | Mitigation                           |
| ----------------------- | ------ | ---------- | ------------------------------------ |
| Migration failure       | High   | Low        | Test on staging, have rollback ready |
| Performance degradation | Medium | Low        | Add indexes, monitor queries         |
| Data inconsistency      | High   | Very Low   | Use transactions, validate data      |
| Downtime                | Medium | Low        | Run during maintenance window        |

### Operational Risks

| Risk               | Impact | Likelihood | Mitigation                  |
| ------------------ | ------ | ---------- | --------------------------- |
| Table growth       | Medium | Medium     | Implement archival strategy |
| Index bloat        | Low    | Medium     | Regular vacuum and reindex  |
| Foreign key issues | High   | Low        | Cascade deletes configured  |
| Query performance  | Medium | Low        | Monitor and optimize        |

## Success Criteria

- [ ] All migrations execute without errors
- [ ] All indexes created successfully
- [ ] Foreign key constraints working
- [ ] Application starts and connects to database
- [ ] Existing functionality unaffected
- [ ] New tables accessible via Prisma
- [ ] Performance benchmarks met
- [ ] Rollback tested and documented

## Timeline

### Development Environment

- **Duration**: 1 day
- **Tasks**: Generate migrations, test locally

### Staging Environment

- **Duration**: 2-3 days
- **Tasks**: Deploy, test, validate

### Production Environment

- **Duration**: 1 day
- **Tasks**: Deploy during maintenance window, monitor

**Total Estimated Time**: 4-5 days

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-27  
**Status**: Ready for Review
