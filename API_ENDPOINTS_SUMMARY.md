# RiseFlow Hub - Complete API Endpoints Summary

**Base URL:** `/api/v1` (unless otherwise specified)

**Authentication:** Bearer JWT in header: `Authorization: Bearer <token>`

**Last Updated:** February 20, 2026

---

## Health & Status

| Method | Endpoint                  | Purpose                          | Auth          |
| ------ | ------------------------- | -------------------------------- | ------------- |
| GET    | `/health`                 | Lightweight health check         | Public        |
| GET    | `/api/v1/health`          | API health check                 | Public        |
| POST   | `/api/v1/monitor/alert`   | Webhook for monitoring alerts    | Bearer Secret |
| GET    | `/api/v1/paystack/status` | Check Paystack connection status | Public        |
| GET    | `/api/ai-test`            | Test AI Gateway connectivity     | Public        |

---

## Authentication (`/api/v1/auth`)

| Method | Endpoint         | Purpose                | Auth   |
| ------ | ---------------- | ---------------------- | ------ |
| POST   | `/auth/signup`   | Create account         | Public |
| POST   | `/auth/register` | Create account (alias) | Public |
| POST   | `/auth/login`    | Login, returns JWT     | Public |
| GET    | `/auth/me`       | Get current user       | JWT    |
| POST   | `/auth/logout`   | Logout                 | JWT    |

---

## Users (`/api/v1/users`)

| Method | Endpoint             | Purpose                                              | Auth                |
| ------ | -------------------- | ---------------------------------------------------- | ------------------- |
| GET    | `/users/me`          | Get logged-in user profile                           | JWT                 |
| GET    | `/users/me/features` | Get user feature flags                               | JWT                 |
| PATCH  | `/users/me`          | Update own profile                                   | JWT                 |
| GET    | `/users`             | List users (optional `?role=` and `?accountStatus=`) | Admin               |
| GET    | `/users/:id`         | Get user by ID                                       | Self or Admin       |
| PUT    | `/users/:id`         | Update user                                          | Self or Super Admin |

`/users` and `/users/:id` include latest account-status metadata fields:
`accountStatus`, `accountStatusReason`, `accountStatusAt`.

---

## Clients (`/api/v1/clients`)

| Method | Endpoint       | Purpose               | Auth          |
| ------ | -------------- | --------------------- | ------------- |
| POST   | `/clients`     | Create client profile | Admin/PM      |
| GET    | `/clients`     | List all clients      | Admin         |
| GET    | `/clients/:id` | Get client            | Self or Admin |
| PUT    | `/clients/:id` | Update client         | Self or Admin |

---

## Projects (`/api/v1/projects`)

| Method | Endpoint                   | Purpose                    | Auth     |
| ------ | -------------------------- | -------------------------- | -------- |
| POST   | `/projects`                | Create project             | Admin/PM |
| GET    | `/projects`                | List projects (role-based) | JWT      |
| GET    | `/projects/:id`            | Get project details        | JWT      |
| PUT    | `/projects/:id`            | Update project             | Admin/PM |
| DELETE | `/projects/:id`            | Delete project             | Admin/PM |
| GET    | `/projects/:id/milestones` | List project milestones    | JWT      |
| GET    | `/projects/:id/messages`   | List project messages      | JWT      |
| POST   | `/projects/:id/messages`   | Send message to project    | JWT      |

---

## Tasks (`/api/v1/projects/:id/tasks` & `/api/v1/tasks`)

| Method | Endpoint                      | Purpose                | Auth              |
| ------ | ----------------------------- | ---------------------- | ----------------- |
| POST   | `/projects/:id/tasks`         | Create task            | Admin/PM          |
| GET    | `/projects/:id/tasks`         | List tasks for project | JWT               |
| PUT    | `/projects/:id/tasks/:taskId` | Update task            | Admin/PM/Assigned |
| DELETE | `/projects/:id/tasks/:taskId` | Delete task            | Admin/PM          |
| GET    | `/tasks`                      | List all tasks (admin) | Admin             |
| GET    | `/tasks/me`                   | List my assigned tasks | JWT               |

---

## Agreements (`/api/v1/agreements`)

