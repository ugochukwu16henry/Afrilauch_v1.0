# Backend build

## Normal build

```bash
pnpm run build
```

Runs: clear Prisma client (to reduce Windows lock issues) → `prisma generate` → `tsc`.

## Windows EPERM on `prisma generate`

If you see:

```text
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

something on your machine is locking the Prisma engine file (Node, IDE, antivirus, or OneDrive).

**Try in order:**

1. **Close all backend processes**
   Stop any terminal where you ran `pnpm run dev` or `tsx watch`. Close Cursor/VS Code if it's using the backend folder.

2. **Fresh terminal**
   Open a new terminal, `cd backend`, then run `pnpm run build` again.

3. **Only compile TypeScript**
   If the Prisma client was already generated before, you can skip generate and just compile:
   ```bash
   pnpm run build:tsc
   ```

4. **Clean reinstall**
   From the `backend` folder:
   ```powershell
   Remove-Item -Recurse -Force node_modules\.pnpm\@prisma*
   pnpm install
   pnpm run build
   ```

5. **Run as Administrator**
   Open PowerShell or CMD as Administrator, `cd` to the repo's `backend` folder, then run `pnpm run build`.

CI (e.g. GitHub Actions, Railway) uses a clean environment and normally does not hit this.

## Railway: P3009 failed migration

If the deploy fails with:

```text
Error: P3009
migrate found failed migrations in the target database
The migration `20250203180200_revenue_system_versions` (or another migration) failed
```

This error indicates that a Prisma migration failed midway, leaving your database in a "dirty" state. Prisma blocks all new migrations until this specific failed entry is resolved in the `_prisma_migrations` table.

### Step 1: Identify the State of Your Database

Before running a fix, determine if the changes from the failed migration (e.g., new tables or columns) were actually created in your PostgreSQL database.

**Option A: Check via Railway Dashboard**
1. Go to your Railway project → Database service
2. Click "Query" tab or connect via `psql`
3. Run: `\d revenue_system_versions` (or check for the table/column the migration creates)

**Option B: Check via Railway CLI**
```bash
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

**Decision:**
- **If changes were NOT applied** (table/columns don't exist): Use `--rolled-back` command
- **If changes WERE partially or fully applied** (table/columns exist): Use `--applied` command

### Step 2: Run the Resolve Command

Choose the appropriate command based on your investigation above.

#### Scenario 1: Migration Failed, Changes NOT Applied

If the database objects don't exist (migration rolled back):

```bash
cd backend

# For revenue_system_versions migration (most common case)
railway run pnpm run db:migrate:resolve-rollback-revenue

# For the older security tables migration
railway run pnpm run db:migrate:resolve-rollback
```

**What this does:** Marks the migration as "rolled back" in `_prisma_migrations`, allowing Prisma to retry it on next deploy.

#### Scenario 2: Migration Failed, Changes WERE Applied

If the database objects exist (migration partially succeeded but marked as failed):

```bash
cd backend

# For revenue_system_versions migration
railway run pnpm run db:migrate:resolve-applied-revenue
```

**What this does:** Marks the migration as "applied" in `_prisma_migrations`, telling Prisma the changes are already in place.

### Step 3: Redeploy

After resolving the migration state:

```bash
# Push your code to trigger Railway deployment
git push origin main

# OR use Railway CLI
railway up
```

The migration has been made idempotent (using `IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION`), so it's safe to run again even if it partially applied before.

### Step 4: Verify

After deployment completes, verify the migration succeeded:

```bash
# Check migration status
railway run npx prisma migrate status

# Verify the table exists
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

### Additional Notes

- All migrations in this project are idempotent, meaning they can be safely retried
- The `revenue_system_versions` table stores version history for the Revenue System control panel
- If you encounter P3009 errors repeatedly, check the Railway logs for the specific SQL error that's causing the migration to fail
