# Database Migrations

This directory contains Prisma migrations for the Teamwork Time Log application.

## Initial Setup (0_init)

The `0_init` migration represents the initial database schema. This was created as a baseline migration for an existing database.

### For Existing Production Databases

If you're deploying to a database that already has the schema (from `prisma db push`), you need to mark the initial migration as applied:

```bash
# Option 1: Use the baseline script
npm run baseline

# Option 2: Manual command
npx prisma migrate resolve --applied "0_init"
```

This tells Prisma that the database already has the schema from `0_init`, so it won't try to reapply it.

### For New Databases

For fresh databases, just run:

```bash
npx prisma migrate deploy
```

This will apply all migrations including `0_init`.

## Production Deployment

The application uses `npm start` which runs `prisma generate && next start`.

- `prisma generate` - Generates the Prisma Client (required)
- `next start` - Starts the Next.js application

For deployments that need migrations, use:

```bash
npm run start:migrate
```

This runs `prisma migrate deploy && next start`.

## Development

For local development, use:

```bash
# Apply changes to schema and create migration
npm run db:migrate

# Or push schema changes without migration
npm run db:push
```

## Migration History

- **0_init** (2025-12-21): Initial database schema with Users, Projects, TimeLogs, Companies, and Export models
