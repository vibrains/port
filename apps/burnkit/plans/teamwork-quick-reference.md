# Teamwork Integration - Quick Reference Guide

## Overview

BurnKit will integrate with Teamwork.com to automatically sync time tracking data, replacing manual Excel uploads with automated data synchronization.

## Key Components

### 1. API Client

**Location**: [`src/lib/teamwork/client.ts`](../src/lib/teamwork/client.ts)

**Purpose**: Handle all communication with Teamwork API

**Key Methods**:

- `getTimeEntries(params)` - Fetch time entries
- `getProjects()` - Fetch projects
- `getPeople()` - Fetch users
- `getCompanies()` - Fetch client companies

### 2. Data Mapper

**Location**: [`src/lib/teamwork/mapper.ts`](../src/lib/teamwork/mapper.ts)

**Purpose**: Transform Teamwork data to BurnKit schema

**Mappings**:

```
Teamwork User     → BurnKit Person
Teamwork Company  → BurnKit Client
Teamwork Project  → BurnKit Job
Teamwork TimeEntry → BurnKit TimeEntry
```

### 3. Sync Service

**Location**: [`src/lib/teamwork/sync.ts`](../src/lib/teamwork/sync.ts)

**Purpose**: Orchestrate data synchronization

**Sync Modes**:

- **Full Sync**: Pull all data for date range
- **Incremental Sync**: Pull only changes since last sync
- **Manual Sync**: User-triggered ad-hoc sync

### 4. Configuration UI

**Location**: [`src/app/(dashboard)/settings/teamwork/page.tsx`](<../src/app/(dashboard)/settings/teamwork/page.tsx>)

**Features**:

- API credentials setup
- Connection testing
- Sync scheduling
- Sync history

## Database Changes

### New Tables

#### teamwork_config

Stores API configuration per user

```sql
- id (PK)
- user_id (FK → users)
- installation_url
- api_key (encrypted)
- is_active
- last_sync_at
```

#### teamwork_sync_log

Tracks sync operations

```sql
- id (PK)
- user_id (FK → users)
- status (pending/running/completed/failed)
- started_at
- completed_at
- date_range_start
- date_range_end
- entries_processed
- entries_created
- entries_updated
- error_message
```

#### teamwork_entity_mapping

Maps Teamwork IDs to BurnKit IDs

```sql
- id (PK)
- entity_type (person/client/project/time_entry)
- teamwork_id
- burnkit_id
```

### Updated Tables

#### fact_time_entries

Add tracking fields:

```sql
- teamwork_id (unique, nullable)
- source_type (manual/teamwork)
```

## Data Categorization Logic

Time entries are categorized based on Teamwork billing flags:

```typescript
if (project.isInternal) {
  category = "internal";
} else if (timeEntry.isBillable) {
  category = "billable";
} else {
  category = "gap"; // Non-billable on billable project
}
```

## API Endpoints Used

### Teamwork API Base URL

```
https://{installation}.teamwork.com/
```

### Key Endpoints

| Endpoint                 | Purpose            | Pagination     |
| ------------------------ | ------------------ | -------------- |
| `GET /time_entries.json` | Fetch time entries | Yes (500/page) |
| `GET /projects.json`     | Fetch projects     | Yes            |
| `GET /people.json`       | Fetch users        | Yes            |
| `GET /companies.json`    | Fetch companies    | Yes            |

### Authentication

```http
Authorization: Bearer {api_key}
Content-Type: application/json
```

## Sync Process Flow

```
1. Validate API credentials
2. Create sync log entry (status: pending)
3. Fetch & upsert companies → clients
4. Fetch & upsert projects → jobs
5. Fetch & upsert people → persons
6. Fetch time entries (paginated)
   For each batch:
   - Map to BurnKit schema
   - Categorize entries
   - Upsert time entries
   - Update entity mappings
7. Update sync log (status: completed)
8. Revalidate dashboard cache
```

## Configuration Steps

### 1. Get Teamwork API Key