| Method | Endpoint                  | Purpose                        | Auth                   |
| ------ | ------------------------- | ------------------------------ | ---------------------- |
| POST   | `/agreements`             | Create agreement template      | Super Admin            |
| GET    | `/agreements`             | List all templates             | Super Admin/PM/Finance |
| GET    | `/agreements/assigned`    | List agreements assigned to me | JWT                    |
| GET    | `/agreements/assignments` | List all assignments (admin)   | Super Admin/PM/Finance |
| GET    | `/agreements/:id`         | Get agreement details          | Super Admin/PM/Finance |
| PUT    | `/agreements/:id`         | Update template                | Super Admin            |
| DELETE | `/agreements/:id`         | Delete template                | Super Admin            |
| POST   | `/agreements/:id/assign`  | Assign agreement to user(s)    | Super Admin            |
| GET    | `/agreements/:id/view`    | View agreement (logs view)     | Assigned User          |
| POST   | `/agreements/:id/sign`    | Sign agreement                 | Assigned User          |
| GET    | `/agreements/:id/status`  | Assignment status              | Super Admin/PM/Finance |
| GET    | `/agreements/:id/logs`    | Audit logs                     | Super Admin            |

---

## Milestones (`/api/v1/milestones`)

| Method | Endpoint          | Purpose          | Auth  |
| ------ | ----------------- | ---------------- | ----- |
| PUT    | `/milestones/:id` | Update milestone | JWT   |
| DELETE | `/milestones/:id` | Delete milestone | Admin |

---

## AI & Startup Mentor (`/api/v1/ai`)

| Method | Endpoint                 | Purpose                            | Auth |
| ------ | ------------------------ | ---------------------------------- | ---- |
| POST   | `/ai/startup-cofounder`  | Cofounder fit & role suggestions   | JWT  |
| POST   | `/ai/business-plan`      | Generate business plan sections    | JWT  |
| POST   | `/ai/market-analysis`    | Market size, trends, competitors   | JWT  |
| POST   | `/ai/risk-analysis`      | Risk analysis & investor readiness | JWT  |
| POST   | `/ai/idea-chat`          | Idea validation chat               | JWT  |
| POST   | `/ai/smart-milestones`   | Suggested milestones               | JWT  |
| POST   | `/ai/idea-clarify`       | Clarify idea                       | JWT  |
| POST   | `/ai/business-model`     | Business model suggestions         | JWT  |
| POST   | `/ai/roadmap`            | Product roadmap                    | JWT  |
| POST   | `/ai/pricing`            | Pricing strategy                   | JWT  |
| POST   | `/ai/marketing`          | Marketing strategy                 | JWT  |
| POST   | `/ai/pitch`              | Pitch deck content                 | JWT  |
| POST   | `/ai/full-business-plan` | Complete business plan             | JWT  |
| GET    | `/ai/conversations`      | List AI conversations              | JWT  |
| POST   | `/ai/conversations`      | Create AI conversation             | JWT  |
| GET    | `/ai/outputs`            | List AI outputs                    | JWT  |

---

## Payments (`/api/v1/payments`)

| Method | Endpoint                          | Purpose               | Auth |
| ------ | --------------------------------- | --------------------- | ---- |
| POST   | `/payments`                       | Create payment        | JWT  |
| POST   | `/payments/stripe/create-session` | Create Stripe session | JWT  |
| GET    | `/payments`                       | List payments         | JWT  |

---

## Notifications (`/api/v1/notifications`)

| Method | Endpoint                       | Purpose                 | Auth  |
| ------ | ------------------------------ | ----------------------- | ----- |
| GET    | `/notifications`               | List notifications      | JWT   |
| POST   | `/notifications/send`          | Send notification       | Admin |
| POST   | `/notifications/email`         | Send email notification | Admin |
| PATCH  | `/notifications/:id/read`      | Mark as read            | JWT   |
| POST   | `/notifications/mark-all-read` | Mark all as read        | JWT   |

---

## Investors (`/api/v1/investors`)

| Method | Endpoint         | Purpose                 | Auth           |
| ------ | ---------------- | ----------------------- | -------------- |
| GET    | `/investors`     | List investors          | JWT            |
| GET    | `/investors/me`  | Get my investor profile | JWT (Investor) |
| POST   | `/investors`     | Create investor profile | JWT            |
| PUT    | `/investors/:id` | Update investor profile | Self or Admin  |

---

## Startups (`/api/v1/startups`)

| Method | Endpoint                          | Purpose             | Auth           |
| ------ | --------------------------------- | ------------------- | -------------- |
| GET    | `/startups`                       | List all startups   | JWT            |
| GET    | `/startups/me`                    | List my startups    | JWT            |
| POST   | `/startups`                       | Create startup      | JWT            |
| GET    | `/startups/marketplace`           | Public marketplace  | Public         |
| GET    | `/startups/:id`                   | Get startup details | Public         |
| GET    | `/startups/:id/score`             | Get startup score   | JWT            |
| POST   | `/startups/:id/score/recalculate` | Recalculate score   | JWT            |
| PUT    | `/startups/:id`                   | Update startup      | Owner or Admin |

