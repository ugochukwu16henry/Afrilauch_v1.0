# RiseFlow Hub — System Architecture (Hiring + Talent + Legal)

PostgreSQL • Next.js • Node.js/Express • JWT • Stripe/Paystack • RBAC

---

## 1. DATABASE SCHEMA (CORE STRUCTURE)

**PostgreSQL** — structured relational system.

### 👤 USERS TABLE

All users start here.

| Field          | Type      | Notes                    |
|----------------|-----------|--------------------------|
| id             | UUID      | PK                       |
| name           | String    | full_name in spec        |
| email          | String    | unique                    |
| password_hash  | String    | bcrypt                    |
| role           | ENUM      | see Role enum below      |
| country        | String?   |                          |
| phone          | String?   |                          |
| verified       | Boolean   | default false             |
| created_at     | Timestamp |                          |

**Role ENUM:** `talent` | `hiring_company` | `hirer` (alias) | `hr_manager` | `legal_team` | `super_admin` | `cofounder` (+ legacy: client, developer, project_manager, etc.)

### 🧑‍💼 TALENT PROFILES

| Field              | Type    | Maps to schema              |
|--------------------|---------|-----------------------------|
| user_id            | FK      | User.id                     |
| short_bio          | Text    | Talent.shortBio             |
| experience_years   | Int     | Talent.yearsExperience      |
| availability       | ENUM    | full_time / part_time / freelance |
| portfolio_link     | String  | Talent.portfolioUrl         |
| resume_url         | String  | Talent.resumeUrl            |
| cv_url             | String  | Talent.cvUrl                |
| approved           | Boolean | Talent.status === 'approved' |
| marketplace_access | Boolean | Talent.feePaid              |
| rating_avg         | Float   | Talent.averageRating        |

### 🛠 SKILLS TABLE

| id   | name   | category   |
|------|--------|------------|
| UUID | String | Tech/Creative/Business |

### 🔗 TALENT_SKILLS (Many-to-Many)

| talent_id | skill_id |

### 🏢 HIRING COMPANIES (Hirer)

| Field         | Type    |
|---------------|---------|
| user_id       | FK      |
| company_name  | String  |
| website       | String? |
| verified      | Boolean |

### 📄 AGREEMENTS

- **Agreement** — template (type: NDA, MOU, HireContract, FairTreatment, etc.)
- **AssignedAgreement** — per user assignment: status = `Draft` | `Pending` | `Signed` | `Overdue` | `Disputed`
- **Hire** — links talent + company + optional agreementId; stores role, pay, workTerms

Flow: Company drafts → Talent reviews → Both sign digitally → Stored permanently → Legal monitors. All signatures time-stamped.

### ⭐ REVIEWS (TalentRating)

| talent_id (to_user_id) | reviewer_id (from_user_id) | rating | comment | skill_rating? |

### 💰 PAYMENTS (UserPayment)

| user_id | type (marketplace_fee / company_fee / setup_fee) | amount | status |

---

## 2. ROLE PERMISSION LOGIC (RBAC)

Middleware: `checkRole(['super_admin', 'hr_manager'])` — use after `authMiddleware`.

| Role         | Permissions                                      |
|--------------|---------------------------------------------------|
| Super Admin  | Everything                                        |
| Co-Founder  | Talent approval, marketplace moderation          |
| HR Manager   | View applicants, interviews                      |
| Legal Team   | Agreements only                                   |
| Talent       | Own profile + marketplace                         |
| Hiring Company | Hire talents                                    |

**Backend:** `backend/src/middleware/auth.ts` — `requireRoles(...roles)`  
**RBAC helpers:** `backend/src/middleware/rbac.ts` — `checkRole`, `requireTalentApprover`, `requireLegalOrSuperAdmin`, `requireHiringCompanyOrAdmin`

---

## 3. PAYMENT ARCHITECTURE

