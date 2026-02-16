# RiseFlow Hub — Development Plan & Analysis

## 1. Platform Overview (from specs)

| Aspect | Description |
|--------|-------------|
| **Purpose** | Help entrepreneurs turn ideas into real, scalable businesses. |
| **Tagline** | \"From Idea to Impact\" evolved into a broader global startup growth mission. |
| **Key features** | Client dashboards, Super Admin dashboard, project tracking, automated legal agreement signing, AI-based idea evaluation, marketing support. |
| **Tech stack** | React (Next.js), Node.js/Express, PostgreSQL, REST APIs, JWT auth, cloud storage (AWS S3 / Cloudinary). |

**Roles & permissions (from specs):**
- **Client** — Own projects, pay, chat, upload files, sign agreements.
- **Super Admin** — Full system control; agreement management; assign/view/download agreements.
- **Co-founder / Team** — Assigned work (developer, designer, marketer, project_manager, finance_admin); sign assigned agreements.
- **Investor** — View-only (future).

---

## 2. Specs vs Current State

### 2.1 API endpoints (spec) vs implemented

| Spec | Endpoint | Backend | Notes |
|------|----------|---------|--------|
| Auth | register, login, me, logout | ✅ | Done |
| Users | GET/PUT users, list by role | ✅ | Done |
| Clients | POST/GET/PUT clients | ✅ | Done |
| Projects | CRUD projects | ✅ | Done |
| Tasks | CRUD per project | ✅ | Done (path: `/projects/:id/tasks`, PUT `/projects/:id/tasks/:taskId`) |
| **Messages** | GET/POST `/projects/:id/messages` | ❌ | Not implemented |
| **Files** | GET/POST `/projects/:id/files` | ❌ | Not implemented |
| **Payments** | GET/POST `/projects/:id/payments` | ❌ | Not implemented |
| **Marketing reports** | GET/POST `/projects/:id/reports` | ❌ | Not implemented |
| **Maintenance** | GET/POST `/projects/:id/maintenance` | ❌ | Not implemented |
| **Agreements** | Full CRUD + assign, view, sign, status, logs | ❌ | Not implemented |

### 2.2 Database (Prisma schema)

- **Implemented:** Users, Clients, Projects, Tasks, Message, File, Payment, MarketingReport, MaintenanceLog, Agreement, AssignedAgreement.
- **Schema** matches specs (enums, FKs, agreement types NDA/MOU/CoFounder/Terms, AssignedAgreement status Pending/Signed/Overdue).
- **Gap:** Backend routes exist only for Auth, Users, Clients, Projects, Tasks. No routes yet for Messages, Files, Payments, Reports, Maintenance, or Agreements.

### 2.3 UI wireframes vs frontend

| Screen | Spec | Current |
|--------|------|---------|
| **Client dashboard home** | Welcome, business name, stage, progress bar, next milestone, team | ✅ Implemented (projects, stage, progress, next task) |
| **Project details** | Title, stage badge, description, timeline, progress, feature list | ✅ Page exists |
| **Tasks** | Kanban (To Do \| In Progress \| Done) | ✅ Kanban with Todo/InProgress/Done/Blocked |
| **Messages** | Conversation list + chat | ❌ Placeholder only |
| **Files** | Grid/list, name, type, date, download | ❌ Placeholder only |
| **Payments** | Total/paid/remaining, invoice table | ❌ Placeholder only |
| **Reports** | Traffic, leads, posts | ❌ Placeholder only |
| **Super Admin** | Dashboard, Projects, Users, Agreements, Reports, Settings | ✅ Structure; Agreements table not wired to API |
| **Agreement Management** | Search, filters, table, Assign, View/Download, Resend, audit trail | ❌ UI exists, no API |
| **Client “Agreements to Sign”** | Pending/Signed/Overdue, Read & Sign modal | ❌ Not implemented |

### 2.4 Agreement signing (spec)