---

## Investments (`/api/v1/investments`)

| Method | Endpoint           | Purpose           | Auth           |
| ------ | ------------------ | ----------------- | -------------- |
| GET    | `/investments`     | List investments  | JWT            |
| POST   | `/investments`     | Create investment | JWT (Investor) |
| GET    | `/investments/:id` | Get investment    | JWT            |
| PUT    | `/investments/:id` | Update investment | Owner or Admin |

---

## Campaigns (`/api/v1/campaigns`)

| Method | Endpoint         | Purpose         | Auth  |
| ------ | ---------------- | --------------- | ----- |
| GET    | `/campaigns`     | List campaigns  | JWT   |
| POST   | `/campaigns`     | Create campaign | Admin |
| GET    | `/campaigns/:id` | Get campaign    | JWT   |
| PUT    | `/campaigns/:id` | Update campaign | Admin |

---

## Leads (`/api/v1/leads`)

| Method | Endpoint     | Purpose     | Auth   |
| ------ | ------------ | ----------- | ------ |
| GET    | `/leads`     | List leads  | Admin  |
| POST   | `/leads`     | Create lead | Public |
| GET    | `/leads/:id` | Get lead    | Admin  |
| PUT    | `/leads/:id` | Update lead | Admin  |

---

## Admin Leads (`/api/v1/admin/leads`)

| Method | Endpoint           | Purpose            | Auth  |
| ------ | ------------------ | ------------------ | ----- |
| GET    | `/admin/leads`     | List all leads     | Admin |
| PUT    | `/admin/leads/:id` | Update lead status | Admin |

---

## Analytics (`/api/v1/analytics`)

| Method | Endpoint     | Purpose            | Auth  |
| ------ | ------------ | ------------------ | ----- |
| GET    | `/analytics` | Get analytics data | Admin |

---

## Tenants (`/api/v1/tenants`)

| Method | Endpoint               | Purpose               | Auth        |
| ------ | ---------------------- | --------------------- | ----------- |
| GET    | `/tenants/current`     | Get current tenant    | JWT         |
| GET    | `/tenants`             | List all tenants      | Super Admin |
| POST   | `/tenants`             | Create tenant         | Super Admin |
| PATCH  | `/tenants/:id`         | Update tenant         | Super Admin |
| GET    | `/tenants/:id/billing` | Get tenant billing    | Super Admin |
| POST   | `/tenants/:id/billing` | Update tenant billing | Super Admin |

---

## Idea Submissions (`/api/v1/idea-submissions`)

| Method | Endpoint                | Purpose           | Auth   |
| ------ | ----------------------- | ----------------- | ------ |
| GET    | `/idea-submissions`     | List submissions  | Admin  |
| POST   | `/idea-submissions`     | Submit idea       | Public |
| GET    | `/idea-submissions/:id` | Get submission    | Admin  |
| PUT    | `/idea-submissions/:id` | Update submission | Admin  |

---

## Consultations (`/api/v1/consultations`)

| Method | Endpoint             | Purpose             | Auth   |
| ------ | -------------------- | ------------------- | ------ |
| GET    | `/consultations`     | List consultations  | JWT    |
| POST   | `/consultations`     | Book consultation   | Public |
| GET    | `/consultations/:id` | Get consultation    | JWT    |
| PUT    | `/consultations/:id` | Update consultation | Admin  |

---

## Contact (`/api/v1/contact`)

| Method | Endpoint   | Purpose              | Auth   |
| ------ | ---------- | -------------------- | ------ |
| POST   | `/contact` | Send contact message | Public |

---

## Setup Fee (`/api/v1/setup-fee`)

| Method | Endpoint                    | Purpose                | Auth          |
| ------ | --------------------------- | ---------------------- | ------------- |
| GET    | `/setup-fee/config`         | Get setup fee config   | Public        |
| GET    | `/setup-fee/quote`          | Get quote              | Optional Auth |
| POST   | `/setup-fee/create-session` | Create payment session | JWT           |
| POST   | `/setup-fee/verify`         | Verify payment         | JWT           |
| PUT    | `/setup-fee/config`         | Update config          | Super Admin   |

---

## Super Admin (`/api/v1/super-admin`)

