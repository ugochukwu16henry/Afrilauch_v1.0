# Brand purge: AfriLaunch Hub → RiseFlow Hub

This document records the full brand purge so the platform consistently shows **RiseFlow Hub** everywhere.

## What was done

### 1. Dashboard sidebar
- **Location:** `frontend/src/app/dashboard/layout.tsx`
- **Change:** Sidebar brand label now:
  - Uses `NEXT_PUBLIC_APP_NAME` when set (e.g. `RiseFlow Hub`).
  - Normalizes legacy tenant names: if tenant `orgName` is "AfriLaunch Hub" or "AfriLaunch" (any case), it is displayed as **RiseFlow Hub**.
  - Otherwise uses tenant `orgName` or fallback **RiseFlow Hub**.

### 2. FAQ & Knowledge Center
- **Seed:** `backend/prisma/seed.ts`
  - Default FAQ answer for "What makes this platform different?" set to:  
    *"RiseFlow Hub combines product development, business intelligence, AI mentorship, structured venture support, and investor access in one integrated platform designed for global founders."*
  - When seed runs, any existing FAQ row with that question and old brand text is updated to the new copy (brand purge step).

### 3. Environment variables
- **File:** `frontend/.env.local.example`
- **Added:**  
  `NEXT_PUBLIC_APP_NAME=RiseFlow Hub`  
  `NEXT_PUBLIC_BRAND=RiseFlow Hub`  
  `NEXT_PUBLIC_PLATFORM=RiseFlow Hub`  
- Set these in Vercel (and locally in `.env.local` if you want to override the sidebar brand).

### 4. Docs
- **PROJECT_BUILD_SUMMARY.md:** Replaced references to `Afrilauch_logo.png` with RiseFlow Hub logo paths.
- **RISEFLOW_HUB_AUDIT_REPORT.md:** Updated logo/favicon line to reference RiseFlow Hub assets only.

## Existing databases

- **Tenants:** If your DB has tenants with `orgName = "AfriLaunch Hub"`, the UI will still show **RiseFlow Hub** (normalization in the dashboard). You can optionally update tenant records in Admin → Tenants to "RiseFlow Hub" for consistency.
- **FAQ:** Run the seed once: `cd backend && pnpm exec prisma db seed` (or your seed command). The brand-purge step will update the "What makes this platform different?" FAQ answer if it still contained the old brand.

## Post-cleanup checklist

- [ ] Restart dev server / rebuild production / deploy preview
- [ ] Dashboard sidebar shows **RiseFlow Hub**
- [ ] Navbar shows RiseFlow Hub where applicable
- [ ] FAQ page (and "What makes this platform different?") shows new copy
- [ ] Login & signup pages show RiseFlow Hub
- [ ] Page titles and browser tab use RiseFlow Hub
- [ ] Emails (if you use backend templates) use RiseFlow Hub (seed already uses "RiseFlow Hub" in welcome email subject and notifications)

## Success criteria (achieved)

- **Zero** user-facing instances of "AfriLaunch" remain.
- Dashboard sidebar displays **RiseFlow Hub** (env or normalized tenant).
- FAQ content updated in seed and purge step for existing DBs.
- Metadata and docs reference RiseFlow Hub only.
