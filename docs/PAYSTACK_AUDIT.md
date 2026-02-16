# Paystack Integration Audit & Test

Full technical and transaction-flow audit for RiseFlow Hub Paystack integration.

---

## 1. Environment configuration

### Required backend variables

| Variable | Purpose | Exposed to frontend? |
|----------|---------|----------------------|
| `PAYSTACK_SECRET_KEY` | Server-side: initialize, verify, webhook signature | No |
| `PAYSTACK_PUBLIC_KEY` | Shown via `/api/v1/setup-fee/config` for client-only flows | Yes (via API only) |

**Important:** The backend reads **`PAYSTACK_SECRET_KEY`** and **`PAYSTACK_PUBLIC_KEY`** only.  
If you use **`Live_Secret_Key`** / **`Live_Public_Key`** on Render, Paystack will not be enabled. Rename them to `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`.

- **Paystack** does not use a separate `PAYSTACK_WEBHOOK_SECRET`; the **secret key** is used to verify `x-paystack-signature` (HMAC SHA512 of raw body).
- **BASE_URL** is not required; callback URLs are built from **`FRONTEND_URL`** (success/cancel) and backend base is implicit for the webhook URL.

### Verification

- **Local:** Run `node backend/scripts/check-paystack.js` (checks `.env` and optionally Paystack API).
- **Production:** `GET https://<your-backend>/api/v1/paystack/status`  
  Returns `{ connected, enabled, publicKeySet, message }`.

---

## 2. Payment initialization

### Backend route

- **POST** `/api/v1/setup-fee/create-session` (auth required)
- **POST** `/api/v1/marketplace-fee/create-session` (auth required, talent/hirer fees)

Flow (setup fee):

1. Server gets **amount from config** (pricing.ts: `IDEA_STARTER_SETUP_FEE_USD` / `INVESTOR_SETUP_FEE_USD`) and converts to user’s currency — **amount is not taken from frontend**.
2. Creates **UserPayment** (pending) with `reference = setup_<userId>_<timestamp>`.
3. Calls **Paystack** `https://api.paystack.co/transaction/initialize` with:
   - `email`, `amount` (in kobo/cents), `reference`, `callback_url`, `metadata` (type, userId), `currency`.
4. Returns:
   - `checkoutUrl` (Paystack authorization URL)
   - `sessionId` (reference)
   - `amount`, `currency`, `amountUsd`, `gateway: 'paystack'`

### Frontend

- **Setup fee:** `SetupModal` calls `api.setupFee.createSession({ currency })`, then `window.location.href = session.checkoutUrl` → user is sent to Paystack checkout.
- **Marketplace fee:** `dashboard/talent/pay-fee` and `dashboard/hirer/pay-fee` call create-session and redirect to `checkoutUrl`.

**Check:** Click “Pay Setup Fee” → user must be redirected to Paystack hosted page.

---

## 3. Webhook verification

### Route

- **POST** `/api/v1/webhooks/paystack`  
  **Body:** raw (Buffer). **Content-Type:** application/json.  
  **Middleware:** `express.raw({ type: 'application/json' })` so signature can be verified.

### Checks

| Check | Status |
|-------|--------|
| Signature validation | Yes — `x-paystack-signature` verified via `verifyWebhookSignature(rawBody, signature)` (HMAC SHA512 with secret key). |
| Event handled | `charge.success` only; other events return `{ received: true }`. |
| Reference | Taken from `payload.data.reference`. |
| Server-side verification | Transaction is re-verified with Paystack: `verifyTransaction(reference)` before updating DB. |
| No direct “success” override | Success is only applied after webhook signature + Paystack verify; no public “mark paid” endpoint that trusts client. |

### On success

1. Find **UserPayment** by `reference` and `status: 'pending'`.
2. **applyPaymentSuccess:**
   - `UserPayment`: `status = 'completed'`, `completedAt = now`, `metadata` updated (paystackReference, paystackAmount, paystackCurrency).
   - **setup_fee:** `User.setupPaid = true`.
   - **talent_marketplace_fee:** `Talent.feePaid = true`.
   - **hirer_platform_fee:** `Hirer.feePaid = true`, `Hirer.verified = true`.
   - Audit log, in-app notification, and **payment_confirmation** email.

---

## 4. Database recording

### Table: `UserPayment`

