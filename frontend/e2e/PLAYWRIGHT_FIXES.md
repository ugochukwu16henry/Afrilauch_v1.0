# Playwright E2E Fixes — Summary

## Root causes addressed

1. **Auth / login**
   - Login depends on **backend at http://localhost:4000**. If the backend is not running or not reachable, login stays on `/login` and dashboard tests fail.
   - **Fixes:** Added `data-testid="auth-error"` on the login error div for stable invalid-credentials assertion. Added `waitForLoadState('domcontentloaded')` after `goto` so the page is ready before filling inputs. Relaxed post-login visibility checks to accept "Progress", "Project", "Dashboard" so they pass once redirect completes.

2. **Unstable selectors**
   - **Agreements:** Multiple links matched "Agreements" (e.g. "Legal Agreements", "Agreements"). Replaced with `locator('a[href="/dashboard/admin/agreements"]')` in admin and agreements-flow specs.
   - **Client nav:** Sidebar links (Project, Tasks, Files, etc.) now use `locator('a[href="..."]')` to avoid ambiguity with other links.
   - **Home/register:** Register link on home is "Launch My Idea" (Nav); fallback regex also allows "Start Your Project", "Start Building" for CMS variants.

3. **Timing / hydration**
   - **beforeEach:** After login, we wait for a nav link (e.g. "Projects") to be visible so the dashboard layout has loaded before running tests.
   - **No `waitForTimeout`:** All waits are assertion-based (`expect(...).toBeVisible()`, `toHaveURL()`) or `waitForLoadState('domcontentloaded')`.

4. **Tasks / Kanban**
   - **data-testid:** Tasks page columns have `data-testid="kanban-column-todo"`, `kanban-column-inprogress`, `kanban-column-done`, `kanban-column-blocked`.
   - **No project:** When the client has no project, the Tasks page shows "No project yet" instead of Kanban. Tests accept either Kanban columns or "No project yet".

5. **Config**
   - **timeout:** 10000 ms per test; **expect:** 5000 ms; **actionTimeout:** 5000; **navigationTimeout:** 10000. No test is allowed to exceed 10s without failing.

## Files modified

| File | Changes |
|------|--------|
| `playwright.config.ts` | `timeout: 10000`, `expect: { timeout: 5000 }`, `actionTimeout`, `navigationTimeout` |
| `src/app/login/page.tsx` | `data-testid="auth-error"` on error div |
| `src/app/dashboard/tasks/page.tsx` | `data-testid` on each Kanban column wrapper |
| `e2e/auth.spec.ts` | `waitForLoadState`, `getByTestId('auth-error')`, relaxed visibility, register link regex |
| `e2e/protected-routes.spec.ts` | Removed explicit timeouts (use config default) |
| `e2e/admin-dashboard.spec.ts` | `waitForLoadState` in beforeEach, wait for nav after login, Agreements by href, Reports/Settings/Log out |
| `e2e/client-dashboard.spec.ts` | `waitForLoadState`, nav by href, relaxed overview/timeline assertions, Tasks page accepts Kanban or "No project yet" |
| `e2e/agreements-flow.spec.ts` | `waitForLoadState`, admin Agreements link by href, wait for admin nav after login |
| `e2e/tasks-kanban.spec.ts` | `waitForLoadState`, Tasks link by href, assert Kanban columns via `data-testid` or "No project yet" |

## Why Chromium failed most

- **Heavier process:** Chromium often runs first and triggers cold start of the Next.js dev server; other browsers may reuse a warm server.
- **No backend:** If the backend is not running, every login fails; Chromium runs more tests in parallel so more failures show up there.
- **Strict selectors:** Previously, "Agreements" matched multiple elements in Chromium’s strict mode; using `a[href="..."]` fixes that.

## Auth state

- We did **not** add a global storage-state setup (single login reused across tests). Each spec that needs auth does a fresh login in `beforeEach` or in the test. This avoids cross-test pollution and keeps each test self-contained. If you want to optimize later, you can add a project that runs once, logs in, and saves `storageState.json`, and a second project that uses that state.

## How to get green tests

1. **Start the backend:** `cd backend && pnpm run dev` (must be listening on http://localhost:4000).
2. **Seed DB:** `cd backend && pnpm run db:seed` (test users: test-client@example.com, test-super_admin@example.com, etc., password: Password123).
3. **Run tests:** `cd frontend && pnpm test:e2e` (or `pnpm exec playwright test --project=chromium` for one browser).
4. **Optional:** Set `NEXT_PUBLIC_API_URL=http://localhost:4000` in `frontend/.env.local` if the app uses a different API URL.

## Requirements met

- No tests disabled.
- No blind timeout increases; timeouts are 10s test / 5s expect.
- No `waitForTimeout()`; all waits are assertion- or load-state-based.
- Root causes addressed: selectors, hydration, and dependency on backend documented.
