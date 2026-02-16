# CI Check Suite Troubleshooting

When you see **"CI check suite failed"** on a PR or push, the automated pipeline found an error that blocks merge or deployment. This doc helps you find and fix it.

## Where to Look

1. **GitHub Actions**  
   Open the PR → **Checks** tab → click the failed run → open the failed **job** (e.g. "Backend" or "Playwright Tests") → read the **step** that failed and the logs above it.

2. **Railway (backend deployment)**  
   If the backend is deployed on Railway and the build/deploy fails, open the Railway project → your backend service → **Deployments** → failed deployment → **View build logs** / **View deploy logs**.

## Workflows in This Repo

| Workflow        | When it runs                         | What it does                                      |
|----------------|---------------------------------------|---------------------------------------------------|
| **Backend**     | Push/PR when `backend/**` (or this workflow) changes | `pnpm install`, `pnpm run build` in `backend/`     |
| **Playwright Tests** | Every push/PR to main/master           | Postgres + backend install → db push/seed → build → start backend → run e2e (Chromium only in CI, ~10–15 min) |

- If **Backend** fails: the problem is in backend code, build, or dependencies (see below).
- If **Playwright Tests** fails: could be backend start, DB seed, or frontend e2e tests; check which step failed in the log.

## Common Causes and Fixes

### 1. Failed automated tests

- **Symptom:** Step "Start backend and run Playwright tests" or "Run tests" fails.
- **Fix:** Run the same command locally (see [Reproduce locally](#reproduce-locally)). Fix failing tests or flaky behavior (e.g. timing, missing data).

### 2. Syntax or build errors

- **Symptom:** "Build backend" or "Build" step fails (e.g. `tsc` or `prisma generate` error).
- **Fix:**  
  - In repo root: `cd backend && pnpm install && pnpm run build`  
  - Resolve TypeScript or Prisma errors shown in the log.  
  - Ensure Node/TS versions match what CI uses (e.g. `lts/*` in the workflow).

### 3. Dependency / lockfile issues

- **Symptom:** "Install backend dependencies" (or frontend) fails, often with a message about the lockfile or resolution.
- **Fix:**  
  - From `backend/` (or `frontend/`): run `pnpm install` (no `--frozen-lockfile`).  
  - Commit the updated `pnpm-lock.yaml` so CI’s `pnpm install --frozen-lockfile` succeeds.

### 4. Environment and config

- **Backend build:** Needs `DATABASE_URL` in format `postgresql://...` (or `postgres://...`) so Prisma can run. The workflows set this; if you add a new step that runs Prisma or the app, set `DATABASE_URL` in that step or job.
- **Backend start (Playwright):** The "Start backend and run Playwright tests" step sets `PORT`, `FRONTEND_URL`, `JWT_SECRET`, and `DATABASE_URL`. The app only **requires** `DATABASE_URL` at startup; others have defaults.
- **Railway:** In the Railway dashboard, set all required variables (especially `DATABASE_URL`, `JWT_SECRET`) for the backend service. Missing vars can cause build or runtime failures.

### 5. Linting / style

- **Symptom:** A "Lint" or "Check" step fails.
- **Fix:** Run the same lint command locally (e.g. `pnpm run lint` in backend or frontend) and fix reported issues.

### 6. Backend failed to start (Playwright)

- **Symptom:** Log says "Backend failed to start" or the health check `curl http://localhost:4000/api/v1/health` never succeeds.
- **Fix:**  
  - Ensure the backend starts with the same env as in the workflow:  
    `PORT=4000 FRONTEND_URL=http://localhost:3000 JWT_SECRET=ci-secret-min-32-characters-long DATABASE_URL=postgresql://postgres:postgres@localhost:5432/railway`  
  - Run the backend locally against a Postgres DB and confirm it listens on the port and that `/api/v1/health` returns 200.  
  - If the app exits on startup (e.g. missing env), add the required env in the workflow or make the app tolerate CI (e.g. optional vars with safe defaults).

## Reproduce locally

From the repo root, with **Postgres running** (e.g. Docker with DB `railway`, user `postgres`, password `postgres`, port 5432):

```bash
# Backend only (matches Backend workflow + DB steps of Playwright)
cd backend
pnpm install --frozen-lockfile
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/railway
pnpm run db:push
pnpm run db:seed
pnpm run build
# Optional: start and hit health
PORT=4000 pnpm start &
sleep 5
curl -s http://localhost:4000/api/v1/health
```

For **Playwright**, use the same `DATABASE_URL`, then from the repo root (or as in the workflow):

- Start backend with the same env as in the workflow.
- From `frontend/`: `pnpm exec playwright test`.

## Re-running and flakiness

- In GitHub Actions, use **Re-run failed jobs** (or re-run all jobs) once; flaky tests or transient network issues sometimes pass on retry.
- If a test is flaky, add retries or fix timing/ordering so the suite is stable.

## Summary

1. Open the failed **workflow run** → failed **job** → failed **step** and read the log.  
2. Match the failing step to the causes above (build, deps, env, backend start, tests).  
3. Reproduce with the same commands and env locally, fix the issue, and push.  
4. Use the **Backend** workflow to get a quick, backend-only signal when you change `backend/` or the backend CI config.
