# Create Tables on Railway Postgres (when "no tables" in DB)

If you connect to your Railway Postgres (e.g. with TablePlus, DBeaver, or `psql`) and see **no tables**, the schema hasn’t been applied yet. Do this once from your machine.

## 1. Get the public database URL

- In **Railway** → your **PostgreSQL** service → **Variables** or **Connect**.
- Copy **`DATABASE_PUBLIC_URL`** (host like `*.proxy.rlwy.net`).  
  It looks like:  
  `postgresql://postgres:YOUR_PASSWORD@HOST:PORT/railway`

(Use your real password; the one in your message is an example.)

## 2. Apply schema and seed from your PC

Open a terminal in the **backend** folder and set `DATABASE_URL` to that public URL, then run:

```powershell
cd c:\Users\Dell\Documents\riseflowhub_v1.0\backend

# Option A: Use migrations (recommended if you use Prisma migrations)
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway"
pnpm run build:deploy
pnpm run db:seed

# Option B: Push schema without migration history (if migrate deploy fails)
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway"
pnpm run db:push
pnpm run db:seed
```

Replace `YOUR_PASSWORD`, `YOUR_HOST`, `PORT` with the values from `DATABASE_PUBLIC_URL`.

## 3. Check

Connect again to the same database; you should see all tables (e.g. `Tenant`, `User`, `Project`, …) and seed data.

---

**Why this happens:** The backend on Railway only creates tables when it runs **migrations** (e.g. during `build:deploy`). If the backend was deployed before the DB was linked, or the build doesn’t run `prisma migrate deploy`, the database stays empty until you run the steps above once.
