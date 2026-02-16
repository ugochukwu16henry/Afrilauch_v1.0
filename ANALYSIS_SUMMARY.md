# RiseFlow Hub — Platform Analysis Summary

## Platform Overview
- **Purpose:** Help entrepreneurs turn ideas into real, scalable businesses with structured development and investor connection.
- **Tagline:** \"From Idea to Impact\" (evolved under the RiseFlow Hub brand).
- **Brand:** Updated RiseFlow Hub palette (primary, secondary, accent) as in Tailwind config / design system.

---

## Tech Stack (from specs)
| Layer | Technology |
|-------|------------|
| Frontend | Next.js (React), Tailwind CSS, ShadCN, TypeScript |
| Backend | Node.js + Express, TypeScript, REST API, Prisma ORM |
| Database | PostgreSQL (Supabase) |
| Auth | JWT, OAuth (Google), role-based access |
| File Storage | Cloudinary / AWS S3 |
| Payments | Stripe, Flutterwave |
| AI | OpenAI (idea scoring, proposals, smart pricing) |
| Hosting | Vercel (frontend), Render/Railway (backend), Supabase (DB) |

---

## Roles & Permissions
| Role | Access |
|------|--------|
| **Client** | Own projects, pay, chat, upload files |
| **Project Manager** | Manage projects, assign tasks, review work |
| **Developer** | Assigned tasks, upload deliverables |
| **Designer** | Design tasks & files |
| **Marketer** | Branding/marketing tasks |
| **Finance/Admin** | Payments, invoices, revenue |
| **Super Admin** | Full system control |
| **Investor** | View-only platform metrics |

---

## API Endpoints (Base: `/api/v1`)

### Auth
- `POST /auth/register` — Create account
- `POST /auth/login` — Login
- `GET /auth/me` — Current user
- `POST /auth/logout` — Logout

### Users
- `GET /users/:id`, `PUT /users/:id`, `GET /users?role=`

### Clients
- `POST /clients`, `GET /clients`, `GET /clients/:id`, `PUT /clients/:id`

### Projects
- `POST /projects`, `GET /projects`, `GET /projects/:id`, `PUT /projects/:id`, `DELETE /projects/:id`

### Tasks
- `POST /projects/:id/tasks`, `GET /projects/:id/tasks`, `PUT /tasks/:taskId`, `DELETE /tasks/:taskId`

### Messages, Files, Payments, Reports, Maintenance
- `GET/POST /projects/:id/messages`, `/projects/:id/files`, `/projects/:id/payments`, `/projects/:id/reports`, `/projects/:id/maintenance`

### Agreements (Automated Signing)
- `POST/GET/PUT/DELETE /api/agreements` — Templates (Admin)
- `POST /api/agreements/:id/assign` — Assign to user
- `GET /api/agreements/assigned` — User’s assigned agreements
- `GET /api/agreements/:id/view` — Read agreement
- `POST /api/agreements/:id/sign` — Sign
- `GET /api/agreements/:id/status`, `/api/agreements/:id/logs`

---

## Database Tables
1. **Users** — id, name, email, password_hash, role (enum), created_at  
2. **Clients** — id, user_id (FK), business_name, industry, idea_summary, budget_range  
3. **Projects** — id, client_id, project_name, description, stage (Planning/Dev/Testing/Live), progress_percent, start_date, deadline  
4. **Tasks** — id, project_id, assigned_to, title, description, status (Todo/In Progress/Done/Blocked), due_date  
5. **Messages** — id, project_id, sender_id, message, created_at  
6. **Files** — id, project_id, uploaded_by, file_url, file_type  
7. **Payments** — id, project_id, amount, status (Paid/Pending), due_date  
8. **MarketingReports** — id, project_id, metric_type, value, date  
9. **MaintenanceLogs** — id, project_id, activity, date  
10. **Agreements** — id, title, type, template_url (for agreement signing)  
11. **AssignedAgreements** — id, user_id, agreement_id, status (Pending/Signed/Overdue), signed_at, signature_url, ip_address  

---

## UI Wireframes

### Client Dashboard
- **Home:** Welcome, business name, project stage, progress bar, next milestone, team assigned.
- **Sidebar:** Dashboard, Project, Tasks, Files, Messages, Payments, Reports.
- **Project Details:** Title, stage badge, description, timeline, progress, feature list.
- **Tasks:** Kanban (To Do | In Progress | Done).
- **Messages:** Conversation list + chat.
- **Files:** Grid/list, name, type, date, download.
- **Payments:** Total/paid/remaining, invoice history.
- **Marketing Reports:** Traffic, leads, posts (if subscribed).

### Super Admin — Agreement Management
- **Header:** Logo, Dashboard, Projects, Users, Agreements, Reports, Settings, Profile.
- **Section:** Search (User/Agreement/Status), filters (Status, Type, Date).
- **Table:** Agreement Title | Assigned To | Type | Status (Pending/Signed/Overdue) | Signed On | Actions (View/Resend/Download/Delete).
- **Actions:** Add New Agreement, Assign Agreement, Bulk Resend, Download Signed Docs.
- **Notifications:** Pending/overdue counts; audit trail (User, Agreement, Action, Timestamp, IP).

---

## Development Phases (Roadmap)
1. **Phase 1 MVP:** Auth, client dashboard home, projects table, task tracking, progress %.
2. **Phase 2:** Messaging, file uploads, notifications.
3. **Phase 3:** Payments, invoices, marketing reports.
4. **Phase 4:** Master project board, task assignment, QA.
5. **Phase 5:** Email alerts, auto status, analytics.

---

## First Step (Module 1)
1. Set up project skeleton (frontend + backend).
2. Define database schema with Prisma (PostgreSQL).
3. Backend: Express + JWT auth + role middleware + Auth & Users/Clients/Projects/Tasks CRUD.
4. Document progress and remaining work after Module 1.