**Stripe or Paystack** (multi-region friendly).

- **Talent marketplace fee ($7):** Talent → Stripe Checkout → Webhook → `marketplace_access` (feePaid) = true  
- **Company platform fee ($20):** Company → Payment → `verified_company` (Hirer.verified) = true  

Current implementation uses **simulated** checkout (same flow); replace with Stripe/Paystack in `marketplaceFeeController` and `setupFeeController` + webhook handler.

---

## 4. SECURITY MODEL

- ✅ **JWT Authentication** — `authMiddleware`, Bearer token  
- ✅ **Password hashing** — bcrypt (backend `utils/hash.ts`)  
- ✅ **Role middleware** — `requireRoles`, `checkRole`  
- ✅ **Input validation** — express-validator on routes  
- ✅ **File upload** — use Cloudinary / S3; store URLs only in DB (no raw binary in DB)  
- ✅ **HTTPS only** — enforce in production (e.g. Vercel/Render)  
- ✅ **Audit logs** — `AuditLog` model + `createAuditLog` service  
- ✅ **Agreement signature logs** — `AgreementAuditLog` + IP, timestamp  
- ✅ **Anti-spam** — rate-limit talent apply (e.g. express-rate-limit) or captcha placeholder  

---

## 5. SYSTEM ARCHITECTURE OVERVIEW

| Layer     | Stack                |
|-----------|----------------------|
| Frontend  | Next.js              |
| Backend   | Node.js + Express    |
| Database  | PostgreSQL (e.g. Supabase) |
| Auth      | JWT                  |
| Payments  | Stripe / Paystack    |
| Storage   | Cloudinary / AWS S3  |
| Deploy    | Railway / Render (API) + Vercel (frontend) |

---

## 6. FOLDER STRUCTURE

```
/backend
  /controllers    # talent, hirer, hiring, legal, agreement, etc.
  /routes         # auth, talent, hirer, hiring, legal, agreements, etc.
  /prisma         # schema.prisma, seed, migrations
  /middleware     # auth.ts, rbac.ts
  /services       # auditLog, email, currency
  /utils          # hash, jwt
  src/index.ts    # server entry

/frontend
  /app            # Next.js App Router (login, register, dashboard, hiring, partner, talent-marketplace)
  /components     # landing, dashboard
  /lib            # api.ts, cmsSections
  /dashboard      # role-based dashboards (talent, hirer, admin, legal)
  /marketplace    # talent marketplace (public)
```

---

## 7. DASHBOARD PERMISSIONS LOGIC

Each dashboard loads based on role (frontend redirect after login):

| Role           | Redirect / Dashboard        |
|----------------|-----------------------------|
| legal_team     | `/dashboard/legal`          |
| hr_manager     | `/dashboard/admin/hr`       |
| super_admin    | `/dashboard/admin`          |
| cofounder      | `/dashboard/admin` (same as admin) |
| talent         | `/dashboard/talent`         |
| hirer / hiring_company | `/dashboard/hirer`  |
| client         | `/dashboard`                |
| investor       | `/dashboard/investor`       |

Implemented in `frontend/src/app/login/page.tsx` and `frontend/src/app/dashboard/layout.tsx`.

---

## 8. AGREEMENT SECURITY FLOW

1. Company drafts contract (create Agreement + AssignedAgreement or link to Hire)  
2. Talent reviews (view assigned agreement)  
3. Both sign digitally (signature + timestamp + IP in AgreementAuditLog)  
4. Stored permanently (AssignedAgreement.status = Signed, signedAt set)  
5. Legal team monitors (GET /api/v1/legal/agreements, GET /api/v1/legal/disputes)  
6. All signatures time-stamped (signedAt, auditLogs)

---

## Result

**Upwork + LinkedIn + HR System + Legal Contract Protection** — controlled and moderated.

Next stages: API controller logic details, UI dashboard layout, Stripe webhook code, authentication system code.
