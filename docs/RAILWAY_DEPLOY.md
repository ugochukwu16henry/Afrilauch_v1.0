# Deploy RiseFlow Hub to Railway (Full Stack)

**Current production stack:** Frontend, backend, and storage all run on **Railway** (plus Railway Postgres for the database). No Vercel or Render in production.

This guide walks you through setting up **backend**, **frontend**, **PostgreSQL**, and **Storage Buckets** in a single Railway project.

---

## Step-by-step from “What would you like to create?”

Use this order when you see the Railway create menu (e.g. after **New Project** or **Add**).

### Step 1 — Database (PostgreSQL)

1. Click **Database** in the list.
2. Choose **PostgreSQL** (or the only database option if that’s all you see).
3. Create it. Railway will add a Postgres service and show a **Variables** / **Connect** tab with `DATABASE_URL`.
4. You’ll link this `DATABASE_URL` to your backend later. No need to copy it yet.

---

### Step 2 — Bucket (storage for uploads)

1. Click **Add** (or the **+** that opens the same “What would you like to create?” menu).
2. Click **Bucket**.
3. Pick a **region** and optionally a **name** (e.g. `riseflow-uploads`). Create.
4. Open the new Bucket service → **Credentials** tab. You’ll link these credentials to the backend in a later step.

---

### Step 3 — Backend (first GitHub service)

1. Click **Add** again to open the create menu.
2. Click **GitHub Repository**.
3. **Connect** or **Authorize** GitHub if asked, then **select your RiseFlow Hub repo** (the one with `backend/` and `frontend/`).
4. Railway creates a **new service** from that repo. Configure it as the **backend**:
   - Open this service → **Settings** (or the gear icon).
   - **Root Directory:** set to `backend` (so only the `backend` folder is used).
   - **Build Command:** `pnpm install && pnpm run build` (no migrations at build — Railway gives `DATABASE_URL` only at runtime; see `backend/railway.toml`).
   - **Start Command:** `pnpm run start:deploy` or `pnpm start` (start:deploy runs migrations then starts the server; use it so migrations run when `DATABASE_URL` is available).
   - **Watch Paths:** `backend/**` (so pushes to `frontend/` don’t redeploy the backend).
5. **Variables** for the backend:
   - **New Variable** → **Add Variable Reference** (or **Reference**):
     - Select the **PostgreSQL** service → variable `DATABASE_URL`. That gives the backend the DB connection.
   - Add these as **plain variables** (no reference):
     - `FRONTEND_URL` = you’ll set this after the frontend is deployed (e.g. `https://your-frontend.up.railway.app`). You can put a placeholder now and update later.
     - `JWT_SECRET` = a long random string (at least 32 characters).
   - **Bucket credentials:** Add Variable References from your **Bucket** service: `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `ENDPOINT`, `REGION`. (In the bucket’s Credentials tab you can often “Add to [Backend service]” or add each as a reference in the backend’s Variables.)
6. **Networking:** In this backend service, go to **Settings** → **Networking** (or **Generate Domain**) and click **Generate Domain**. Copy the URL (e.g. `https://riseflow-backend-production-xxxx.up.railway.app`) — this is your **backend URL**.
7. **Redeploy** the backend if you had to change settings, and fix `FRONTEND_URL` once the frontend is live (see Step 4).

---

### Step 4 — Frontend (second GitHub service)

1. Click **Add** again to open the create menu.
2. Click **GitHub Repository**.
3. Select the **same** RiseFlow Hub repo.
4. Railway adds a **second service**. Configure it as the **frontend**:
   - Open this new service → **Settings**.
   - **Root Directory:** set to `frontend`.
   - **Build Command:** `pnpm install && pnpm run build` (or use the repo’s `frontend/railway.toml`).
   - **Start Command:** `pnpm start`.
   - **Watch Paths:** `frontend/**`.
5. **Variables** for the frontend:
   - `NEXT_PUBLIC_API_URL` = your **backend URL** from Step 3 (e.g. `https://riseflow-backend-production-xxxx.up.railway.app`) — **no trailing slash**.
   - `NEXT_PUBLIC_MAIN_SITE` = the URL you’ll get in the next step (or use the same as frontend URL for now).
   - `NEXT_PUBLIC_APP_URL` = same as `NEXT_PUBLIC_MAIN_SITE` if you use one domain.
   - `NEXT_PUBLIC_APP_NAME` = `RiseFlow Hub`.