| Method | Endpoint                                     | Purpose                                   | Auth                      |
| ------ | -------------------------------------------- | ----------------------------------------- | ------------------------- |
| GET    | `/super-admin/overview`                      | Dashboard overview                        | Super Admin               |
| GET    | `/super-admin/system-health`                 | System health check                       | Super Admin               |
| GET    | `/super-admin/payments`                      | Payment overview                          | Super Admin               |
| GET    | `/super-admin/activity`                      | Activity logs                             | Super Admin               |
| GET    | `/super-admin/audit-logs`                    | Audit logs                                | Super Admin               |
| GET    | `/super-admin/reports`                       | Reports                                   | Super Admin               |
| GET    | `/super-admin/consultations`                 | Consultations list                        | Super Admin               |
| GET    | `/super-admin/users/account-status`          | List users by latest account status       | Super Admin               |
| POST   | `/super-admin/users/:userId/pause`           | Pause user account (reversible)           | Super Admin               |
| POST   | `/super-admin/users/:userId/resume`          | Resume paused/blocked account             | Super Admin               |
| DELETE | `/super-admin/users/:userId/permanent`       | Permanently delete account (irreversible) | Super Admin               |
| GET    | `/super-admin/messages`                      | Admin messages                            | Super Admin               |
| PATCH  | `/super-admin/messages/:id`                  | Update message status                     | Super Admin               |
| GET    | `/super-admin/users/:userId/features`        | Get user features                         | Super Admin               |
| GET    | `/super-admin/email-logs`                    | Email logs                                | Super Admin               |
| POST   | `/super-admin/email-logs/:id/resend`         | Resend email                              | Super Admin               |
| GET    | `/super-admin/skills`                        | List skills                               | Super Admin               |
| POST   | `/super-admin/skills`                        | Create skill                              | Super Admin               |
| PUT    | `/super-admin/skills/:id`                    | Update skill                              | Super Admin               |
| DELETE | `/super-admin/skills/:id`                    | Delete skill                              | Super Admin               |
| GET    | `/super-admin/equity/company`                | List equity companies                     | Super Admin               |
| POST   | `/super-admin/equity/company`                | Create equity company                     | Super Admin               |
| PUT    | `/super-admin/equity/company/:id`            | Update equity company                     | Super Admin               |
| DELETE | `/super-admin/equity/company/:id`            | Delete equity company                     | Super Admin               |
| GET    | `/super-admin/equity/startup/:startupId`     | List startup equity                       | Super Admin               |
| POST   | `/super-admin/equity/startup/:startupId`     | Create startup equity                     | Super Admin               |
| PUT    | `/super-admin/equity/startup/:startupId/:id` | Update startup equity                     | Super Admin               |
| DELETE | `/super-admin/equity/startup/:startupId/:id` | Delete startup equity                     | Super Admin               |
| GET    | `/super-admin/business/:startupId`           | Business module overview                  | Super Admin               |
| GET    | `/super-admin/finance/summary`               | Finance summary                           | Super Admin/Finance Admin |
| GET    | `/super-admin/finance/tax-summary`           | Tax summary                               | Super Admin/Finance Admin |

---

## Security Admin (`/api/v1/super-admin/security`)

| Method | Endpoint                                | Purpose           | Auth           |
| ------ | --------------------------------------- | ----------------- | -------------- |
| GET    | `/super-admin/security/overview`        | Security overview | Security Admin |
| GET    | `/super-admin/security/events`          | Security events   | Security Admin |
| GET    | `/super-admin/security/blocked-ips`     | List blocked IPs  | Security Admin |
| DELETE | `/super-admin/security/blocked-ips/:id` | Unblock IP        | Security Admin |

---

## Manual Payments Admin (`/api/v1/super-admin/manual-payments`)

| Method | Endpoint                                   | Purpose              | Auth        |
| ------ | ------------------------------------------ | -------------------- | ----------- |
| GET    | `/super-admin/manual-payments`             | List manual payments | Super Admin |
| POST   | `/super-admin/manual-payments/:id/confirm` | Confirm payment      | Super Admin |
| POST   | `/super-admin/manual-payments/:id/reject`  | Reject payment       | Super Admin |

---

## Finance (`/api/v1/super-admin/finance`)

| Method | Endpoint                           | Purpose         | Auth                      |
| ------ | ---------------------------------- | --------------- | ------------------------- |
| GET    | `/super-admin/finance/summary`     | Finance summary | Super Admin/Finance Admin |
| GET    | `/super-admin/finance/tax-summary` | Tax summary     | Super Admin/Finance Admin |

---

