# Health Check & Keep-Alive (RiseFlow Hub Backend)

Keep the backend warm, monitor uptime, and get alerts when it’s down.

---

## Part 1 — Health endpoints

| Endpoint | Auth | Purpose |
|----------|------|--------|
| `GET /health` | No | Lightweight check for Render / UptimeRobot (target &lt;50ms, no DB) |
| `GET /api/v1/health` | No | Same idea; use either for monitoring |

**Example response:**
```json
{
  "status": "ok",
  "service": "RiseFlow Hub API",
  "timestamp": "2025-02-09T12:00:00.000Z"
}
```

Use **one** of these URLs in UptimeRobot / cron-job.org (replace with your backend URL):

- `https://riseflowhub-v1-0-1.onrender.com/health`
- `https://riseflowhub-v1-0-1.onrender.com/api/v1/health`

---

## Part 2 — Uptime monitoring (external)

1. **UptimeRobot** (https://uptimerobot.com) or **cron-job.org** (https://cron-job.org)
2. Add a **HTTP(s) monitor**:
   - **URL:** `https://YOUR-BACKEND-URL.onrender.com/health`
   - **Interval:** 5 minutes
3. **Alerts:**
   - Email when down
   - Optional: **Webhook** → `POST https://YOUR-BACKEND-URL.onrender.com/api/v1/monitor/alert`  
     Body (JSON): `{ "message": "UptimeRobot: service down" }`  
     Header (if you set `MONITOR_ALERT_SECRET`): `Authorization: Bearer YOUR_SECRET`

---

## Part 3 — Keep-alive cron (inside the app)

The backend pings **its own** `/health` every 5 minutes so the instance stays warm.

**Required on Render (Environment):**

| Variable | Example | Purpose |
|----------|---------|--------|
| `SELF_URL` or `BACKEND_PUBLIC_URL` | `https://riseflowhub-v1-0-1.onrender.com` | URL the app uses to ping itself |

Optional:

| Variable | Default | Purpose |
|----------|---------|--------|
| `KEEPALIVE_CRON` | `*/5 * * * *` | Cron schedule (every 5 min) |

If `SELF_URL` / `BACKEND_PUBLIC_URL` is not set, the keep-alive job does **not** run (no self-ping).

---

## Part 4 — Downtime alert webhook

When your monitor (e.g. UptimeRobot) detects downtime, it can call:

**`POST /api/v1/monitor/alert`**

- **Body (JSON):** `{ "message": "Optional description" }`  
  Also accepted: `alertMessage`, `text`
- **Optional auth:** If `MONITOR_ALERT_SECRET` is set on Render, send header:  
  `Authorization: Bearer YOUR_MONITOR_ALERT_SECRET`

The backend sends a **critical security alert** email to `ADMIN_EMAIL`.

**Required on Render:**

| Variable | Example | Purpose |
|----------|---------|--------|
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Where downtime alerts are sent |

**UptimeRobot webhook example:**

- Alert type: Webhook
- URL: `https://riseflowhub-v1-0-1.onrender.com/api/v1/monitor/alert`
- Method: POST
- Body (JSON): `{ "message": "UptimeRobot: RiseFlow Hub API is down" }`
- If you use a secret: Custom header `Authorization: Bearer YOUR_MONITOR_ALERT_SECRET`

---

## Part 5 — Cold start / reliability

- **DB:** Use a **pooled** Postgres URL (e.g. Supabase pooler, port 6543) so connections are reused.
- **Build:** Production uses `pnpm run build` → `node dist/index.js` (no dev watcher).
- **Health:** `/health` does no DB or heavy work so it responds quickly.

---

## Summary checklist

- [ ] On **Render** → Environment: set `SELF_URL` (or `BACKEND_PUBLIC_URL`) to your backend URL.
- [ ] On **Render**: set `ADMIN_EMAIL` for downtime alerts.
- [ ] Optional: set `MONITOR_ALERT_SECRET` and use it in your monitor’s webhook.
- [ ] In **UptimeRobot** (or similar): add monitor for `https://YOUR-BACKEND/health` every 5 minutes.
- [ ] In **UptimeRobot**: add Webhook alert → `POST /api/v1/monitor/alert` with optional `Authorization: Bearer MONITOR_ALERT_SECRET`.
- [ ] Redeploy backend after changing env vars.

After this, the backend stays warm from the internal cron and from external pings, and you get an email if the service goes down.
