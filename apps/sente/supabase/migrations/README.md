# Database Migrations

This directory contains PostgreSQL migration files for the Sente Marketing Performance Dashboard.

## Migration Files

| File | Description |
|------|-------------|
| `001_initial_schema.sql` | Creates all database tables with foreign keys and constraints |
| `002_indexes.sql` | Creates performance indexes for common query patterns |
| `003_seed_client.sql` | Seeds initial Sente client data |

## Naming Conventions

Migration files follow the pattern: `###_descriptive_name.sql`

- Use three-digit sequence numbers (001, 002, 003, etc.)
- Use lowercase with underscores for descriptions
- Keep descriptions concise but clear

## Running Migrations

### Using psql

```bash
# Set your database connection string (Sevalla provides this for connected databases)
export DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Run a single migration file
psql $DATABASE_URL -f supabase/migrations/001_initial_schema.sql

# Run all migration files in order
for f in supabase/migrations/*.sql; do
  echo "Running $f..."
  psql $DATABASE_URL -f "$f"
done
```

## Creating New Migrations

1. Determine the next sequence number (e.g., if last is 003, use 004)
2. Create a new file: `004_your_migration_name.sql`
3. Write your SQL with comments explaining the changes
4. Test locally before pushing to production

### Migration Template

```sql
-- Migration: ###_migration_name.sql
-- Description: Brief description of what this migration does
-- Created: YYYY-MM-DD

-- Your SQL here
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ... columns
);

-- Add comments
COMMENT ON TABLE new_table IS 'Description of the table';
```

## Best Practices

1. **Idempotency**: Use `IF NOT EXISTS` for CREATE statements and `IF EXISTS` for DROP statements
2. **Transactions**: Each migration runs in its own implicit transaction
3. **Foreign Keys**: Always include `ON DELETE` behavior (CASCADE, SET NULL, or RESTRICT)
4. **Comments**: Add `COMMENT ON` statements for tables and important columns
5. **Indexes**: Create indexes for frequently queried columns
6. **Test Locally**: Always test migrations on a local database first

## Rollback Strategy

PostgreSQL doesn't support true rollback of migrations. To undo changes:

1. Create a new migration that reverses the changes
2. Or restore from a backup

Example rollback migration:

```sql
-- Migration: 005_undo_previous_change.sql
-- Reverses changes made in migration 004

DROP TABLE IF EXISTS table_created_in_004;
DROP INDEX IF EXISTS idx_created_in_004;
```

## Schema Overview

### Core Tables

- **clients**: Multi-tenant client organizations
- **users**: Application users with role-based access
- **data_uploads**: Tracks all CSV/data imports

### Marketing Data Tables

- **klaviyo_flows**: Klaviyo email/SMS flow performance
- **email_campaigns**: Email campaigns from Klaviyo and Pardot
- **pardot_flows**: Pardot automation program metrics
- **ga4_pages**: Google Analytics 4 page performance
- **ga4_acquisition**: GA4 user acquisition data
- **social_posts**: Social media post performance

## Troubleshooting

### Migration fails with "relation already exists"

The migration isn't idempotent. Add `IF NOT EXISTS`:

```sql
-- Bad
CREATE TABLE my_table (...);

-- Good
CREATE TABLE IF NOT EXISTS my_table (...);
```

### Foreign key constraint errors

Ensure referenced tables are created first. Check the order in `001_initial_schema.sql`:

1. clients (no dependencies)
2. data_uploads (depends on clients)
3. All marketing tables (depend on clients and data_uploads)
4. users (no dependencies)

### Index already exists

Add `IF NOT EXISTS`:

```sql
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
```
