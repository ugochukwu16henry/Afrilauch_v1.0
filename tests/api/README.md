# API tests (Playwright)

These tests hit the RiseFlow Hub backend API directly. **80 tests** cover health, auth, projects, tasks, agreements, admin leads, setup-fee, notifications, workspace, super-admin, and more.

## Prerequisites

1. **Backend running** and reachable (local or deployed).
2. **Database seeded** with test users (e.g. `test-client@example.com` / `Password123`, `test-super_admin@example.com` / `Password123`).

## Run all API tests

**Against local backend (default `http://localhost:4000`):**

```bash
# From repo root. Start the backend first: cd backend && pnpm dev
npx playwright test tests/api --project=api
```

**Against deployed backend (e.g. Render):**

```bash
API_BASE_URL=https://riseflowhub-v1-0.onrender.com npx playwright test tests/api --project=api
```

**List reporter (one line per test):**

```bash
npx playwright test tests/api --project=api --reporter=list
```

**HTML report (after run):**

```bash
npx playwright test tests/api --project=api
npx playwright show-report
```

## Run a subset

- **Smoke only (few key endpoints):**  
  `npx playwright test tests/api/smoke.spec.ts --project=api`
- **Single file:**  
  `npx playwright test tests/api/health.spec.ts --project=api`
- **By name:**  
  `npx playwright test tests/api -g "auth" --project=api`

## Timeout

If the run times out (e.g. on a slow or cold backend), increase timeout:

```bash
npx playwright test tests/api --project=api --timeout=60000
```
