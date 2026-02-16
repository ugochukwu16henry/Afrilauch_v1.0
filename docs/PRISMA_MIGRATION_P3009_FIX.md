# Prisma P3009 Migration Error - Quick Fix Guide

## What is P3009?

Error P3009 occurs when a Prisma migration fails midway during deployment, leaving the database in a "dirty" state. The migration is marked as failed in the `_prisma_migrations` table, and Prisma blocks all subsequent migrations until this is resolved.

## Quick Decision Tree

```
Is the migration failing? (P3009 error)
    ↓
    YES
    ↓
Check: Do the database objects exist?
    ├─ NO (table/columns don't exist)
    │   └─ Use --rolled-back command
    │      └─ railway run pnpm run db:migrate:resolve-rollback-revenue
    │
    └─ YES (table/columns exist)
        └─ Use --applied command
           └─ railway run pnpm run db:migrate:resolve-applied-revenue
```

## Step-by-Step Resolution

### Step 1: Check Database State

Run this command to check if the migration's changes exist:

```bash
cd backend
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

**Result interpretation:**
- **Table exists** → Changes WERE applied → Go to Step 2A
- **Table doesn't exist** → Changes were NOT applied → Go to Step 2B

### Step 2A: If Changes WERE Applied

```bash
cd backend
railway run pnpm run db:migrate:resolve-applied-revenue
```

This tells Prisma: "The migration already ran successfully, just mark it as complete."

### Step 2B: If Changes Were NOT Applied

```bash
cd backend
railway run pnpm run db:migrate:resolve-rollback-revenue
```

This tells Prisma: "The migration didn't complete, mark it as rolled back so it can retry."

### Step 3: Redeploy

```bash
git push origin main
```

Or use Railway CLI:

```bash
railway up
```

### Step 4: Verify

```bash
# Check migration status
railway run npx prisma migrate status

# Verify table exists
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

## Available NPM Scripts

The `backend/package.json` includes these helper scripts:

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `db:migrate:resolve-rollback-revenue` | Mark revenue_system_versions as rolled back | When table doesn't exist |
| `db:migrate:resolve-applied-revenue` | Mark revenue_system_versions as applied | When table exists |
| `db:migrate:resolve-rollback` | Mark security_tables migration as rolled back | For older migration |

## Common Scenarios

### Scenario 1: Database Timeout During Migration

**Symptoms:** Migration starts but fails with timeout error. Table partially created.

**Solution:**
1. Check if table exists: `railway run psql $DATABASE_URL -c "\d revenue_system_versions"`
2. If exists: `railway run pnpm run db:migrate:resolve-applied-revenue`
3. If doesn't exist: `railway run pnpm run db:migrate:resolve-rollback-revenue`
4. Redeploy

### Scenario 2: Permission Error

**Symptoms:** Migration fails due to insufficient database permissions.

**Solution:**
1. Fix database permissions first
2. Check if migration applied any changes
3. Use appropriate resolve command
4. Redeploy

### Scenario 3: Network Interruption

**Symptoms:** Deployment interrupted, migration state unknown.

**Solution:**
1. Check database state: `railway run psql $DATABASE_URL -c "\d revenue_system_versions"`
2. Based on result, use `--applied` or `--rolled-back`
3. Redeploy

## Why Migrations Are Now Safe to Retry

All migrations in this project use idempotent patterns:

```sql
-- Tables
CREATE TABLE IF NOT EXISTS "table_name" (...);

-- Indexes
CREATE INDEX IF NOT EXISTS "index_name" ON "table_name"("column");

-- Foreign Keys
DO $$ BEGIN
    ALTER TABLE "table" ADD CONSTRAINT "constraint_name" ...;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- RLS Policies
DO $$ BEGIN
    CREATE POLICY "policy_name" ON public.table_name FOR ALL USING (false);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
```

This means:
- Safe to run multiple times
- Won't fail if objects already exist
- Won't create duplicates
- Won't fail on retry after partial completion

## Troubleshooting

### "Command not found: railway"

Install Railway CLI:

```bash
npm install -g @railway/cli
```

Then link to your project:

```bash
railway login
railway link
```

### "Cannot connect to database"

Ensure you're linked to the correct Railway project and service:

```bash
railway status
```

If needed, re-link:

```bash
railway link
```

### "psql: command not found"

On Railway, `psql` is available via `railway run`. If you need it locally, install PostgreSQL client tools.

### Migration Keeps Failing

1. Check Railway logs for the specific error
2. Ensure database has sufficient resources (RAM, connections)
3. Check for conflicting database objects
4. Verify database permissions

## Additional Resources

- **Detailed Guide:** See `backend/BUILD.md` section "Railway: P3009 failed migration"
- **Technical Details:** See `backend/prisma/migrations/MIGRATION_RECOVERY.md`
- **Full Deployment Guide:** See `docs/RAILWAY_DEPLOY.md` section 11

## Support

If you continue to experience issues:

1. Check Railway deployment logs for the exact error
2. Verify database state manually
3. Review recent database changes
4. Contact Railway support if database issues persist
