# Backend Hosting Alternatives (No Sleep / Always-On)

If your **paid** Render backend still spins down or blocks APIs, here are alternatives that keep your Node/Express + Prisma app running without sleep.

---

## Quick comparison

| Provider | Sleep / spin-down | Best for | Rough cost (always-on) |
|----------|-------------------|----------|--------------------------|
| **Railway** | No sleep on paid | Easiest migration from Render | ~$5–20/mo |
| **Fly.io** | No sleep; you control machines | Global, Docker-based | Pay per second (~$3–10/mo typical) |
| **DigitalOcean App Platform** | No sleep on paid | Simple Git deploy, familiar UI | ~$5–12/mo |
| **Vercel (serverless)** | Cold start only (~1s) | If you’re already on Vercel for frontend | Free tier generous |
| **Coolify + VPS** | None (you control server) | Full control, no vendor sleep | VPS ~$5–6/mo (Hetzner, Linode) |

---

## 1. Railway (recommended first try)

- **No sleep** on paid plans; instances stay up.
- Git-based deploy like Render; connect repo, set env, deploy.
- Use **Railway Postgres** or keep your existing DB (Supabase/Neon) via `DATABASE_URL`.
- **Migration:** Same env vars (`DATABASE_URL`, `FRONTEND_URL`, `JWT_SECRET`, etc.). Build: `pnpm install && pnpm run build`. Start: `pnpm start` (or `node dist/index.js`).
- [railway.app](https://railway.app)

### Railway for the full stack (backend + frontend + database + storage)

You can run **everything** on Railway in one project:

| Piece | Railway offering | Notes |
|-------|------------------|--------|
| **Backend** | Web Service | One service: root `backend/`, build `pnpm run build`, start `node dist/index.js`. |
| **Frontend** | Web Service | Second service: root `frontend/`, build `pnpm run build`, start `pnpm start`. Or use their [Next.js template](https://railway.com/deploy/nextjs). |
| **Database** | **PostgreSQL** | Add “PostgreSQL” from the project dashboard; Railway sets `DATABASE_URL`. Use it for Prisma. |
| **File storage** | **Storage Buckets** | S3-compatible buckets for uploads (images, documents). Create a bucket in the project; use S3-compatible credentials in your app (or keep using Cloudinary if you prefer). |

- **One project:** Create a Railway project, add 1 Postgres plugin, 1 Storage Bucket (optional), and 2 services (backend repo + frontend repo, or monorepo with two services pointing at `backend` and `frontend`).
- **Env:** Backend gets `DATABASE_URL` from the Postgres service (linked in dashboard). Set `FRONTEND_URL` to your Railway frontend URL (e.g. `https://your-frontend.up.railway.app`). Frontend gets `NEXT_PUBLIC_API_URL` = backend URL.
- **Docs:** [PostgreSQL](https://docs.railway.com/guides/postgresql), [Storage Buckets](https://docs.railway.com/guides/storage-buckets), [Next.js](https://railway.com/deploy/nextjs).
- **Full deploy guide:** [RAILWAY_DEPLOY.md](./RAILWAY_DEPLOY.md) in this repo — step-by-step for backend, frontend, Postgres, and Storage Bucket.

---

## 2. Fly.io

- **No sleep**; machines run until you stop them. Pay per second.
- Docker-based: you add a `Dockerfile`; Fly CLI deploys.
- Good if you want **global regions** or predictable “always on” behavior.
- **Migration:** Add a `Dockerfile` in `backend/` (Node, `prisma generate`, `prisma migrate deploy`, `node dist/index.js`). Use Fly Postgres or external Postgres. Set secrets via `fly secrets set`.
- [fly.io](https://fly.io)

---

## 3. DigitalOcean App Platform

- **No sleep** on paid app plans.
- Git deploy; specify build command and run command (same as Render).
- Use **DO Managed Database** or external Postgres; set `DATABASE_URL` in app env.
- **Migration:** Same as Render: build `pnpm run build`, start `node dist/index.js`, same env vars.
- [digitalocean.com/products/app-platform](https://www.digitalocean.com/products/app-platform)

---

## 4. Vercel (serverless API)

- **No “sleep”** in the Render sense; cold starts only (often &lt;1s).
- Your app is Express; you’d expose it via **serverless** (e.g. `api/index.ts` using `serverless-http` or a single catch-all route).
- **Trade-off:** Some refactor (serverless handler, Prisma in serverless), but no spin-down. Good if frontend is already on Vercel.
- [vercel.com/docs/functions](https://vercel.com/docs/functions)

---

## 5. Coolify + VPS (self-hosted)

- **No sleep**; you control the VM (Hetzner, Linode, DigitalOcean Droplet).
- **Coolify** is a self-hosted PaaS (like Render UI) on your VPS; deploy via Git or Docker.
- Full control, no vendor idle spin-down. You handle OS and DB backups.
- [coolify.io](https://coolify.io)

---

## If you stay on Render

- **Paid plan:** Confirm in Render dashboard that the service is on a plan that does **not** spin down (e.g. not “Free” or “Starter” if those still sleep).
- **Keep-alive:** Ensure `SELF_URL` (or `BACKEND_PUBLIC_URL`) is set to your backend URL so the internal cron pings `/health` every 5 minutes (see [HEALTH_KEEPALIVE.md](./HEALTH_KEEPALIVE.md)).
- **External ping:** Use [UptimeRobot](https://uptimerobot.com) to hit `/health` every 5 minutes so the instance stays awake even if internal cron misbehaves.

---

## Env vars to carry over

Wherever you host, keep these (and any others you use):

- `DATABASE_URL` — Postgres (Supabase/Neon/Railway/Fly/DO)
- `FRONTEND_URL` — For CORS (e.g. `https://your-app.vercel.app`)
- `JWT_SECRET`
- `ADMIN_EMAIL` (for alerts)
- Stripe / Paystack / Cloudinary / etc. as needed

Set `NEXT_PUBLIC_API_URL` on the **frontend** to your backend URL (e.g. on Vercel or Railway).