## Team (`/api/v1/team`)

| Method | Endpoint              | Purpose            | Auth        |
| ------ | --------------------- | ------------------ | ----------- |
| GET    | `/team/invite/accept` | Get invite details | Public      |
| POST   | `/team/invite/accept` | Accept team invite | Public      |
| GET    | `/team`               | List team members  | Super Admin |
| POST   | `/team`               | Invite team member | Super Admin |
| GET    | `/team/roles`         | List custom roles  | Super Admin |
| POST   | `/team/roles`         | Create custom role | Super Admin |
| PATCH  | `/team/:userId`       | Update team member | Super Admin |
| DELETE | `/team/:userId`       | Remove team member | Super Admin |

---

## Workspace (`/api/v1/workspace`)

| Method | Endpoint                                   | Purpose                | Auth |
| ------ | ------------------------------------------ | ---------------------- | ---- |
| GET    | `/workspace/:projectId`                    | Get workspace          | JWT  |
| PATCH  | `/workspace/:projectId`                    | Update workspace       | JWT  |
| GET    | `/workspace/:projectId/idea-vault`         | List idea vault items  | JWT  |
| POST   | `/workspace/:projectId/idea-vault`         | Add idea vault item    | JWT  |
| PATCH  | `/workspace/:projectId/idea-vault/:itemId` | Update idea vault item | JWT  |
| DELETE | `/workspace/:projectId/idea-vault/:itemId` | Delete idea vault item | JWT  |
| GET    | `/workspace/:projectId/business-model`     | Get business model     | JWT  |
| PATCH  | `/workspace/:projectId/business-model`     | Update business model  | JWT  |
| GET    | `/workspace/:projectId/team`               | List project team      | JWT  |
| POST   | `/workspace/:projectId/team`               | Add team member        | JWT  |
| DELETE | `/workspace/:projectId/team/:userId`       | Remove team member     | JWT  |
| GET    | `/workspace/:projectId/files`              | List workspace files   | JWT  |
| GET    | `/workspace/:projectId/investor-view`      | Get investor view      | JWT  |
| GET    | `/workspace/:projectId/progress`           | Get progress           | JWT  |

---

## Deal Room (`/api/v1/deal-room`)

| Method | Endpoint                       | Purpose           | Auth           |
| ------ | ------------------------------ | ----------------- | -------------- |
| GET    | `/deal-room`                   | List deal rooms   | JWT (Investor) |
| GET    | `/deal-room/:startupId`        | Get deal room     | JWT (Investor) |
| POST   | `/deal-room/:startupId/invest` | Create investment | JWT (Investor) |

---

## CMS (`/api/v1/cms`)

| Method | Endpoint                          | Purpose                | Auth           |
| ------ | --------------------------------- | ---------------------- | -------------- |
| GET    | `/cms/:key`                       | Get CMS content by key | Public         |
| GET    | `/cms/page/:pageName`             | Get CMS page           | Public         |
| GET    | `/cms/revenue-system`             | Get revenue system     | Revenue Editor |
| PUT    | `/cms/revenue-system/draft`       | Save draft             | Revenue Editor |
| POST   | `/cms/revenue-system/publish`     | Publish                | Revenue Editor |
| GET    | `/cms/revenue-system/history`     | Get history            | Revenue Editor |
| POST   | `/cms/revenue-system/restore/:id` | Restore version        | Revenue Editor |
| POST   | `/cms/revenue-model-view`         | Track view             | Optional Auth  |
| POST   | `/cms`                            | Create CMS content     | Super Admin    |
| PUT    | `/cms/page/:pageName`             | Bulk update page       | Super Admin    |
| PUT    | `/cms/:key`                       | Update CMS content     | Super Admin    |
| DELETE | `/cms/:key`                       | Delete CMS content     | Super Admin    |

---

## Talent (`/api/v1/talent`)

| Method | Endpoint              | Purpose                   | Auth          |
| ------ | --------------------- | ------------------------- | ------------- |
| GET    | `/talent/marketplace` | Public talent marketplace | Public        |
| POST   | `/talent/apply`       | Apply as talent           | Optional Auth |
| GET    | `/talent/profile`     | Get my talent profile     | Talent        |
| PUT    | `/talent/profile`     | Update talent profile     | Talent        |
| GET    | `/talent`             | List talents              | Admin/HR      |
| PUT    | `/talent/:id/approve` | Approve talent            | Admin/HR      |
| PATCH  | `/talent/:id`         | Update talent visibility  | Admin         |

---

