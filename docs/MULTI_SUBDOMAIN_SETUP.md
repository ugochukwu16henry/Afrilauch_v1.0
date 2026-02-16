## RiseFlow Hub multi-subdomain setup (`riseflowhub.app`)

This document explains how to wire the codebase to a multi-subdomain architecture:

- `riseflowhub.app` — public marketing site
- `app.riseflowhub.app` — main app/dashboard
- `investors.riseflowhub.app` — investor portal
- `admin.riseflowhub.app` — internal admin / control center
- `api.riseflowhub.app` — backend API (Render)

### 1. DNS

- Point the root domain to Vercel (follow Vercel DNS instructions for `riseflowhub.app`).
- Add CNAME records:
  - `app`       → Vercel project for the main app
  - `investors` → Vercel project (can share the same repo; use different env vars)
  - `admin`     → Vercel project (same repo; different env vars)
- For the backend:
  - Add `api.riseflowhub.app` as a **custom domain** in your Render service.
  - Follow Render’s instructions (usually a CNAME from `api` to the Render hostname).

### 2. Vercel projects and env vars

You can reuse the same `frontend` code for all three frontends but give each project different environment variables.

Common envs for **all** frontend projects:

```bash
NEXT_PUBLIC_API_URL=https://api.riseflowhub.app
NEXT_PUBLIC_MAIN_SITE=https://riseflowhub.app
```

Per-project envs:

- Marketing (`riseflowhub.app`):
  - `NEXT_PUBLIC_APP_URL=https://riseflowhub.app`
  - `NEXT_PUBLIC_INVESTOR_URL=https://investors.riseflowhub.app`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.riseflowhub.app`
- App (`app.riseflowhub.app`):
  - `NEXT_PUBLIC_APP_URL=https://app.riseflowhub.app`
  - `NEXT_PUBLIC_INVESTOR_URL=https://investors.riseflowhub.app`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.riseflowhub.app`
- Investors (`investors.riseflowhub.app`):
  - `NEXT_PUBLIC_APP_URL=https://app.riseflowhub.app`
  - `NEXT_PUBLIC_INVESTOR_URL=https://investors.riseflowhub.app`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.riseflowhub.app`
- Admin (`admin.riseflowhub.app`):
  - `NEXT_PUBLIC_APP_URL=https://app.riseflowhub.app`
  - `NEXT_PUBLIC_INVESTOR_URL=https://investors.riseflowhub.app`
  - `NEXT_PUBLIC_ADMIN_URL=https://admin.riseflowhub.app`

On **Render** (backend):

- Keep `FRONTEND_URL` for backwards compatibility (e.g. `https://app.riseflowhub.app`).
- CORS is already configured to allow:
  - `https://riseflowhub.app`
  - `https://app.riseflowhub.app`
  - `https://investors.riseflowhub.app`
  - `https://admin.riseflowhub.app`
  - any `*.vercel.app` preview

### 3. Auth and redirects

- Login still happens on whichever frontend is hosting `/login`.
- After login, the frontend now:
  - Reads `user.role` from the backend.
  - Uses `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_INVESTOR_URL`, and `NEXT_PUBLIC_ADMIN_URL`
    to send users to the correct subdomain + dashboard path.
- Roles map to subdomains:
  - Founders / general users → `APP_URL` (`/dashboard`)
  - Investors → `INVESTOR_URL` (`/dashboard/investor`)
  - Super admins / PM / finance / cofounder → `ADMIN_URL` (`/dashboard/admin`)
  - HR + Legal → `ADMIN_URL` (`/dashboard/admin/hr` or `/dashboard/legal`)

### 4. Security notes

- Backend CORS now allows:
  - Explicit list of production domains.
  - Any `*.riseflowhub.app` origin (future-proof for extra subdomains).
  - Any `*.vercel.app` origin for previews.
- Auth **remains JWT + Authorization header** for now (no shared cookie yet).
  - Single sign-on across subdomains with HTTP-only cookies can be added later by:
    - Setting cookies from the backend with `domain=.riseflowhub.app`.
    - Enabling `withCredentials` on frontend fetches and tightening CORS.