1. Log into Teamwork
2. Go to Settings → API & Mobile Apps
3. Generate new API key
4. Copy installation URL (e.g., `yourcompany.teamwork.com`)

### 2. Configure in BurnKit

1. Navigate to Settings → Teamwork
2. Enter installation URL
3. Enter API key
4. Click "Test Connection"
5. Enable sync

### 3. Initial Sync

1. Go to Upload → Teamwork Sync tab
2. Select date range
3. Choose "Full Sync"
4. Click "Start Sync"
5. Monitor progress

## Environment Variables

Add to `.env`:

```env
# Teamwork Integration
TEAMWORK_ENCRYPTION_KEY=<generate-32-byte-hex>
TEAMWORK_SYNC_INTERVAL=3600
TEAMWORK_BATCH_SIZE=500
TEAMWORK_MAX_RETRIES=3
TEAMWORK_TIMEOUT=30000
```

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Security Notes

### API Key Storage

- Keys are encrypted at rest using AES-256
- Encryption key stored in environment variable
- Keys only decrypted when making API calls
- User-specific keys (not shared)

### Access Control

- Only authenticated users can configure
- Users can only see their own sync logs
- Admin users can view all configurations

## Error Handling

### Common Errors

| Error                 | Cause                    | Solution                        |
| --------------------- | ------------------------ | ------------------------------- |
| 401 Unauthorized      | Invalid API key          | Verify key in Teamwork settings |
| 429 Too Many Requests | Rate limit hit           | Wait and retry (automatic)      |
| 404 Not Found         | Invalid installation URL | Check URL format                |
| 500 Server Error      | Teamwork API issue       | Retry later                     |

### Retry Logic

- Automatic retry with exponential backoff
- Max 3 attempts per request
- Respects rate limit headers
- Logs all retry attempts

## Performance Considerations

### Batch Processing

- Time entries processed in batches of 500
- Uses Prisma `createMany` for efficiency
- Progress tracking for large syncs
- Cancellable long-running operations

### Caching

- Entity mappings cached in memory
- API responses cached for 5 minutes
- Cache invalidated on sync completion

### Database Optimization

- Indexes on `teamwork_id` fields
- Transactions for consistency
- Connection pooling enabled

## Monitoring

### Key Metrics

- Sync duration
- Entries processed per sync
- API call count and latency
- Error rate
- Data freshness

### Logging

- All API calls logged with timing
- Sync operations logged with metrics
- Errors logged with full context
- Structured JSON logging

## Troubleshooting

### Sync Fails

1. Check API credentials in settings
2. Verify Teamwork API status
3. Review sync log for error details
4. Check rate limit status
5. Retry sync

### Missing Data

1. Verify date range in sync
2. Check Teamwork project status (archived?)
3. Review entity mappings
4. Check categorization logic
5. Compare with Teamwork reports

### Performance Issues

1. Reduce date range for sync
2. Check database query performance
3. Review API call count
4. Monitor rate limit usage
5. Consider incremental sync

## Migration Path

### Phase 1: Setup (Week 1)

- Configure Teamwork credentials
- Test connection
- Run initial full sync
- Validate data accuracy

### Phase 2: Validation (Week 2)

- Compare with Excel data
- Verify categorization
- Check person/client mappings
- Adjust configuration as needed

### Phase 3: Transition (Week 3-4)

- Run parallel syncs (Excel + Teamwork)
- Monitor for discrepancies
- Train users on new system
- Document any issues

### Phase 4: Production (Week 5+)

- Switch to Teamwork as primary source
- Keep Excel as backup option
- Monitor sync health
- Gather user feedback

## Support Resources

### Documentation

- [Teamwork API Docs](https://apidocs.teamwork.com/)
- [BurnKit Integration Guide](./teamwork-integration-plan.md)
- [Troubleshooting Guide](#troubleshooting)

### Contact

- Technical Issues: Check sync logs
- API Questions: Teamwork support
- Feature Requests: BurnKit team

---

**Last Updated**: 2026-01-27  
**Version**: 1.0
