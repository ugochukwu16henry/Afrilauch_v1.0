# Prompt: Resolve All Unpassed Playwright Tests

Use this prompt (and the failure list below) to fix the Playwright E2E suite so CI passes. The repo runs **Playwright Tests** on every push/PR; Railway “Wait for CI” blocks deployment until this job succeeds.

---

## 1. Root causes from CI logs

| Cause | What happens | Fix |
|-------|----------------|-----|
| **Modals block clicks** | “Welcome” (aria-label="Welcome”) and “Complete your setup” (aria-label="Complete your setup") dialogs sit on top of the page. Any click on nav (Agreements, Tasks, Log out, etc.) hits the modal and times out. | **Dismiss modals in tests** before asserting or clicking page content. Welcome: click button “Get started”. Setup: click “Skip for Now”, then “Continue to limited dashboard”. |
| **Strict mode (multiple elements)** | Playwright expects a single element; locators match 2+ (e.g. two “Agreements” links, three “Project” links, many “Welcome back”/“Dashboard”/“Progress” text nodes). | Use **`.first()`** or a **unique selector** (e.g. `getByRole('link', { name: 'Project', exact: true })`, or `getByRole('heading', { name: 'Welcome back' })` instead of a broad `getByText(...)`). |
| **Login sometimes stays on /login** | `toHaveURL(/\/dashboard/)` fails; received URL stays `http://localhost:3000/login`. Can be timing or API. | Keep or **increase timeout** for post-login navigation; optionally **wait for network idle** or for a dashboard-specific element before asserting URL. |
| **Register stays on /register or dashboard shows “Could not load projects”** | In CI, backend sends welcome email; SMTP is not available (e.g. connect ECONNREFUSED 127.0.0.1:1025). Email is fire-and-forget but slow/errors can affect flow. Dashboard load can fail if API errors. | In **CI workflow**, set **SMTP_HOST=** (empty) or a no-op so backend doesn’t try real SMTP, or ensure register/dashboard API calls don’t depend on email. Harden tests: after register, allow either dashboard with content or a short wait for “Could not load projects” and still assert we’re on `/dashboard`. |
| **“Agreements to Sign” / “Agreements” not found** | Section is only in DOM when client **has a project**; otherwise the dashboard shows “You don’t have a project yet”. Admin “Projects” link is **Ideas & Projects** for super_admin; nav is **blocked by Welcome modal** until dismissed. | In **admin** tests: **dismiss Welcome first**, then assert nav; use `getByRole('link', { name: /Ideas & Projects\|Projects/i }).first()`. For “Agreements to Sign”, assert one of: **Agreements to Sign**, **No agreements assigned to you**, or **You don't have a project yet** (`.first()` with flexible regex). |

---

## 2. Files and what to change

- **`frontend/e2e/auth.spec.ts`**
  - After login/register, if on dashboard, **dismiss Welcome and Setup modals** (see helper below).
  - Replace `getByText(/Welcome back|Dashboard|Progress|Project/i)` with a **single-element** check, e.g. `getByRole('heading', { name: 'Welcome back' })` or `getByRole('link', { name: 'Dashboard' }).first()`.
  - **Logout**: before `getByRole('button', { name: /Log out/i }).click()`, dismiss Setup modal (Skip for Now → Continue to limited dashboard) and optionally Welcome; then click Log out.

- **`frontend/e2e/client-dashboard.spec.ts`**
  - In **beforeEach**, after `toHaveURL(/\/dashboard/)`, **dismiss Welcome and Setup modals** so no dialog blocks the sidebar/links.
  - Replace every `page.locator('a[href="..."]')` that matches **multiple** elements with a **unique** locator and `.first()` where needed, e.g.:
    - `a[href="/dashboard/project"]` → `page.getByRole('link', { name: 'Project', exact: true }).first()`.
    - `a[href="/dashboard/payments"]` → `page.getByRole('link', { name: 'Payments' }).first()` (or the main nav one).
  - “Agreements to Sign”: ensure modal is dismissed first; then `getByText(/Agreements to Sign/i)` or **scroll into view**; if the section is optional in UI, use `.first()` or a soft assertion.
  - “dashboard shows project timeline or no project message”: use **`.first()`** on the getByText that currently matches 7 elements, or narrow to one (e.g. “You don’t have a project yet” or “Welcome back”).

- **`frontend/e2e/agreements-flow.spec.ts`**
  - **Admin test**: after login and `toHaveURL(/\/dashboard\/admin/)`, **dismiss Welcome modal** (click “Get started”), then click the Agreements link (e.g. `getByRole('link', { name: 'Agreements', exact: true }).first()`).
  - **Client test**: after login and `toHaveURL(/\/dashboard/)`, **dismiss Welcome and Setup modals**, then assert “Agreements to Sign” (or make it optional if not always present).

- **`frontend/e2e/admin-dashboard.spec.ts`**
  - In **beforeEach** (or at start of each test), after `page.goto('/dashboard/admin')`, **dismiss Welcome modal** (“Get started”) so no dialog blocks nav (Projects, Users, Agreements, Reports, Settings, Log out).
  - Keep using `getByRole('link', { name: 'Agreements', exact: true }).first()` for Agreements where applicable.

- **Shared helper (recommended)**  
  Add in e.g. **`frontend/e2e/helpers/dismissModals.ts`** (or at top of a spec):
  - **dismissWelcome**: if `getByRole('dialog', { name: 'Welcome' })` is visible, click button “Get started”.
  - **dismissSetupModal**: if `getByRole('dialog', { name: 'Complete your setup' })` is visible, click “Skip for Now”, then “Continue to limited dashboard” (with a short wait between if needed).
  - **dismissDashboardModals**: call both (Welcome first, then Setup), with short timeouts so they’re no-ops when modals are not present.

- **CI workflow (`.github/workflows/playwright.yml`)**
  - In the “Start backend and run Playwright tests” step, set **SMTP_HOST=** (empty) and optionally **SMTP_PORT=** so the backend does not attempt a real SMTP connection in CI (avoids ECONNREFUSED 127.0.0.1:1025 and flaky register/dashboard load).

---

## 3. Checklist before pushing

- [ ] Every test that goes to dashboard (client or admin) **dismisses Welcome and Setup modals** before clicking nav or asserting content.
- [ ] No locator that can match **multiple elements** is used without `.first()` or a more specific selector.
- [ ] Auth tests (login as client, login as super_admin, logout, register) use **single-element** assertions and modal dismissal where needed.
- [ ] Client dashboard tests use **sidebar-specific** or **unique** link names (e.g. “Project” in sidebar vs “View project” button) so strict mode never sees 2+ matches.
- [ ] CI workflow sets **SMTP_HOST** (and optionally SMTP_PORT) so backend doesn’t try SMTP in CI.
- [ ] Run **`pnpm exec playwright test`** from `frontend/` with backend and frontend running locally; all tests pass.

---

## 4. One-line summary

**Dismiss the “Welcome” and “Complete your setup” modals in every test that lands on the dashboard; fix all “strict mode violation” by using unique selectors or `.first()`; and disable SMTP in CI so register and dashboard load reliably.**