## Hirer (`/api/v1/hirer`)

| Method | Endpoint                     | Purpose              | Auth  |
| ------ | ---------------------------- | -------------------- | ----- |
| GET    | `/hirer`                     | Get hirer profile    | Hirer |
| PUT    | `/hirer`                     | Update hirer profile | Hirer |
| GET    | `/hirer/hires`               | List my hires        | Hirer |
| POST   | `/hirer/hire/:talentId`      | Hire talent          | Hirer |
| GET    | `/hirer/agreements`          | List agreements      | Hirer |
| POST   | `/hirer/sign-fair-treatment` | Sign fair treatment  | Hirer |
| POST   | `/hirer/pay-fee`             | Pay marketplace fee  | Hirer |
| GET    | `/hirer/payments`            | List payments        | Hirer |

---

## Hiring (`/api/v1/hiring`)

| Method | Endpoint      | Purpose                   | Auth   |
| ------ | ------------- | ------------------------- | ------ |
| GET    | `/hiring`     | List hiring opportunities | Public |
| POST   | `/hiring`     | Create hiring post        | Hirer  |
| GET    | `/hiring/:id` | Get hiring post           | Public |
| PUT    | `/hiring/:id` | Update hiring post        | Owner  |

---

## Ratings (`/api/v1/ratings`)

| Method | Endpoint   | Purpose       | Auth   |
| ------ | ---------- | ------------- | ------ |
| GET    | `/ratings` | List ratings  | Public |
| POST   | `/ratings` | Create rating | JWT    |

---

## Legal (`/api/v1/legal`)

| Method | Endpoint            | Purpose               | Auth       |
| ------ | ------------------- | --------------------- | ---------- |
| GET    | `/legal/agreements` | List legal agreements | Legal Team |

---

## Marketplace Fee (`/api/v1/marketplace-fee`)

| Method | Endpoint                          | Purpose                | Auth |
| ------ | --------------------------------- | ---------------------- | ---- |
| POST   | `/marketplace-fee/create-session` | Create payment session | JWT  |
| POST   | `/marketplace-fee/verify`         | Verify payment         | JWT  |

---

## Partner (`/api/v1/partner`)

| Method | Endpoint   | Purpose                    | Auth        |
| ------ | ---------- | -------------------------- | ----------- |
| POST   | `/partner` | Submit partner application | Public      |
| GET    | `/partner` | List partners              | Super Admin |

---

## Manual Payments (`/api/v1/manual-payments`)

| Method | Endpoint           | Purpose                       | Auth |
| ------ | ------------------ | ----------------------------- | ---- |
| POST   | `/manual-payments` | Create manual payment request | JWT  |

---

## Upload (`/api/v1/upload`)

| Method | Endpoint  | Purpose     | Auth |
| ------ | --------- | ----------- | ---- |
| POST   | `/upload` | Upload file | JWT  |

---

## Business (`/api/v1/business`)

| Method | Endpoint    | Purpose           | Auth |
| ------ | ----------- | ----------------- | ---- |
| GET    | `/business` | Get business data | JWT  |
| POST   | `/business` | Create business   | JWT  |

---

## FAQ (`/api/v1/faq`)

| Method | Endpoint   | Purpose    | Auth   |
| ------ | ---------- | ---------- | ------ |
| GET    | `/faq`     | List FAQs  | Public |
| POST   | `/faq`     | Create FAQ | Admin  |
| PUT    | `/faq/:id` | Update FAQ | Admin  |
| DELETE | `/faq/:id` | Delete FAQ | Admin  |

---

## Help AI (`/api/v1/help-ai`)

| Method | Endpoint   | Purpose              | Auth  |
| ------ | ---------- | -------------------- | ----- |
| GET    | `/help-ai` | Get help AI data     | JWT   |
| POST   | `/help-ai` | Create help AI entry | Admin |

---

## Tours (`/api/v1/tours`)

| Method | Endpoint                    | Purpose            | Auth |
| ------ | --------------------------- | ------------------ | ---- |
| GET    | `/tours/progress`           | Get tour progress  | JWT  |
| POST   | `/tours/:tourName/complete` | Mark tour complete | JWT  |

---

## Badges (`/api/v1/badges`)

| Method | Endpoint      | Purpose       | Auth        |
| ------ | ------------- | ------------- | ----------- |
| GET    | `/badges`     | List badges   | JWT         |
| GET    | `/badges/me`  | Get my badges | JWT         |
| POST   | `/badges`     | Create badge  | Super Admin |
| PUT    | `/badges/:id` | Update badge  | Super Admin |

