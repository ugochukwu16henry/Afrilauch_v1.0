# Module 1 — Project Skeleton & Authentication — Summary

## Objective

Set up the initial project skeleton, database, authentication system, and basic API endpoints. No agreement signing yet (next module).

---

## 1. Project structure (current)

### Backend (`backend/`)

```
backend/
├── prisma/
│   ├── schema.prisma      # DB schema (Users, Clients, Projects, Tasks, Agreements, AssignedAgreement, etc.)
│   └── seed.ts            # Seed one test user per role
├── src/
│   ├── controllers/       # Business logic
│   │   ├── authController.ts
│   │   └── agreementController.ts
│   ├── middleware/
│   │   └── auth.ts        # JWT auth + requireRoles
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── clients.ts
│   │   ├── projects.ts
│   │   ├── tasks.ts
│   │   └── agreements.ts
│   ├── utils/
│   │   ├── hash.ts        # bcrypt hash/compare
│   │   └── jwt.ts         # sign/verify token
│   └── index.ts
├── .env.example
├── API_DOCUMENTATION.md
└── package.json
```

### Frontend (`frontend/`)

- Next.js (TypeScript) with Tailwind — already present.
- Login/Register and dashboard pages — already present.

### Database (PostgreSQL + Prisma)

- **Users** — id, name, email, password_hash, role, created_at, updated_at  
- **Agreements** — id, title, type, template_url, created_at, updated_at  
- **AssignedAgreement** — id, user_id, agreement_id, status, signature_url, signed_at, ip_address, deadline, created_at, updated_at  
- **Projects** — id, client_id, project_name, description, stage, progress_percent, start_date, deadline, created_at, updated_at  
- Plus: Clients, Tasks, Message, File, Payment, MarketingReport, MaintenanceLog (for later modules).

---

## 2. Authentication

- **JWT-based** login and signup for all roles (Super Admin, Client, Co-founder, Team).
- Passwords hashed with **bcrypt** (salt rounds 10).
- **Role-based middleware:** `authMiddleware` (require JWT), `requireRoles(...roles)` for protected routes.

---

## 3. API endpoints (skeleton)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/api/v1/auth/signup` | Create user | Public |
| POST | `/api/v1/auth/register` | Create user (same as signup) | Public |
| POST | `/api/v1/auth/login` | Login, return JWT | Public |
| GET | `/api/v1/auth/me` | Get current user | JWT |
| GET | `/api/v1/users/me` | Get logged-in user profile | JWT |
| GET | `/api/v1/agreements` | List agreements (admin only) | JWT + Admin |
| GET | `/api/v1/projects` | List projects (role-based) | JWT |
| GET | `/api/v1/health` | Health check | Public |

Full list: see `backend/API_DOCUMENTATION.md`.

---

## 4. Created / updated files (this module)

- `backend/src/utils/hash.ts` — password hashing.
- `backend/src/utils/jwt.ts` — JWT sign/verify.
- `backend/src/controllers/authController.ts` — signup, login, me, logout.
- `backend/src/controllers/agreementController.ts` — list agreements.
- `backend/src/routes/auth.ts` — refactored to use controller; added `/signup`.
- `backend/src/routes/users.ts` — added `GET /me`.
- `backend/src/routes/agreements.ts` — new; `GET /` (admin only).
- `backend/src/index.ts` — mounted agreements route.
- `backend/prisma/seed.ts` — one test user per role.
- `backend/package.json` — `db:seed` script and Prisma seed config.
- `backend/.env.example` — FRONTEND_URL note.
- `backend/API_DOCUMENTATION.md` — signup, users/me, agreements.
- `MODULE_1_SUMMARY.md` — this file.

---

## 5. Initial test — seed users and manual checks

### Seed test users (one per role)

From `backend/`:

```bash
cp .env.example .env
# Edit .env: set DATABASE_URL (PostgreSQL)
pnpm install
pnpm prisma generate
pnpm prisma db push
pnpm run db:seed
```

**Password for all seeded users:** `Password123`

| Role | Email |
|------|--------|
| super_admin | test-super_admin@example.com |
| client | test-client@example.com |
| developer | test-developer@example.com |
| designer | test-designer@example.com |
| marketer | test-marketer@example.com |
| project_manager | test-project_manager@example.com |
| finance_admin | test-finance_admin@example.com |
| investor | test-investor@example.com |

### Test 1: Health

```bash
curl http://localhost:4000/api/v1/health
# Expected: {"status":"ok","service":"riseflowhub-api"}
```

### Test 2: Login and protected route

```bash
# Login as super_admin
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-super_admin@example.com","password":"Password123"}'
# Expected: {"user":{...},"token":"eyJ..."}

# Use token for GET /users/me
curl http://localhost:4000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: {"id":"...","name":"Test super admin","email":"test-super_admin@example.com","role":"super_admin",...}

# GET /agreements (admin only)
curl http://localhost:4000/api/v1/agreements \
  -H "Authorization: Bearer YOUR_TOKEN"
# Expected: [] or list of agreements
```

### Test 3: Client cannot access agreements

```bash
# Login as client, then GET /agreements
curl http://localhost:4000/api/v1/agreements \
  -H "Authorization: Bearer CLIENT_TOKEN"
# Expected: 403 Forbidden
```

### Test 4: Signup

```bash
curl -X POST http://localhost:4000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"New User","email":"new@example.com","password":"Password123","role":"client"}'
# Expected: 201 with {"user":{...},"token":"..."}
```

---

## 6. Confirmation

- Project skeleton: backend (controllers, routes, middleware, utils), frontend (existing Next.js), env files.
- Database: PostgreSQL + Prisma; tables for Users, Agreements, AssignedAgreement, Projects (and rest of schema).
- Auth: JWT signup/login, hashed passwords, role-based middleware.
- API: signup, login, users/me, agreements (admin), projects (role-based), health.
- Seed: one user per role; password `Password123`.
- Agreement **signing** is not implemented — that is the next module.

Once you confirm the above and that your local health/login/agreements tests pass, we can proceed to the next module (agreements management and signing).
