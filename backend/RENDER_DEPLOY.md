# Deploy RiseFlow Hub Backend to Render

Use this guide to deploy the Express + Prisma backend to [Render](https://render.com) so your Vercel frontend can use it for sign up, sign in, and all API endpoints.

---

## 1. Prerequisites

- GitHub repo with the **backend** code (this folder can be at repo root or in a `backend/` directory).
- Supabase project with **Postgres** and connection string (you already use this as `DATABASE_URL`).
- Frontend deployed on Vercel (you need its URL for CORS).

---

## 2. Create a Web Service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in.
2. Click **New +** → **Web Service**.
3. Connect your GitHub account and select the repository that contains this backend.
4. Configure the service:

   | Field              | Value                                                                                          |
   | ------------------ | ---------------------------------------------------------------------------------------------- |
   | **Name**           | `riseflowhub-v1-0` (so primary URL is https://riseflowhub-v1-0.onrender.com)                   |
   | **Region**         | Choose closest to your users                                                                   |
   | **Root Directory** | `backend` _(if your repo has frontend + backend; leave blank if the repo root is the backend)_ |
   | **Runtime**        | Node                                                                                           |
   | **Build Command**  | `pnpm install && pnpm run build`                                                               |
   | **Start Command**  | `pnpm start`                                                                                   |

   If Render doesn’t detect pnpm (build fails with "pnpm: command not found"), set **Build Command** to `npm install -g pnpm && pnpm install && pnpm run build` and keep **Start Command** as `pnpm start`. Or use npm: **Build** `npm ci && npm run build`, **Start** `npm start` (requires `package-lock.json` in the backend folder).

5. Under **Instance Type**, pick **Free** or **Starter** (Free is enough to test).

---

## 3. Environment Variables (Render Dashboard)

In your Render Web Service → **Environment** tab, add these variables.

### Required

| Key            | Value                                    | Notes                                                                                                                                                                                                                                                              |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL` | Your Supabase Postgres connection string | Must start with `postgresql://` or `postgres://`. From Supabase: Project Settings → Database → Connection string (URI). Use the **pooled** one if available (port 6543). If login returns 503 "Database not configured", this value is wrong or missing on Render. |
| `JWT_SECRET`   | A long random string                     | Generate one: e.g. `openssl rand -base64 32`. **Never** commit this.                                                                                                                                                                                               |
| `FRONTEND_URL` | Your Vercel app URL                      | e.g. `https://your-app.vercel.app` (no trailing slash). Used for CORS and links in emails.                                                                                                                                                                         |

### Optional (with defaults)

| Key                       | Value                                    | Notes                           |
| ------------------------- | ---------------------------------------- | ------------------------------- |
| `JWT_EXPIRES_IN`          | `7d`                                     | Token expiry (default 7 days).  |
| `PORT`                    | _(leave unset)_                          | Render sets this automatically. |
| `SMTP_HOST`               | e.g. SendGrid / Mailgun host             | Only if you send real emails.   |
| `SMTP_PORT`               | `587` or `465`                           |                                 |
| `SMTP_USER` / `SMTP_PASS` | Your SMTP credentials                    |                                 |
| `EMAIL_FROM`              | `RiseFlow Hub <noreply@riseflowhub.app>` | Sender for emails.              |

### Security posture flags (recommended)

Set these to mirror your real production infra protections. They drive the Super Admin Security dashboard “Automated defenses” status.

| Key                        | Value             | Notes                                                       |
| -------------------------- | ----------------- | ----------------------------------------------------------- |
| `PROTECTION_WAF_ENABLED`   | `true` or `false` | Turn on when WAF is active at edge (Cloudflare/AWS/Fastly). |
| `PROTECTION_DDOS_ENABLED`  | `true` or `false` | Turn on when DDoS shielding is active at edge/provider.     |
| `PROTECTION_AI_ENABLED`    | `true` or `false` | Turn on when anomaly/AI monitoring is configured.           |
| `PROTECTION_DB_ENCRYPTION` | `true` or `false` | Turn on when database encryption at rest is enabled.        |
| `PROTECTION_BACKUPS`       | `true` or `false` | Turn on when encrypted backups are enabled.                 |

Click **Save Changes** after adding variables.

---

## 4. Database (Supabase), Migrations, and Seed

- Your **database** is already on Supabase; you only need to give the backend its URL via `DATABASE_URL`.
- **Prisma needs `DATABASE_URL` in `backend/.env`** when you run migrations from your machine. Create `backend/.env` (do not commit it) with the same Supabase connection string you use on Render, e.g.:
  ```env
  DATABASE_URL="postgresql://postgres.[id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
  ```
- **One-time: baseline + apply migrations** (fixes P3005 “database schema is not empty” and creates `blocked_ips`, `security_events`, etc.):
  1. Open a terminal and go to the **backend** folder (once). Use the full path so you don’t double-cd:
     ```powershell
     cd C:\Users\Dell\Documents\Afrilauch_v1.0-1\backend
     ```
  2. Ensure `backend/.env` exists and contains `DATABASE_URL` (see above).
  3. Run:
     ```bash
     pnpm run db:baseline-deploy
     ```
     Or run the two steps manually:  
     `npx prisma migrate resolve --applied "0_baseline"` then `npx prisma migrate deploy`.
- For future schema changes: run `pnpm run db:migrate` locally, then when ready run `npx prisma migrate deploy` from the **backend** folder (with prod `DATABASE_URL` in `.env`) — do **not** add `migrate deploy` to the Render build.
- **Seed** (see below) also requires `DATABASE_URL` in `backend/.env` (or `.env.local`).

- **Seed the database** so login works (otherwise you get **401 Unauthorized**):
  - From your machine, with `DATABASE_URL` in `backend/.env.local` (or env) set to the **same** Supabase DB your Render app uses, run:
    ```bash
    cd backend && pnpm run db:seed
    ```
  - The seed creates:
    - **Super Admin:** `ugochukwuhenry16@gmail.com` — password is in `backend/prisma/seed.ts` (e.g. `1995Mobuchi@.`; change it there and re-run seed if you prefer).
    - **Test users** (password for all: `Password123`): e.g. `test-super_admin@example.com`, `test-client@example.com`, etc.
  - After seeding, use one of those emails/passwords to sign in on the deployed app.

---

## 5. Deploy

1. Click **Create Web Service** (or **Save** if you already created it).
2. Render will clone the repo, run `pnpm install && pnpm run build`, then `pnpm start`.
3. Wait for the deploy to finish. The service URL will look like:  
   `https://riseflowhub-v1-0.onrender.com` (or the name you chose).

---

## 6. Verify the Backend

- Open: **`https://<your-render-url>/api/v1/health`**  
  You should see: `{"status":"ok","service":"riseflowhub-v1-0"}`.
- If that works, the backend is up and ready for the frontend.

---

## 7. Connect the Frontend (Vercel)

In **Vercel** → your frontend project → **Settings** → **Environment Variables**:

| Key                   | Value                                           |
| --------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `https://<your-render-url>` (no trailing slash) |

Example: `https://riseflowhub-v1-0.onrender.com`

Then **redeploy** the frontend so the new API URL is used. After that, sign up and sign in on the Vercel app should work.

---

## 8. Troubleshooting

| Issue                           | What to check                                                                                                                                                                                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build fails                     | Ensure **Root Directory** is `backend` if the backend lives in a `backend/` folder. Build command must run in that directory.                                                                                                                                                            |
| "Application failed to respond" | Check **Logs** on Render. Often `DATABASE_URL` is wrong or the DB is unreachable (Supabase allows connections from anywhere by default; check IP allowlist if you enabled it).                                                                                                           |
| 500 on login/register           | Check Render **Logs** for stack traces. Typical causes: missing `JWT_SECRET`, wrong `DATABASE_URL`, or Prisma client not generated (build should run `prisma generate`; the `build` script in `package.json` does this).                                                                 |
| **401 on login**                | **Invalid email or password** means the user does not exist or the password is wrong. **Seed the database** (see §4): run `cd backend && pnpm run db:seed` with `DATABASE_URL` pointing to your production Supabase. Then use the Super Admin or test user email/password from the seed. |
| CORS errors in browser          | Set `FRONTEND_URL` on Render to the **exact** Vercel URL (including `https://`, no trailing slash).                                                                                                                                                                                      |
| Free instance "spins down"      | Render free tier sleeps after inactivity. First request after sleep can take 30–60 seconds; subsequent requests are fast until the next sleep.                                                                                                                                           |

---

## Summary

1. Create a **Web Service** on Render, root directory **backend**, build **`pnpm install && pnpm run build`**, start **`pnpm start`**.
2. Set **DATABASE_URL**, **JWT_SECRET**, and **FRONTEND_URL** (and optional SMTP/email vars).
3. Deploy; then set **NEXT_PUBLIC_API_URL** on Vercel to the Render URL and redeploy the frontend.

After that, sign up and sign in on the deployed app will use the backend on Render and the database on Supabase.