---

## Settings (`/api/v1/settings`)

| Method | Endpoint                          | Purpose                      | Auth |
| ------ | --------------------------------- | ---------------------------- | ---- |
| GET    | `/settings/profile`               | Get profile settings         | JWT  |
| PUT    | `/settings/profile`               | Update profile               | JWT  |
| PUT    | `/settings/password`              | Change password              | JWT  |
| PUT    | `/settings/email`                 | Change email                 | JWT  |
| POST   | `/settings/email/verify`          | Verify email                 | JWT  |
| GET    | `/settings/security/sessions`     | List sessions                | JWT  |
| DELETE | `/settings/security/sessions/:id` | Revoke session               | JWT  |
| GET    | `/settings/notifications`         | Get notification settings    | JWT  |
| PUT    | `/settings/notifications`         | Update notification settings | JWT  |
| GET    | `/settings/preferences`           | Get preferences              | JWT  |
| PUT    | `/settings/preferences`           | Update preferences           | JWT  |
| GET    | `/settings/privacy`               | Get privacy settings         | JWT  |
| PUT    | `/settings/privacy`               | Update privacy settings      | JWT  |
| GET    | `/settings/billing`               | Get billing info             | JWT  |
| GET    | `/settings/data-export`           | Export user data             | JWT  |
| GET    | `/settings/account-status`        | Get account status           | JWT  |
| POST   | `/settings/delete-request`        | Request account deletion     | JWT  |
| POST   | `/settings/delete-cancel`         | Cancel deletion request      | JWT  |

---

## Founders (`/api/v1/founders`)

| Method | Endpoint                       | Purpose                  | Auth          |
| ------ | ------------------------------ | ------------------------ | ------------- |
| GET    | `/founders/me`                 | Get my founder profile   | JWT (Founder) |
| PUT    | `/founders/me`                 | Update founder profile   | JWT (Founder) |
| GET    | `/founders/me/reputation`      | Get reputation breakdown | JWT (Founder) |
| GET    | `/founders/:userId/reputation` | Get founder reputation   | Public        |

---

## Forum (`/api/v1/forum`)

| Method | Endpoint                         | Purpose           | Auth   |
| ------ | -------------------------------- | ----------------- | ------ |
| GET    | `/forum`                         | List forum posts  | Public |
| POST   | `/forum`                         | Create forum post | JWT    |
| GET    | `/forum/:id`                     | Get forum post    | Public |
| PUT    | `/forum/:id`                     | Update forum post | Owner  |
| DELETE | `/forum/:id`                     | Delete forum post | Owner  |
| POST   | `/forum/:id/comments`            | Add comment       | JWT    |
| PUT    | `/forum/:id/comments/:commentId` | Update comment    | Owner  |
| DELETE | `/forum/:id/comments/:commentId` | Delete comment    | Owner  |

---

## Early Access (`/api/v1/early-access`)

| Method | Endpoint            | Purpose                    | Auth   |
| ------ | ------------------- | -------------------------- | ------ |
| GET    | `/early-access`     | List early access requests | Admin  |
| POST   | `/early-access`     | Request early access       | Public |
| PUT    | `/early-access/:id` | Update request status      | Admin  |

---

## Social Links (`/api/v1/social-links`)

| Method | Endpoint                  | Purpose                  | Auth   |
| ------ | ------------------------- | ------------------------ | ------ |
| GET    | `/social-links`           | List public social links | Public |
| POST   | `/social-links/:id/click` | Track click              | Public |

---

## Social Links Admin (`/api/v1/super-admin/social-links`)

| Method | Endpoint                               | Purpose               | Auth        |
| ------ | -------------------------------------- | --------------------- | ----------- |
| GET    | `/super-admin/social-links`            | List all social links | Super Admin |
| POST   | `/super-admin/social-links`            | Create social link    | Super Admin |
| PUT    | `/super-admin/social-links/:id`        | Update social link    | Super Admin |
| DELETE | `/super-admin/social-links/:id`        | Delete social link    | Super Admin |
| PATCH  | `/super-admin/social-links/:id/toggle` | Toggle visibility     | Super Admin |

---

## Share Meta (`/api/v1/share-meta`)

| Method | Endpoint            | Purpose            | Auth   |
| ------ | ------------------- | ------------------ | ------ |
| GET    | `/share-meta/:page` | Get share metadata | Public |

---

## Share Meta Admin (`/api/v1/super-admin/share-meta`)