- **Workflow:** Admin creates/assigns → User reads & signs (e-sign) → Store PDF in S3/Cloudinary → Super Admin tracks (Pending/Signed/Overdue), download, audit.
- **APIs (spec):**  
  `POST/GET/PUT/DELETE /api/agreements`, `POST /api/agreements/:id/assign`, `GET /api/agreements/assigned`, `GET /api/agreements/:id/view`, `POST /api/agreements/:id/sign`, `GET /api/agreements/:id/status`, `GET /api/agreements/:id/logs`.
- **Storage:** PDFs in S3/Cloudinary; metadata in DB (template_url, signature_url, signed_at, ip_address).
- **Current:** Schema and Super Admin “Agreements” page shell exist; no agreement routes or client “Agreements to Sign” UI.

### 2.5 AI features (spec / future)

- Idea scoring, auto-proposals, smart pricing, currency conversion.
- Not in current scope for first modules; to be added after core flows.

---

## 3. Module-by-module delivery plan

Deliver **one module at a time**, then pause for your confirmation before the next.

| Module | Scope | Outcome |
|--------|--------|--------|
| **Module 1** | **Messages & Files** | Backend: GET/POST messages and files for a project. Frontend: Messages page (list + send), Files page (list + upload). Role-based access. |
| **Module 2** | **Payments & Reports** | Backend: GET/POST payments and marketing reports per project. Frontend: Payments page (totals, list), Reports page (metrics list/charts). |
| **Module 3** | **Agreements API + storage** | Backend: Agreements CRUD, assign, view, sign; store template/signed PDF in S3 or Cloudinary; status and logs. API docs updated. |
| **Module 4** | **Agreements UI** | Super Admin: Agreement Management table (filters, assign, view, download, resend). Client: “Agreements to Sign” section + Read & Sign modal. |
| **Module 5** | **Maintenance & polish** | Maintenance logs API + optional UI; role checks everywhere; fix gaps; E2E smoke tests. |
| **Later** | **AI, deployment** | Idea evaluation, proposals, pricing, currency; then deployment (Vercel + backend + DB + env). |

---

## 4. Proposed first step (immediate)

**Option A — Recommended: Module 1 (Messages & Files)**  
- Implements two spec’d APIs and wires two client dashboard pages to match the wireframes.  
- **Backend:**  
  - `GET /api/v1/projects/:id/messages`, `POST /api/v1/projects/:id/messages` (JWT, project access check).  
  - `GET /api/v1/projects/:id/files`, `POST /api/v1/projects/:id/files` (multipart upload → store URL in DB; local file or S3/Cloudinary stub).  
- **Frontend:**  
  - Messages: conversation list (e.g. by project) + chat UI that uses the messages API.  
  - Files: grid/list of files, upload button, download links.  
- **Docs:** Update `API_DOCUMENTATION.md` with new endpoints.

**Option B — If you prefer to lock Phase 1 first**  
- Add a short “Phase 1 checklist”: verify auth, clients, projects, tasks, client home, project detail, tasks Kanban, and Super Admin nav.  
- Document any bugs or missing role checks.  
- Then proceed to Module 1 (Messages & Files).

**Option C — If starting from zero**  
- Project skeleton (Next.js + Express), PostgreSQL + Prisma, env setup, then Auth + Users + Clients + Projects + Tasks as first APIs and minimal UI.  
- (Your repo already has this; Option C is for reference only.)

---

## 5. Summary

- **Understood:** RiseFlow Hub is a multi-role platform (Client, Super Admin, team roles) with project/task tracking, messaging, files, payments, reports, and automated agreement signing. Wireframes and API specs are in the repo; DB schema is in place; Auth, Users, Clients, Projects, and Tasks are implemented.
- **Gaps:** Messages, Files, Payments, Reports, Maintenance, and the entire Agreement flow (API + storage + Super Admin + Client “Agreements to Sign”) are not yet built.  
- **First step proposed:** **Implement Module 1 (Messages & Files)** — backend routes + frontend Messages and Files pages aligned with the wireframes, then update API documentation. After delivery, we pause for your confirmation before starting Module 2.

If you confirm Option A (Module 1), the next reply will outline the exact file changes and then implement them step by step.
