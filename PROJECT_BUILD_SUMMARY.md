# RiseFlow Hub — Project Build Summary

**Living document:** Update this file as the project moves forward. It consolidates summaries of all major modules and features built so far.

---

## Table of contents

1. [Overview](#overview)
2. [Module 1 — Project skeleton & authentication](#module-1--project-skeleton--authentication)
3. [Module 2 — Agreements management](#module-2--agreements-management)
4. [Module 3 — Project management](#module-3--project-management)
5. [Investor Marketplace](#investor-marketplace)
6. [Marketing Analytics & Campaign Engine](#marketing-analytics--campaign-engine)
7. [Multi-tenant white-label](#multi-tenant-white-label)
8. [App logo & favicon](#app-logo--favicon)
9. [React Native mobile app](#react-native-mobile-app)
10. [Future / next steps](#future--next-steps)

---

## Overview

- **Platform:** RiseFlow Hub — Global startup growth and venture enablement platform (entrepreneurs → real, scalable businesses).
- **Stack:** Next.js (frontend), Node.js/Express (backend), PostgreSQL/Prisma, JWT auth, role-based access. React Native (Expo) mobile app reuses the same backend.
- **Roles:** Super Admin, Client (startup owner), Developer, Designer, Marketer, Project Manager, Finance Admin, Investor.
- **Docs:** `MODULE_1_SUMMARY.md`, `MODULE_2_AGREEMENTS_SUMMARY.md`, `MODULE_3_PROJECT_MANAGEMENT_SUMMARY.md`, `backend/API_DOCUMENTATION.md`, `DEVELOPMENT_PLAN.md`.

---

## Module 1 — Project skeleton & authentication

- **Goal:** Initial skeleton, database, JWT auth, basic APIs.
- **Database:** Users, Clients, Projects, Tasks, Milestones, Agreements, AssignedAgreement, etc. (see `backend/prisma/schema.prisma`).
- **Auth:** Register, login, `/auth/me`, JWT with role in payload. Middleware: `authMiddleware`, `requireRoles`.
- **APIs:** Users, Clients, Projects, Tasks (CRUD / list by project), Milestones.
- **Frontend:** Login, Register, dashboard layout with role-based nav (client vs admin).
- **Details:** See `MODULE_1_SUMMARY.md`.

---

## Module 2 — Agreements management

- **Goal:** Automated agreement signing — Super Admin creates/assigns; clients view and sign.
- **Database:** Agreement, AssignedAgreement, AgreementAuditLog (viewed/signed).
- **APIs:** CRUD agreements, assign to user(s), list assigned, view agreement, sign (signature text/URL), status, audit logs. `GET /api/v1/agreements/assigned` for “agreements assigned to me”.
- **Frontend:** Admin — agreements list, create/edit, assign. Client — “Agreements to sign” list, view, sign with name.
- **Details:** See `MODULE_2_AGREEMENTS_SUMMARY.md`.

---

## Module 3 — Project management

- **Goal:** Project lifecycle, tasks, milestones, team assignment, progress.
- **APIs:** Projects (list scoped by role/tenant), project detail, milestones, tasks (by project, `GET /api/v1/tasks/me` for my tasks), payments, notifications (stub: agreement pending).
- **Frontend:** Client dashboard (project, tasks, files, messages, payments, reports), Admin (projects, users, agreements, startup approvals, reports, settings).
- **Details:** See `MODULE_3_PROJECT_MANAGEMENT_SUMMARY.md`.

---

## Investor Marketplace

- **Goal:** Verified investors browse startups, view project data, fund or request partnerships.
- **Database:**
  - **Investor** — id, userId, name, email, firmName, investmentRangeMin/Max, industries, country, verified, created_at.
  - **StartupProfile** — id, projectId, pitchSummary, tractionMetrics, fundingNeeded, equityOffer, stage, visibilityStatus (draft, pending_approval, approved, rejected).
  - **Investment** — id, investorId, startupId, amount, equityPercent, status (expressed, meeting_requested, committed, agreement_signed, completed, withdrawn), agreementId, meetingRequestedAt, created_at.
- **APIs:**
  - **Investors:** `POST /api/v1/investors/register`, `GET /api/v1/investors/me`, `GET /api/v1/investors` (admin or own).
  - **Startups:** `POST /api/v1/startups/publish`, `GET /api/v1/startups` (admin), `GET /api/v1/startups/me` (client’s profiles), `GET /api/v1/startups/marketplace` (approved only, filters), `GET /api/v1/startups/:id`, `PUT /api/v1/startups/:id/approve` (admin).
  - **Investments:** `POST /api/v1/investments/express-interest`, `POST /api/v1/investments/commit`, `GET /api/v1/investments`.
- **Frontend:**
  - **Investor:** Dashboard, Marketplace (approved startups, filters), Startup detail (pitch, traction, funding, express interest / request meeting / commit), My investments.
  - **Client:** “Publish to Marketplace” (`/dashboard/startup`) — create/update startup profile, submit for approval, see status (draft, pending_approval, approved, rejected).
  - **Admin:** “Startup approvals” — list all startup profiles, approve pending.
- **Security:** Only approved startups visible on marketplace; admin approval required before publishing.

---

## Marketing Analytics & Campaign Engine

- **Goal:** Track client marketing performance across platforms (Meta, Google, Email).
- **Database:**
  - **Campaign** — id, projectId, platform, budget, startDate, endDate.
  - **Lead** — id, campaignId, source, cost, conversionStatus (lead, qualified, converted).
  - **MarketingAnalyticsSnapshot** — id, projectId, traffic, conversions, cac, roi, periodStart, periodEnd (optional stored snapshots).
- **APIs:**
  - `POST /api/v1/campaigns` — create campaign (projectId, platform, budget, startDate, endDate).
  - `GET /api/v1/campaigns/project/:projectId` — list campaigns (with leads).
  - `POST /api/v1/leads/import` — bulk import leads (campaignId, leads: [{ source, cost, conversionStatus }]).
  - `GET /api/v1/analytics/:projectId` — traffic, conversions, CAC, ROI (computed from leads), byPlatform, funnel (lead → qualified → converted).
  - `POST /api/v1/ai/marketing-suggestions` — AI growth suggestions from analytics.
- **Frontend:**
  - **Marketing tab** (`/dashboard/marketing`) — project selector, KPI cards (traffic, conversions, CAC, ROI), funnel visualization, by-platform breakdown (Meta, Google, Email), AI growth suggestions, create campaign, import leads (CSV-like: source, cost, conversionStatus per line).
  - Available to clients and admins/marketers (admins can pick any project).

---

## Multi-tenant white-label

- **Goal:** Other organizations use the platform as their own (custom domain, brand color, logo, billing per tenant).
- **Database:**
  - **Tenant** — id, orgName, domain (unique), logo (URL), primaryColor, planType (free, starter, growth, enterprise), created_at, updated_at.
  - **TenantBilling** — id, tenantId, periodStart, periodEnd, amount, status (pending, paid), created_at.
  - **User** — added optional `tenantId` (FK to Tenant).
- **Auth:** Tenant resolved on signup/login from `X-Tenant-Domain` or `Host` header; new users get that tenant (or default). JWT includes `tenantId`. `GET /api/v1/auth/me` returns user + tenant (orgName, domain, logo, primaryColor, planType).
- **APIs:**
  - `GET /api/v1/tenants/current` — current user’s tenant + branding (logo, primaryColor).
  - `GET /api/v1/tenants`, `POST /api/v1/tenants` (super_admin), `PATCH /api/v1/tenants/:id` (super_admin or same tenant), `GET /api/v1/tenants/:id/billing`, `POST /api/v1/tenants/:id/billing` (super_admin).
- **Data isolation:** Projects list (admin), users list, clients list, and project detail (admin) are scoped by current user’s `tenantId`.
- **Frontend:** Login/register send `window.location.hostname` as tenant domain. Dashboard layout uses tenant branding: org name, logo (or app logo fallback), primary color for nav/links. Admin “Tenants” page: list, create, edit (org name, domain, logo URL, primary color, plan), view user count.

---

## App logo & favicon

- **Assets:** RiseFlow Hub logo and favicon in `frontend/public/` (e.g. `RiseFlowHub%20logo.png`, `favicon-for-app/favicon.ico`).
- **Usage:**
  - **Favicon:** Root layout metadata `icons: { icon: '/favicon-for-app/favicon.ico' }` (browser tab).
  - **Logo:** Home page, Login, Register, Investor register, and dashboard sidebar (with tenant logo fallback: `/RiseFlowHub%20logo.png` when tenant has no custom logo).

---

## React Native mobile app

- **Goal:** Mobile app reusing backend for project tracking, tasks, agreement signing, team chat, push notifications, AI assistant.
- **Location:** `mobile/` (Expo SDK 50, React Navigation, TypeScript, expo-secure-store, expo-notifications).
- **Backend addition:** Project chat — `GET /api/v1/projects/:id/messages`, `POST /api/v1/projects/:id/messages` (body: `{ message }`). Implemented in `backend/src/routes/projects.ts`.
- **Features:**
  - **Client project tracking:** Projects list, project detail (stage, progress, description), “Open project chat”.
  - **Task notifications:** My tasks list with pull-to-refresh.
  - **Agreement signing:** Agreements assigned to me, open pending, sign with full name (agreement id used for `POST /api/v1/agreements/:id/sign`).
  - **Chat with team:** List projects → open thread → send/receive messages (uses new messages API).
  - **Push notifications:** Permission request, Android channel; `registerForPushNotificationsAsync()` in `src/notifications.ts` (token can be sent to backend later).
  - **AI assistant:** “Evaluate idea” (feasibility, risk, market), “Project insights” (optional project ID → suggestions, risks).
  - **Account:** Email, role, Log out.
- **Config:** `EXPO_PUBLIC_API_URL` in `mobile/.env` (use LAN IP for physical device). CORS note in `mobile/README.md`.
- **Details:** See `mobile/README.md`.

---

## Future / next steps

*(Update this section as the project moves forward.)*

- **Backend:** Push: store Expo device tokens per user, send via Expo Push API when e.g. new agreement assigned, new message, task assigned.
- **Frontend:** Notifications UI for investor-related events; digital investment agreement flow linked to `Investment.agreementId`; request-meeting flow that notifies startup owner/PM.
- **Mobile:** Send Expo push token to backend; deep links for notifications (e.g. open agreement or chat).
- **Testing:** E2E (Playwright) for investor marketplace, marketing, tenant branding; mobile E2E if desired.
- **Docs:** Keep `backend/API_DOCUMENTATION.md` and this file in sync with new endpoints and features.

---

*Last updated: add date or version when you edit this file.*