| Method | Endpoint                      | Purpose             | Auth        |
| ------ | ----------------------------- | ------------------- | ----------- |
| GET    | `/super-admin/share-meta`     | List all share meta | Super Admin |
| POST   | `/super-admin/share-meta`     | Create share meta   | Super Admin |
| PUT    | `/super-admin/share-meta/:id` | Update share meta   | Super Admin |
| DELETE | `/super-admin/share-meta/:id` | Delete share meta   | Super Admin |

---

## Birthday Wishes (`/api/v1/super-admin/birthday-wishes`)

| Method | Endpoint                           | Purpose              | Auth        |
| ------ | ---------------------------------- | -------------------- | ----------- |
| GET    | `/super-admin/birthday-wishes`     | List birthday wishes | Super Admin |
| POST   | `/super-admin/birthday-wishes`     | Create birthday wish | Super Admin |
| PUT    | `/super-admin/birthday-wishes/:id` | Update birthday wish | Super Admin |
| DELETE | `/super-admin/birthday-wishes/:id` | Delete birthday wish | Super Admin |

---

## Support Banner (`/api/v1/support-banner`)

| Method | Endpoint                 | Purpose                  | Auth   |
| ------ | ------------------------ | ------------------------ | ------ |
| POST   | `/support-banner/events` | Log support banner event | Public |

---

## Job Requests (`/api/v1/job-requests`)

| Method | Endpoint            | Purpose            | Auth   |
| ------ | ------------------- | ------------------ | ------ |
| GET    | `/job-requests`     | List job requests  | Admin  |
| POST   | `/job-requests`     | Create job request | Public |
| GET    | `/job-requests/:id` | Get job request    | Public |
| PUT    | `/job-requests/:id` | Update job request | Admin  |

---

## Webhooks (`/api/v1/webhooks`)

| Method | Endpoint             | Purpose          | Auth               |
| ------ | -------------------- | ---------------- | ------------------ |
| POST   | `/webhooks/stripe`   | Stripe webhook   | Stripe Signature   |
| POST   | `/webhooks/paystack` | Paystack webhook | Paystack Signature |

---

## Open APIs (No Version Prefix)

### OpenAI Free (`/api/openai/free`)

| Method | Endpoint                     | Purpose                 | Auth   |
| ------ | ---------------------------- | ----------------------- | ------ |
| POST   | `/api/openai/free/chat`      | Free OpenAI chat        | Public |
| POST   | `/api/openai/free/summarize` | Free text summarization | Public |

### Chat Free (`/api/chat/free`)

| Method | Endpoint         | Purpose       | Auth   |
| ------ | ---------------- | ------------- | ------ |
| POST   | `/api/chat/free` | Free chat API | Public |

### Translate (`/api/translate`)

| Method | Endpoint         | Purpose        | Auth   |
| ------ | ---------------- | -------------- | ------ |
| POST   | `/api/translate` | Translate text | Public |

### Currency (`/api/currency`)

| Method | Endpoint                | Purpose            | Auth   |
| ------ | ----------------------- | ------------------ | ------ |
| GET    | `/api/currency`         | Get currency rates | Public |
| GET    | `/api/currency/convert` | Convert currency   | Public |

### Embeddings (`/api/embeddings`)

| Method | Endpoint          | Purpose             | Auth   |
| ------ | ----------------- | ------------------- | ------ |
| POST   | `/api/embeddings` | Generate embeddings | Public |

### Images (`/api/images`)

| Method | Endpoint             | Purpose         | Auth   |
| ------ | -------------------- | --------------- | ------ |
| GET    | `/api/images/avatar` | Generate avatar | Public |

### Public Data (`/api/public-data`)

| Method | Endpoint                     | Purpose            | Auth   |
| ------ | ---------------------------- | ------------------ | ------ |
| GET    | `/api/public-data/wikipedia` | Get Wikipedia data | Public |

### SEO (`/api/seo`)

| Method | Endpoint        | Purpose          | Auth   |
| ------ | --------------- | ---------------- | ------ |
| GET    | `/api/seo/meta` | Get SEO metadata | Public |

---

## Notes

- **JWT**: Requires valid JWT token in `Authorization: Bearer <token>` header
- **Admin**: Requires `super_admin`, `project_manager`, or `finance_admin` role
- **Super Admin**: Requires `super_admin` role
- **Public**: No authentication required
- **Optional Auth**: Works with or without authentication
- **Self**: User can only access their own resources
- **Owner**: User must own the resource

---

**Total Endpoints:** ~300+ endpoints across all modules

**Last Checked:** February 17, 2026
