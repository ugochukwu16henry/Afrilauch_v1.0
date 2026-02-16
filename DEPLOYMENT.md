# RiseFlow Hub — Development & Deployment Guide

This doc maps the full SaaS platform checklist to the **current stack**: Next.js frontend, Express backend, Prisma + PostgreSQL (Supabase or any Postgres), JWT auth, CMS, dashboards, investor deal room, payments, and AI features.

---

## 1. Project setup

### Frontend (Next.js)

- **Location:** `frontend/`
- **Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, react-hook-form, recharts, framer-motion
- **Commands:** `pnpm install` → `pnpm run dev` (runs at http://localhost:3000)

### Backend (Express + Prisma)

- **Location:** `backend/`
- **Stack:** Node.js, Express, TypeScript, Prisma, PostgreSQL
- **Commands:** `pnpm install` → `pnpm prisma generate` → `pnpm prisma db push` (or `db:migrate`) → `pnpm run dev` (runs at http://localhost:4000)

### Folder structure (current)

```
frontend/
  src/
    app/              # App Router pages
      api/            # Next.js API routes (e.g. /api/content/[slug])
      dashboard/      # Client, Admin, Super Admin, Investor dashboards
      login, register, pricing, terms, privacy, ...
    components/       # UI components
    lib/              # api.ts, cmsSections, etc.
    hooks/            # useCMS.ts
    data/             # pageContent fallbacks
backend/
  src/
    controllers/      # CMS, auth, startups, investors, payments, AI, ...
    routes/          # Express routes mounted at /api/v1/*
    middleware/       # authMiddleware, requireSuperAdmin
    services/         # email, currency, auditLog
  prisma/
    schema.prisma     # All tables including cms_content, users, startups, ...
    seed.ts           # Super Admin + test users + CMS default content
```

---

## 2. Database & seeding

### Tables (Prisma schema)

- **users** — id, email, passwordHash, role (super_admin, client, investor, developer, …), tenantId, setupPaid, …
- **cms_content** — id, key (unique), value (text), type (text/richtext/image/json), page, updatedById, updatedAt
- **Project / Client / StartupProfile** — startups workspace data
- **Investment / DealRoomMessage** — investor interest and deal room
- **UserPayment / Payment** — setup fee, project payments
- **Agreement / AssignedAgreement** — legal and signing
- Plus: Tenant, Milestone, Task, Message, File, AdminLead, AuditLog, etc.

### Seed script

```bash
cd backend
pnpm run db:seed
```

- Creates default tenant (RiseFlow Hub)
- Creates test users for each role (`test-{role}@example.com`, password: `Password123`)
- Creates Super Admin (`ugochukwuhenry16@gmail.com` — set password in seed)
- Seeds **CMS default content** (home.hero.title, pricing.setupFee, email.welcome.subject, legal.terms, legal.privacy, etc.)

### Database options

- **Supabase:** Create a project → get `DATABASE_URL` (PostgreSQL connection string) → use in `backend/.env`
- **Local PostgreSQL:** `DATABASE_URL="postgresql://user:pass@localhost:5432/riseflowhub"`
- **Other:** Any Postgres host (Railway, Neon, Render, etc.)

---

## 3. CMS setup

- **API (backend):** `GET /api/v1/cms/:key`, `GET /api/v1/cms/page/:pageName`, `POST/PUT/DELETE` (Super Admin only)
- **Frontend hook:** `useCMS(key, fallback)` in `frontend/src/hooks/useCMS.ts`
- **Super Admin UI:** Dashboard → **CMS Manager** → Website Pages, Dashboard Content, Pricing, Legal, Email Templates, Feature Descriptions, System Messages
- **Cache:** In-memory 1 min; `clearCMSCache()` after updates so frontend reflects changes

---

## 4. Authentication

- **Provider:** JWT (Express backend), not Supabase Auth
- **Endpoints:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- **Roles:** super_admin, client, investor, developer, designer, marketer, project_manager, finance_admin
- **Access:**
  - **Super Admin** → full access (CMS, payments, users, audit logs, etc.)
  - **Founder/Client** → workspace, project, idea vault, business model, team, documents, investor view, progress
  - **Investor** → deal room (list “Investor Ready” startups), express interest, request meetings, messages
- **Middleware:** `authMiddleware`, `requireSuperAdmin`, `requireSetupPaid` in `backend/src/middleware/auth.ts`
- **Frontend:** Token in `localStorage` (`riseflow_token`); dashboard layout checks role and shows correct nav

---

## 5. Startup workspace system

- **API:** `GET/PATCH /api/v1/workspace/:projectId`, idea-vault, business-model, team, files, investor-view, progress
- **Dashboard tabs:** Overview, Idea Vault, Business Model, Roadmap (milestones/tasks), Team, Documents, Investor View, Progress
- **Routes:** `frontend/src/app/dashboard/project/[projectId]/page.tsx` and workspace sub-pages

---

## 6. Investor deal room

- **API:** `GET /api/v1/startups/marketplace`, `POST /api/v1/investments/express-interest`, `GET/POST /api/v1/deal-room/*`, messages
- **Dashboard:** Deal Room, Marketplace (startups marked Investor Ready), list cards, read-only profiles, request meetings, messages

---

## 7. Payment system

- **Setup fee:** Idea Starter ($7 USD), Investor ($10 USD) — config in `backend/src/config/pricing.ts`
- **Flow:** Paid → unlock dashboard; Skip → locked features + reason form
- **Backend:** `GET /api/v1/setup-fee/config`, `GET /api/v1/setup-fee/quote?currency=NGN`, `POST /api/v1/setup-fee/create-session`, `POST /api/v1/setup-fee/verify`, `PUT /api/v1/setup-fee/skip`
- **Currency:** Open ExchangeRate API (open.er-api.com) for global currencies; no API key required (optional key can be used if you switch provider)
- **Production:** Replace simulated checkout in `setupFeeController.ts` with Stripe Checkout (or Paystack). Add `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` to backend `.env` when integrating.

---

## 8. AI features

- **API:** `/api/v1/ai/evaluate-idea`, `generate-proposal`, `pricing`, `project-insights`, `marketing-suggestions`, `startup-cofounder`, `business-plan`, `market-analysis`, `risk-analysis`, `idea-chat`, `smart-milestones`
- **Optional:** Set `OPENAI_API_KEY` in backend `.env` to enable real AI; otherwise placeholders/mock responses can be used

---

## 9. Frontend CMS-editable pages

- **Super Admin:** Dashboard → CMS Manager → edit Website Pages, Pricing, Legal, Email Templates, etc.
- **Save** → `PUT /api/v1/cms/page/:pageName` → `clearCMSCache()` → frontend shows new content on next load
- **Public pages:** Use `useCMS('home.hero.title', 'Fallback')` so content is editable without code changes

---

## 10. Security

- **Role-based middleware** on all sensitive routes (Super Admin only: CMS write, audit logs, user list, payments)
- **Passwords:** bcrypt hashed; JWT in Authorization header
- **Env:** Never commit `.env`; use `.env.example` as template
- **Database:** If using Supabase, enable **Row Level Security (RLS)** on tables and define policies; current app uses application-level checks in Express middleware
- **App-layer protections (backend):**
  - Global API rate limiting via `apiRateLimiter` middleware (configurable with `SECURITY_API_WINDOW_MS` / `SECURITY_API_MAX_REQUESTS`).
  - Login-specific rate limiting via `loginRateLimiter` and auto IP blocking on repeated failures.
  - `SecurityEvent` & `BlockedIp` tables store intrusion events and blocked sources.
  - Super Admin **Security Dashboard** at `/api/v1/super-admin/security/*` (frontend consumes this for an admin UI).
- **Infrastructure hardening (recommended):**
  - Put backend behind a WAF (Cloudflare WAF, AWS WAF, Fastly) with managed rulesets for SQLi/XSS/bot/DDoS.
  - Enforce HTTPS/TLS 1.2+ (prefer 1.3) and enable HSTS at the edge once stable.
  - Restrict database access to private networks / VPC; do not expose Postgres directly to the internet.


---

## 11. Deployment

### Frontend (Vercel)

1. Push repo to GitHub.
2. Vercel → Import project → set root to **`frontend`**.
3. **Environment variables:**
   - `NEXT_PUBLIC_API_URL` = your backend URL (e.g. `https://api.yourdomain.com` or `https://your-backend.railway.app`).
4. Deploy; Vercel builds and deploys on push.

### Backend (Railway / Render / Fly.io / Node host)

1. Set root/build to **`backend`**.
2. **Build:** `pnpm install && pnpm run build`  
   - Uses `prisma generate && tsc`. **Do not** run `prisma migrate deploy` in the Render build step — Supabase already has tables, so Prisma would hit P3005. Run migrations manually when you change schema (see Database section below).
3. **Start:** `pnpm start` (runs `node dist/index.js`)
4. **Environment variables:**
   - `DATABASE_URL` — production PostgreSQL (e.g. Supabase connection string)
   - `JWT_SECRET` — strong secret for production
   - `PORT` — often provided by host (e.g. `process.env.PORT || 4000`)
   - `FRONTEND_URL` / `CORS` — your Vercel URL for CORS and redirects
   - Optional: `SMTP_*`, `OPENAI_API_KEY`, `STRIPE_*` when you enable them

### Database (Supabase)

**Full step-by-step:** see **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**.

1. Create a Supabase project → **Project Settings → Database** → copy the **Connection string (URI)**.
2. Put it in `backend/.env` as `DATABASE_URL` (use the **pooler** URI, port 6543, for production).
3. **Apply schema:**  
   - **Render build:** Do **not** use `prisma migrate deploy` in the build (Supabase is never “empty”, so you’d get P3005). Use `pnpm install && pnpm run build` only.  
   - **One-time baseline** (if you see **P3005** “The database schema is not empty”): Run **locally** with production `DATABASE_URL` in `backend/.env`:  
     `cd backend && npx prisma migrate resolve --applied "0_baseline"`  
     (Use the exact migration folder name under `backend/prisma/migrations/`, e.g. `0_baseline`.) That tells Prisma the DB is already in sync for that migration.  
   - **One-time: create new tables** (e.g. `blocked_ips`, `security_events`, `support_banner_events`): After baselining, run **once** locally with prod `DATABASE_URL`:  
     `cd backend && npx prisma migrate deploy`  
     Then push and let Render redeploy (build stays without migrate deploy).  
   - **Future schema changes:** Run `npx prisma migrate dev` locally, push, then run `npx prisma migrate deploy` locally against production when you’re ready — not in the Render build.  
   - **Local / one-off:** `cd backend && pnpm prisma generate && pnpm prisma db push && pnpm run db:seed`.
4. Optional: enable Storage for file uploads; configure RLS if desired.

---

## 12. Pre-deploy checklist

- [ ] **Supabase or Postgres** project created; `DATABASE_URL` set in backend `.env`
- [ ] **Backend:** `pnpm run build` on Render (no migrate deploy in build); run `prisma migrate resolve --applied "0_baseline"` and `prisma migrate deploy` locally against prod when needed; `pnpm run db:seed` if needed
- [ ] **Frontend:** Tailwind and Next.js build succeed (`pnpm run build` in `frontend`)
- [ ] **API routes** working: CMS, auth, startups, investors, payments (manual or E2E)
- [ ] **Stripe (optional):** Test keys in backend env; integrate in `setupFeeController` for production payments
- [ ] **Dashboards:** Super Admin, Founder, Investor dashboards and role-based nav verified
- [ ] **Auth middleware** applied; only Super Admin can access CMS write, audit logs, user list
- [ ] **CMS hook** `useCMS` used on dynamic pages where content is editable
- [ ] **AI:** Placeholder or OpenAI key configured
- [ ] **Env:** Production env vars set in Vercel (frontend) and backend host (backend)

---

## 13. CI/CD (optional)

- **Existing:** `.github/workflows/playwright.yml` — runs Playwright on push to `main`/`master`.
- **Improve:** Add backend lint/test step; run `pnpm prisma generate` and API tests (e.g. `tests/api/*.spec.ts`) in CI.
- **Deploy:** Vercel auto-deploys frontend on push; connect backend host (e.g. Railway) to GitHub for auto-deploy on push.

---

## Environment variables summary

| Where       | Variable                 | Description |
|------------|---------------------------|-------------|
| Backend    | `DATABASE_URL`            | PostgreSQL connection string |
| Backend    | `JWT_SECRET`              | Secret for JWT signing |
| Backend    | `PORT`                    | Server port (default 4000) |
| Backend    | `FRONTEND_URL`            | Frontend origin for CORS and redirects |
| Backend    | `SMTP_*`                  | Optional; for transactional email |
| Backend    | `OPENAI_API_KEY`          | Optional; for AI features |
| Backend    | `STRIPE_SECRET_KEY`       | Optional; when Stripe is integrated |
| Frontend   | `NEXT_PUBLIC_API_URL`     | Backend API base URL (e.g. https://api.example.com) |

See `backend/.env.example` and `frontend/.env.local.example` for full templates.