6. **Networking:** **Generate Domain** for this frontend service. Copy the URL (e.g. `https://riseflow-frontend-production-xxxx.up.railway.app`).
7. **Go back to the backend service** → **Variables** → set `FRONTEND_URL` to this frontend URL (no trailing slash). Save and redeploy the backend so CORS and emails use the correct origin.

---

### Step 5 — Database migrations and seed

- **Migrations:** If your backend build uses `pnpm run build:deploy`, migrations run during build. Otherwise run them once (e.g. Railway **Shell** or **Run** for the backend: `pnpm run build:deploy` or `npx prisma migrate deploy`).
- **Seed (once):** The backend uses `DATABASE_URL` with Railway’s **private** host (`postgres.railway.internal`), which is only reachable from inside Railway. When you run `railway run pnpm run db:seed` **from your PC**, that same private URL is used, so the connection fails. Use the **public** URL instead:
  1. In Railway → open your **PostgreSQL** service → **Variables** (or **Connect**). If you don’t see it, enable **TCP Proxy** under **Settings** → **Networking** for the Postgres service.
  2. Copy the value of **`DATABASE_PUBLIC_URL`** (the one that uses a public host like `*.proxy.rlwy.net`, not `postgres.railway.internal`).
  3. From your machine, in the backend folder, run the seed with that URL:
     ```bash
     cd backend
     set DATABASE_URL=<paste DATABASE_PUBLIC_URL here>
     pnpm run db:seed
     ```
     On **PowerShell** use:
     ```powershell
     $env:DATABASE_URL="postgresql://user:pass@host:port/railway"
     pnpm run db:seed
     ```
     (Paste your real `DATABASE_PUBLIC_URL` in the quotes.)
  4. That creates the default tenant and super-admin user (e.g. `test-super_admin@example.com` / `Password123`).

---

### Step 6 — Verify

- Open the **frontend** URL in the browser. You should see the app and be able to log in (after seed).
- If you see “API unreachable” or CORS errors: double-check `NEXT_PUBLIC_API_URL` (no trailing slash) and backend `FRONTEND_URL` (exact frontend origin).

---

## Railway Settings screen — what to fill in

When you’re on a service **Settings** page (Source, Root Directory, Build, Deploy, etc.), use the values below. **Backend** = the service that runs the API; **Frontend** = the service that runs the Next.js app.

| Setting | Backend service | Frontend service |
|--------|------------------|-------------------|
| **Source / Source Repo** | `ugochukwu16henry/riseflowhub_v1.0` (same for both) | Same |
| **Branch** | `main` (or your production branch) | Same |
| **Add Root Directory** | `backend` | `frontend` |
| **Watch Paths** | Add pattern: `backend/**` | Add pattern: `frontend/**` |
| **Custom Build Command** | `pnpm install && pnpm run build` (migrations run at start via `start:deploy`) | `pnpm install && pnpm run build` |
| **Custom Start Command** | `pnpm run start:deploy` (runs migrations then server) or `pnpm start` | `pnpm start` |
| **Railway Config File** (optional) | `railway.toml` (file lives in `backend/railway.toml` in repo; with Root Directory = `backend`, path is `railway.toml`) | `railway.toml` (file in `frontend/railway.toml`; with Root Directory = `frontend`, path is `railway.toml`) |
| **Healthcheck Path** (optional) | `/api/v1/health` | `/` or leave empty |
| **Restart Policy** | On Failure (default) | On Failure (default) |
| **Networking** | Turn **Public Networking** on → **Generate Domain** | Same → **Generate Domain** |

Notes:

- **Root Directory** is required for the monorepo: without it, Railway builds from the repo root and won’t find `backend/` or `frontend/` correctly. Set it first, then build/start commands apply to that folder.
- If you set **Railway Config File** to `railway.toml`, the build/start commands from `backend/railway.toml` or `frontend/railway.toml` are used (and can override the dashboard). With Root Directory set, the path is relative to that root, so `railway.toml` is correct.
- Use **pnpm**: the repo uses pnpm. If the default builder runs `npm run build`, override with the **Custom Build Command** above so it runs `pnpm install && pnpm run build:deploy` (backend) or `pnpm install && pnpm run build` (frontend).

---

## Backend variables checklist (Railway)

Set these in the **backend** service → **Variables**.

