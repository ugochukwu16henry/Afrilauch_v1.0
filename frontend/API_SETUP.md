# API endpoints not working

The frontend talks to the Express backend either via **relative URLs** (proxied by Next.js) or **direct URL** when `NEXT_PUBLIC_API_URL` is set. Use this checklist to fix "API not working".

## 1. Backend must be running

- **Local:** In the repo root, run the backend (e.g. `cd backend && pnpm dev`). It should listen on port 4000 by default.
- **Production:** The backend must be deployed and reachable at a public URL (e.g. Railway, Render).

## 2. Set `NEXT_PUBLIC_API_URL`

| Environment | Where to set | Value |
|-------------|--------------|--------|
| **Local**   | `frontend/.env.local` | `http://localhost:4000` |
| **Vercel**  | Project → Settings → Environment Variables | Your backend URL (e.g. `https://your-app.railway.app`) |

- Copy `frontend/.env.local.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:4000` for local dev.
- On Vercel, add `NEXT_PUBLIC_API_URL` **before** building; the rewrite is configured at build time.

## 3. Verify connectivity

- **Backend health:** Open `{BACKEND_URL}/api/v1/health` in the browser (e.g. `http://localhost:4000/api/v1/health`). You should see `{"status":"ok","service":"riseflow-api"}`.
- **Via frontend:** With the app running, open DevTools → Network and trigger an API call (e.g. log in). Requests to `/api/v1/*` should succeed (200). If they go to your frontend origin and return 502/503, the proxy target is wrong or the backend is down.

## 4. Production CORS (if you use direct backend URL)

If the frontend calls the backend by full URL (e.g. `https://api.example.com`), the backend must allow the frontend origin. Set **`FRONTEND_URL`** in the backend environment to your frontend URL (e.g. `https://your-app.vercel.app`). The backend uses it for CORS.

## 5. Database (Supabase)

The backend needs **`DATABASE_URL`** (Supabase Postgres connection string). If the backend starts but API calls fail with 500, check backend logs and ensure the database is reachable and migrated.
