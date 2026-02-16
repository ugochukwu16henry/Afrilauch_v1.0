# RiseFlow Hub — API Documentation

**Base URL:** `/api/v1`

**Authentication:** Bearer JWT in header: `Authorization: Bearer <token>`

---

## Auth

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | Create account | Public |
| POST | `/auth/signup` | Create account (alias) | Public |
| POST | `/auth/login` | Login | Public |
| GET | `/auth/me` | Get current user | JWT |
| POST | `/auth/logout` | Logout | JWT |

**Register/Signup body:** `{ "name", "email", "password", "role?" }` — role defaults to `client`.  
**Login body:** `{ "email", "password" }` — returns `{ user, token }`.

---

## Users

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/users/me` | Get logged-in user profile | JWT |
| GET | `/users` | List users (optional `?role=developer`) | Admin |
| GET | `/users/:id` | Get user | Self or Admin |
| PUT | `/users/:id` | Update user (e.g. name) | Self or Super Admin |

---

## Clients

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/clients` | Create client profile | Admin/PM |
| GET | `/clients` | List all clients | Admin |
| GET | `/clients/:id` | Get client | Self or Admin |
| PUT | `/clients/:id` | Update client | Self or Admin |

**Create body:** `{ "userId", "businessName", "industry?", "ideaSummary?", "budgetRange?" }`

---

## Projects

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/projects` | Create project | Admin/PM |
| GET | `/projects` | All projects (admin) or own (client) | JWT |
| GET | `/projects/:id` | Project details | JWT (role/ownership) |
| PUT | `/projects/:id` | Update project | Admin/PM |
| DELETE | `/projects/:id` | Delete project | Admin/PM |

**Create body:** `{ "clientId", "projectName", "description?", "stage?", "startDate?", "deadline?" }`

---

## Tasks

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/projects/:id/tasks` | Create task | Admin/PM |
| GET | `/projects/:id/tasks` | List tasks for project | JWT (role/ownership) |
| PUT | `/projects/:id/tasks/:taskId` | Update task | Admin/PM/Assigned/Client |
| DELETE | `/projects/:id/tasks/:taskId` | Delete task | Admin/PM |

**Create body:** `{ "title", "description?", "status?", "assignedToId?", "dueDate?" }`  
**Status:** `Todo` | `InProgress` | `Done` | `Blocked`

---

## Agreements

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/agreements` | Create agreement template | Super Admin |
| GET | `/agreements` | List all templates | Super Admin / PM / Finance Admin |
| GET | `/agreements/assigned` | List agreements assigned to current user | JWT |
| GET | `/agreements/assignments` | List all assigned agreements (admin table) | Super Admin / PM / Finance Admin |
| GET | `/agreements/:id` | Get agreement details | Super Admin / PM / Finance Admin |
| PUT | `/agreements/:id` | Update template | Super Admin |
| DELETE | `/agreements/:id` | Delete template | Super Admin |
| POST | `/agreements/:id/assign` | Assign agreement to user(s) | Super Admin |
| GET | `/agreements/:id/view` | View agreement (logs "viewed") | JWT (assigned user only) |
| POST | `/agreements/:id/sign` | Sign agreement | JWT (assigned user only) |
| GET | `/agreements/:id/status` | Assignment status for agreement | Super Admin / PM / Finance Admin |
| GET | `/agreements/:id/logs` | Audit logs (viewed/signed, IP, timestamp) | Super Admin |

**Create body:** `{ "title", "type" (NDA | MOU | CoFounder | Terms), "templateUrl?" }`  
**Assign body:** `{ "userId" or "userIds" (array), "deadline?" }`  
**Sign body:** `{ "signatureText?" (typed name), "signatureUrl?" }`

---

## AI (Startup Mentor)

All AI endpoints require **JWT**.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/ai/startup-cofounder` | Cofounder fit & role suggestions |
| POST | `/ai/business-plan` | Generate business plan sections |
| POST | `/ai/market-analysis` | Market size, trends, competitors, insights |
| POST | `/ai/risk-analysis` | Risks, mitigations, investor readiness score |
| POST | `/ai/idea-chat` | Idea validation chat (conversational) |
| POST | `/ai/smart-milestones` | Suggested milestones from idea or horizon |

**Startup cofounder body:** `{ "idea" (required), "currentRole?", "skillsYouHave?", "skillsNeeded?" }`  
**Business plan body:** `{ "idea" (required), "industry?", "targetMarket?", "businessModel?" }`  
**Market analysis body:** `{ "idea" (required), "region?", "industry?" }`  
**Risk analysis body:** `{ "idea" (required), "projectId?", "stage?" }` — returns `investorReadinessScore` (0–100) and `scoreBreakdown`.  
**Idea chat body:** `{ "messages": [ { "role": "user" | "assistant", "content": "..." } ] }` — returns `{ "message": "..." }`.  
**Smart milestones body:** `{ "ideaSummary?", "projectId?", "horizonWeeks?" }` — returns ordered milestones with phases and suggested weeks.

---

## Roles (for access control)

- `client` — own projects only  
- `developer`, `designer`, `marketer` — assigned work  
- `project_manager` — manage projects and tasks  
- `finance_admin` — payments/clients list  
- `super_admin` — full access  
- `investor` — view-only (to be enforced in future endpoints)