| Field | Example / notes |
|-------|------------------|
| id | UUID |
| userId | User UUID |
| amount | 700 (decimal, main unit e.g. NGN) |
| currency | NGN, USD, etc. |
| type | setup_fee, talent_marketplace_fee, hirer_platform_fee |
| status | pending → completed (or failed) |
| reference | e.g. setup_&lt;userId&gt;_&lt;ts&gt; (unique) |
| metadata | gateway, accessCode, paystackReference, paystackAmount, paystackCurrency, completedAt |
| createdAt | timestamp |
| completedAt | set when webhook succeeds |

Paystack amount is stored in metadata (paystackAmount/paystackCurrency); the main `amount` is set at create-session from server-side pricing.

---

## 5. Live flow test checklist

| Step | Action | Expected |
|------|--------|----------|
| 1 | Click “Pay Setup Fee” (or equivalent) | Redirect to Paystack checkout. |
| 2 | Complete payment on Paystack | Redirect back to `FRONTEND_URL/dashboard?setup_success=1&ref=...`. |
| 3 | Dashboard | Unlocked (no setup gate); user has full access. |
| 4 | Super Admin → Payments | Payment appears with status, user, amount, date. |
| 5 | User email | Payment confirmation email received. |
| 6 | Browser console | No “Failed to fetch” or CORS errors. |

---

## 6. “Failed to fetch” / 502

If the frontend shows “Failed to fetch” or 502 when creating a session or calling the API:

| Check | What to do |
|-------|------------|
| API base URL | Vercel: `NEXT_PUBLIC_API_URL` = backend URL (e.g. `https://riseflowhub-v1-0-1.onrender.com`). Redeploy frontend (clear cache). |
| CORS | Backend allows `FRONTEND_URL` and `*.vercel.app`. Set `FRONTEND_URL` on Render to your Vercel URL. |
| HTTPS | Frontend and backend both HTTPS in production. |
| Backend route | Backend deployed and `/api/v1/setup-fee/create-session` exists (POST). |
| Backend cold start | On some hosts the first request after a long idle can 502; wait ~60s and retry or wake with `GET /api/v1/health`. |

---

## 7. Security summary

| Item | Status |
|------|--------|
| Webhook verifies Paystack signature (HMAC SHA512) | Yes |
| Amount from server (pricing config + currency conversion) | Yes, not from frontend |
| Reference generated server-side | Yes |
| Transaction verified with Paystack API before marking paid | Yes |
| No public “mark payment success” without webhook + verify | Yes |
| Public key only exposed via API (setup-fee/config) | Yes |

---

## 8. Admin dashboard

- **GET** `/api/v1/super-admin/payments` (Super Admin auth)  
  Returns UserPayment (and project payments) with user, type, amount, currency, status, date. Supports `period`, `userId`, `paymentType`, and export as JSON/CSV/PDF.

Frontend: Super Admin → Payments (or equivalent) should list all Paystack (and other) user payments with status, user, amount, date.

---

## 9. Quick reference

| What | Where |
|------|--------|
| Initialize (setup fee) | POST /api/v1/setup-fee/create-session |
| Initialize (marketplace fee) | POST /api/v1/marketplace-fee/create-session |
| Webhook | POST /api/v1/webhooks/paystack (raw body) |
| Paystack status | GET /api/v1/paystack/status |
| Config + public key | GET /api/v1/setup-fee/config |
| Admin payments | GET /api/v1/super-admin/payments |

**Paystack Dashboard:** Set webhook URL to `https://<your-backend>/api/v1/webhooks/paystack` (e.g. `https://riseflowhub-v1-0-1.onrender.com/api/v1/webhooks/paystack`).

---

## 10. Final checklist

- [ ] Render (or host) env has **PAYSTACK_SECRET_KEY** and **PAYSTACK_PUBLIC_KEY** (not Live_Secret_Key / Live_Public_Key).
- [ ] Paystack Dashboard webhook URL points to your backend `/api/v1/webhooks/paystack`.
- [ ] Vercel has **NEXT_PUBLIC_API_URL**; Render has **FRONTEND_URL**; both redeployed after changes.
- [ ] Test: Pay Setup Fee → Paystack → redirect back → dashboard unlocked, payment in admin, email received.
- [ ] No “Failed to fetch” or CORS errors when creating session or loading config.

When all above are true, the system accepts payments, confirms via webhook, unlocks user features, logs the transaction, sends a receipt, and shows payments in the admin panel.
