# RiseFlow Hub

**From Idea to Impact.** — A platform to help entrepreneurs around the world turn ideas into websites, apps, and businesses.

## Tech stack

- **Frontend:** Next.js 14 (React), TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL (Supabase or local)
- **Auth:** JWT, role-based access (Client, Super Admin, Project Manager, etc.)
- **Package manager:** pnpm

## Project structure

```
riseflowhub_v1.0/
├── frontend/          # Next.js app (Client + Super Admin dashboards)
├── backend/           # Express API (auth, users, clients, projects, tasks, agreements, etc.)
├── mobile/            # React Native (Expo) app — projects, tasks, agreements, chat, AI, push
├── TECH Platform/     # Specs, wireframes, API docs (extracted .txt in extracted/)
├── PROJECT_BUILD_SUMMARY.md   # Living doc: summaries of all modules — update as we move forward
├── MODULE_1_SUMMARY.md
├── MODULE_2_AGREEMENTS_SUMMARY.md
├── MODULE_3_PROJECT_MANAGEMENT_SUMMARY.md
├── ANALYSIS_SUMMARY.md
└── README.md
```

## Quick start

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL (PostgreSQL) and JWT_SECRET
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm run dev
```

API runs at **http://localhost:4000**. Health: `GET http://localhost:4000/api/v1/health`

### 2. Frontend

```bash
cd frontend
# Optional: copy .env.local.example to .env.local and set NEXT_PUBLIC_API_URL=http://localhost:4000
# If unset, Next.js rewrites /api/v1/* to the backend (ensure backend URL in next.config.js)
pnpm install
pnpm run dev
```

App runs at **http://localhost:3000**.

### 3. First use

1. Open http://localhost:3000 → **Register** (creates a client).
2. After login you’re on the **Client dashboard** (welcome, project stage, progress, next milestone, team).
3. To test **Super Admin**: create a user with role `super_admin` (e.g. via API or seed), then log in as that user to see the admin dashboard (projects table, Agreements, Users, Reports).

## API overview

- **Auth:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
- **Users:** `GET /api/v1/users`, `GET /api/v1/users/:id`, `PUT /api/v1/users/:id` (role-based)
- **Clients:** `POST/GET/PUT /api/v1/clients`
- **Projects:** `POST/GET/PUT/DELETE /api/v1/projects`
- **Tasks:** `POST/GET /api/v1/projects/:id/tasks`, `PUT/DELETE /api/v1/projects/:id/tasks/:taskId`

Full list: see `backend/API_DOCUMENTATION.md`. For a consolidated summary of all modules (Investor Marketplace, Marketing, Multi-tenant, Mobile app, etc.), see **`PROJECT_BUILD_SUMMARY.md`** — update that doc as the project moves forward.

## Development phases (from specs)

- **Phase 1 (MVP):** Auth, client dashboard home, projects, task tracking, progress % — **done**
- **Phase 2:** Messaging, file uploads, notifications
- **Phase 3:** Payments, invoices, marketing reports
- **Phase 4:** Master project board, task assignment, QA
- **Phase 5:** Email alerts, auto status, analytics
- **Agreement module:** Automated agreement signing (Super Admin + Client “Agreements to Sign”)

## E2E tests (Playwright)

From `frontend/`:

1. **Backend must be running** at http://localhost:4000 with DB seeded: `cd backend && pnpm run db:seed && pnpm run dev`
2. Install browsers (first time): `pnpm exec playwright install`
3. Run tests: `pnpm test:e2e` (starts frontend via Playwright if not running)
4. UI mode: `pnpm test:e2e:ui`

See `frontend/e2e/README.md` for test users and suites (auth, client dashboard, admin dashboard, agreements flow, protected routes, tasks Kanban).

## Environment

- **Backend:** `backend/.env` (from `.env.example`) — `DATABASE_URL`, `JWT_SECRET`, `PORT`, etc.
- **Frontend:** `frontend/.env.local` (optional) — `NEXT_PUBLIC_API_URL` for direct API URL; if unset, Next rewrites `/api/v1/*` to the backend URL in `next.config.js`.

## Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- Full checklist (DB seeding, CMS, auth, dashboards, payments, AI)
- Frontend (Vercel) and backend (Railway/Render) deployment steps
- Environment variables for production
- Optional CI/CD (GitHub Actions + Playwright)

## Troubleshooting

### Prisma Migration P3009 Error

If you encounter a P3009 error during Railway deployment (failed migration), see:

- **Quick Fix Guide:** [docs/PRISMA_MIGRATION_P3009_FIX.md](./docs/PRISMA_MIGRATION_P3009_FIX.md) - Step-by-step resolution
- **Detailed Guide:** [backend/BUILD.md](./backend/BUILD.md#railway-p3009-failed-migration) - Complete instructions
- **Technical Details:** [backend/prisma/migrations/MIGRATION_RECOVERY.md](./backend/prisma/migrations/MIGRATION_RECOVERY.md)

### Other Common Issues

- **Backend build fails on Windows:** See [backend/BUILD.md](./backend/BUILD.md#windows-eperm-on-prisma-generate)
- **CORS errors:** Check `FRONTEND_URL` in backend matches frontend origin exactly (no trailing slash)
- **Database connection issues:** Verify `DATABASE_URL` is set correctly and database is accessible