**Required (app won't work without these)**

| Variable | How to set | Example |
|----------|------------|---------|
| `DATABASE_URL` | Variable Reference → PostgreSQL → `DATABASE_URL` | (from Postgres) |
| `FRONTEND_URL` | Plain variable | `https://your-frontend.up.railway.app` (no trailing slash) |
| `JWT_SECRET` | Plain variable | Long random string (32+ chars) |

`PORT` is set by Railway automatically.

**Required for file uploads (Railway bucket)**

| Variable | Example |
|----------|---------|
| `BUCKET` | `riseflowhubbucket-fxmrxvg` |
| `REGION` | `auto` |
| `ENDPOINT` | `https://storage.railway.app` |
| `ACCESS_KEY_ID` | (from bucket Credentials) |
| `SECRET_ACCESS_KEY` | (from bucket Credentials) |

**Optional (add when you use the feature)**

- **Payments:** `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY` — or `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- **Email:** `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`
- **Keep-alive / alerts:** `SELF_URL` (backend public URL), `ADMIN_EMAIL`, `MONITOR_ALERT_SECRET`
- **Cloudinary:** only if you don't use Railway bucket — `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- **Other:** `JWT_EXPIRES_IN`, `RECAPTCHA_SECRET_KEY`, `INTERNAL_API_KEY`, `PLATFORM_NAME`, `FOUNDER_EMAIL_PRIMARY`, `FOUNDER_EMAIL_SECONDARY`, Hugging Face / AI vars — add as needed.

---

## Frontend variables checklist (Railway)

Set these in the **frontend** service → **Variables**. All must be **plain variables** (no references); Next.js bakes `NEXT_PUBLIC_*` into the build.

**Required**

| Variable | Example | Notes |
|----------|---------|--------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app` | Backend public URL — **no trailing slash** |
| `NEXT_PUBLIC_APP_URL` | `https://your-frontend.up.railway.app` | Frontend (this app) URL; used for links and redirects |
| `NEXT_PUBLIC_MAIN_SITE` | Same as `NEXT_PUBLIC_APP_URL` | Main site URL (can match app URL if single domain) |
| `NEXT_PUBLIC_APP_NAME` | `RiseFlow Hub` | Brand name in UI |

**Recommended (same app on one domain)**

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_INVESTOR_URL` | Same as `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_ADMIN_URL` | Same as `NEXT_PUBLIC_APP_URL` |

**Optional**

| Variable | Use |
|----------|-----|
| `NEXT_PUBLIC_BRAND`, `NEXT_PUBLIC_PLATFORM` | Same as app name if you want them set |
| `NEXT_PUBLIC_GA_ID` | Google Analytics |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Facebook Pixel |
| `NEXT_PUBLIC_LINKEDIN_INSIGHT_ID` | LinkedIn Insight |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console verification |
| `NEXT_PUBLIC_SMTP_HOST` | Shown in admin system-health (cosmetic) |

**Order of setup:** Generate the frontend domain first, then set `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_MAIN_SITE`, etc. to that URL. Set `NEXT_PUBLIC_API_URL` to your **backend** domain.

---

## Prerequisites

- Railway account (Pro recommended for no sleep)
- This repo (monorepo: `backend/` and `frontend/`)
- GitHub repo connected to Railway (or use Railway CLI)

---

## 1. Create project and add PostgreSQL (reference)

1. In [Railway](https://railway.app) → **New Project**.
2. **Add plugin** → **PostgreSQL**. Railway will create a database and expose `DATABASE_URL` (and related vars) to the project.
3. In the Postgres service, open **Variables** or **Connect** and note the **`DATABASE_URL`** (you’ll reference it from the backend).

---

## 2. Add Storage Bucket (for file uploads)

1. In the same project → **Add** → **Bucket**.
2. Choose region and optional display name. Create.
3. Open the bucket → **Credentials** tab. You’ll use **Variable References** to give the backend access (see step 4).

Bucket vars Railway provides: `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `ENDPOINT`, `REGION`. The backend uses these for S3-compatible uploads when linked.

---

## 3. Deploy the backend

1. **Add** → **GitHub Repo** (or **Empty Service** and deploy via CLI).
2. If using one repo for both apps: add **one service** for the backend. In service **Settings**:
   - **Root Directory:** `backend`
   - **Build Command:** `pnpm install && pnpm run build:deploy`  
     (or `pnpm install && npx prisma generate && npx prisma migrate deploy && pnpm run build` if you don’t have `build:deploy`)
   - **Start Command:** `pnpm start` or `node dist/index.js`
   - **Watch Paths:** `backend/**` (so only backend changes trigger deploys)
3. In the backend service, open **Variables** and add (or use **Variable References** from Postgres and Bucket):

**Required**

| Variable | Example / source |
|----------|-------------------|
| `DATABASE_URL` | Reference from Postgres service (Railway adds this when you link the DB) |
| `FRONTEND_URL` | `https://your-frontend.up.railway.app` (frontend URL; set after deploying frontend) |
| `JWT_SECRET` | Long random string (e.g. 32+ chars) |
| `PORT` | Railway sets this; your app should use `process.env.PORT \|\| 4000` |

**Storage (Railway bucket)**  
Link the bucket to the backend service (Variable References → bucket’s credentials). That injects:

- `BUCKET`
- `ACCESS_KEY_ID`
- `SECRET_ACCESS_KEY`
- `ENDPOINT`
- `REGION`

The backend uses these for uploads when present (see [Storage](#storage-options) below). No need to set Cloudinary if you use Railway bucket.

**Optional (same as before)**

- Paystack: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`
- Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email: `SMTP_*`, `EMAIL_FROM`
- Cloudinary (if not using Railway bucket): `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`, `SELF_URL` (for keep-alive/alerts)

4. **Link Postgres:** In backend service → **Variables** → **New Variable** → **Reference** → select Postgres → `DATABASE_URL`. Same idea for bucket vars if not auto-injected.
5. Generate a **public domain** for the backend: **Settings** → **Networking** → **Generate Domain**. Note the URL (e.g. `https://riseflow-backend-production-xxxx.up.railway.app`).

---

## 4. Deploy the frontend

1. **Add** → **GitHub Repo** (same repo).
2. Add a **second service** for the frontend. In **Settings**:
   - **Root Directory:** `frontend`
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm start` or `npm start`
   - **Watch Paths:** `frontend/**`
3. In the frontend service **Variables** add:

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Backend public URL (e.g. `https://riseflow-backend-production-xxxx.up.railway.app`) — no trailing slash |
| `NEXT_PUBLIC_MAIN_SITE` | Frontend URL (e.g. `https://riseflow-frontend-production-xxxx.up.railway.app`) |
| `NEXT_PUBLIC_APP_URL` | Same as `NEXT_PUBLIC_MAIN_SITE` if single domain |
| `NEXT_PUBLIC_INVESTOR_URL` | Same or your investor subdomain |
| `NEXT_PUBLIC_ADMIN_URL` | Same or admin subdomain |
| `NEXT_PUBLIC_APP_NAME` | `RiseFlow Hub` |

4. **Generate domain** for the frontend (Settings → Networking). Copy the URL.
5. **Go back to the backend** and set `FRONTEND_URL` to this frontend URL (for CORS and emails). Redeploy backend if needed.

---

## 5. Database migrations and seed

- **First deploy:** The repo’s `railway.toml` uses **build** = `pnpm run build` (no DB) and **start** = `pnpm run start:deploy` (runs `prisma migrate deploy` then `node dist/index.js`). Migrations run at **start** because Railway injects `DATABASE_URL` only at runtime.
- **Seed (once):** In Railway backend service → **Settings** → run a one-off command, or use CLI:
  ```bash
  railway run pnpm run db:seed
  ```
  (from repo root, with `railway link` to the backend service and `railway run` in `backend/` context, or run the same in a shell from the backend service.)

---

## 6. Storage options

**Option A – Railway Storage Bucket (recommended)**  
- Add a Bucket in the project and link its credentials to the backend (see step 2 and 3).  
- Backend detects `ENDPOINT` + `BUCKET` + `ACCESS_KEY_ID` + `SECRET_ACCESS_KEY` and uses S3-compatible upload; returned URLs are presigned so files are accessible.

**Option B – Cloudinary**  
- Set in backend: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.  
- If both Railway bucket and Cloudinary are set, **Railway bucket takes precedence**.

---

## 7. Monorepo / root directory

Railway supports one repo, multiple services:

- **Backend service:** Root Directory = `backend`, Watch Paths = `backend/**`.
- **Frontend service:** Root Directory = `frontend`, Watch Paths = `frontend/**`.

Use **Config as code** (e.g. `railway.toml` in each folder) to lock build/start commands in the repo. See `backend/railway.toml` and `frontend/railway.toml` in this repo.

---

## 8. Checklist

- [ ] PostgreSQL added and `DATABASE_URL` referenced by backend
- [ ] Bucket added and credentials referenced by backend (or Cloudinary set)
- [ ] Backend: Root `backend`, build `pnpm run build:deploy`, start `pnpm start`; `FRONTEND_URL`, `JWT_SECRET`, `PORT` set
- [ ] Backend domain generated; frontend `NEXT_PUBLIC_API_URL` = that URL
- [ ] Frontend: Root `frontend`, build `pnpm run build`, start `pnpm start`; all `NEXT_PUBLIC_*` set
- [ ] Frontend domain generated; backend `FRONTEND_URL` = that URL
- [ ] Migrations run (via `build:deploy` or manual); seed run once
- [ ] CORS: backend `FRONTEND_URL` must match frontend origin (no trailing slash)

---

## 9. Custom domains (optional)

In each service → **Settings** → **Networking** → **Custom Domain**, add your domain and follow Railway’s DNS instructions. Then set `FRONTEND_URL` and `NEXT_PUBLIC_*` URLs to your custom domains.

---

## 10. Troubleshooting

- **Build fails (backend):** Ensure Node/pnpm version is supported. You can set `NODE_VERSION` in Variables or use a `.nvmrc` in `backend/`.
- **DB connection failed:** Confirm backend has `DATABASE_URL` (reference from Postgres). Use pooled URL if your Postgres provides one (e.g. port 6543).
- **Upload fails:** If using Railway bucket, ensure all of `BUCKET`, `ACCESS_KEY_ID`, `SECRET_ACCESS_KEY`, `ENDPOINT` are set (and referenced from bucket). Check backend logs.
- **CORS errors:** `FRONTEND_URL` must exactly match the frontend origin (scheme + host, no trailing slash).
- **P3009 migration errors:** See [Railway P3009 Migration Error Resolution](#11-railway-p3009-migration-error-resolution) below.

---

## 11. Railway P3009 Migration Error Resolution

If your Railway deployment fails with:

```text
Error: P3009
migrate found failed migrations in the target database
The migration `20250203180200_revenue_system_versions` (or another migration) failed
```

This error indicates that a Prisma migration failed midway during a previous deployment, leaving your database in a "dirty" state. Prisma blocks all new migrations until the failed migration entry is resolved in the `_prisma_migrations` table.

### Quick Resolution Steps

**Step 1: Identify the Database State**

First, check if the migration's changes were actually applied to the database:

```bash
# From your local terminal (with Railway CLI installed and linked)
cd backend
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

Or check via Railway Dashboard → PostgreSQL service → Query tab.

**Decision:**
- **If the table/columns DON'T exist** → Migration rolled back → Use `--rolled-back`
- **If the table/columns DO exist** → Migration applied → Use `--applied`

**Step 2: Resolve the Migration**

**Scenario A: Changes were NOT applied (most common)**

```bash
cd backend
railway run pnpm run db:migrate:resolve-rollback-revenue
```

This marks the migration as "rolled back" in `_prisma_migrations`, allowing Prisma to retry it on the next deployment.

**Scenario B: Changes WERE applied**

```bash
cd backend
railway run pnpm run db:migrate:resolve-applied-revenue
```

This marks the migration as "applied" in `_prisma_migrations`, telling Prisma the changes are already in place.

**Step 3: Redeploy**

```bash
git push origin main
# Or use Railway CLI
railway up
```

**Step 4: Verify**

```bash
# Check migration status
railway run npx prisma migrate status

# Verify the table exists
railway run psql $DATABASE_URL -c "\d revenue_system_versions"
```

### Why This Happens

Migrations can fail midway due to:
- Database timeouts or temporary connection issues
- Insufficient permissions
- Conflicts with existing database objects
- Network interruptions during deployment

All migrations in this project are now **idempotent** (using `IF NOT EXISTS`, `DO $$ BEGIN ... EXCEPTION`), so they can safely be retried without errors even if partially applied.

### Additional Resources

- See `backend/BUILD.md` for detailed P3009 resolution instructions
- See `backend/prisma/migrations/MIGRATION_RECOVERY.md` for technical details
- Available npm scripts:
  - `db:migrate:resolve-rollback-revenue` - For revenue_system_versions migration
  - `db:migrate:resolve-applied-revenue` - Alternative for applied state
  - `db:migrate:resolve-rollback` - For older security tables migration
