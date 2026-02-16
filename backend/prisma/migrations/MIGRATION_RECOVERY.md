# Migration Recovery Guide

## Issue: Failed Migration `20250203180200_revenue_system_versions`

### Problem
The migration `20250203180200_revenue_system_versions` was failing in production with error P3009, indicating that Prisma found failed migrations in the target database and refused to apply new migrations.

### Root Cause
The original migration was not idempotent. It tried to:
1. Create a table without checking if it already exists
2. Create an index without checking if it already exists  
3. Add a foreign key constraint without checking if it already exists

When the migration failed partway through (possibly due to a transient error or timeout), subsequent attempts to run it would fail because some objects already existed.

### Solution
The migration has been updated to be idempotent by:

1. **CREATE TABLE IF NOT EXISTS** - Only creates the table if it doesn't exist
2. **DO $$ BEGIN ... EXCEPTION WHEN duplicate_object** - Wraps index and foreign key creation in exception handling
3. **Added RLS policies** - Following the pattern from migrations `20250203180000` and `20250203180100`

### How to Apply in Production

If the migration is still showing as failed in your production database, you have two options:

#### Option 1: Mark as Resolved (if objects already exist)
If the table and its objects were successfully created but the migration was marked as failed:

**For Railway:**
```bash
cd backend
railway run pnpm run db:migrate:resolve-applied-revenue
```

**For other environments:**
```bash
# Connect to production database
export DATABASE_URL="your_production_database_url"

# Mark the migration as resolved
npx prisma migrate resolve --applied "20250203180200_revenue_system_versions"
```

#### Option 2: Mark as Rolled Back (if objects do NOT exist)
If the migration failed before creating any objects:

**For Railway:**
```bash
cd backend
railway run pnpm run db:migrate:resolve-rollback-revenue
```

**For other environments:**
```bash
# Connect to production database
export DATABASE_URL="your_production_database_url"

# Mark the migration as rolled back
npx prisma migrate resolve --rolled-back "20250203180200_revenue_system_versions"
```

#### Option 3: Let it retry (recommended with the fix)
With the idempotent migration in place, simply deploy again:

```bash
npm run start:deploy
```

The migration will now skip any objects that already exist and only create what's missing.

### Prevention
All future migrations should follow the idempotent pattern:

```sql
-- For tables
CREATE TABLE IF NOT EXISTS "table_name" (...);

-- For indexes
CREATE INDEX IF NOT EXISTS "index_name" ON "table_name"("column");

-- For foreign keys
DO $$ BEGIN
    ALTER TABLE "table" ADD CONSTRAINT "constraint_name" ...;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- For RLS
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "policy_name" ON public.table_name FOR ALL USING (false);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
```

### Verification
After applying the fix, verify the migration succeeded:

**For Railway:**
```bash
# Check migration status
railway run npx prisma migrate status

# Verify table exists
railway run psql $DATABASE_URL -c "\d revenue_system_versions"

# Verify RLS is enabled
railway run psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revenue_system_versions';"
```

**For other environments:**
```bash
# Check migration status
npx prisma migrate status

# Verify table exists
psql $DATABASE_URL -c "\d revenue_system_versions"

# Verify RLS is enabled
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'revenue_system_versions';"
```

## Additional Notes

- The `revenue_system_versions` table is used for version history in the Revenue System control panel
- It stores draft and published versions with full payload as JSON
- Row Level Security (RLS) is enabled to prevent direct API access via PostgREST/Supabase
- Backend access using service role with BYPASSRLS is unaffected
