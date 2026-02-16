# Fix "API unreachable (404 or 502)" / Cannot sign in

Use this checklist so the **Vercel frontend** can talk to the **Render backend**.

---

## 1. Use the correct Render backend URL

Your backend URL is fixed by the **Render service name**. For the current RiseFlow Hub backend, use your active Render URL, e.g.:

- **`https://riseflowhub-v1-0-1.onrender.com`**

Open that URL in a browser and add `/api/v1/health`, e.g.:

- **`https://riseflowhub-v1-0-1.onrender.com/api/v1/health`**

You should see JSON like `{"status":"ok",...}`.  
If you get 502 or it hangs, the service may be **sleeping** (free tier). Wait 30–60 seconds and try again.

---

## 2. Set env on Vercel (frontend)

1. **Vercel** → your **frontend** project → **Settings** → **Environment Variables**.
2. Add or edit:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** your Render URL **with no trailing slash**, e.g.  
     `https://riseflowhub-v1-0-1.onrender.com`
   - **Environments:** Production (and Preview if you need login there).
3. Save.

Important: `NEXT_PUBLIC_*` is baked in at **build** time. After changing it you must **redeploy**.

---

## 3. Redeploy Vercel (no cache)

1. **Vercel** → your frontend project → **Deployments**.
2. Open the **⋮** on the latest deployment → **Redeploy**.
3. Check **“Redeploy with cleared cache”** (or similar) so the new env is used.
4. Confirm and wait for the deploy to finish.

---

## 4. Set env on Render (backend)

1. **Render** → your **backend** Web Service → **Environment**.
2. Add or edit:
   - **Key:** `FRONTEND_URL`
   - **Value:** your **Vercel app URL** with no trailing slash, e.g.  
     `https://riseflowhub-v1-0.vercel.app`  
     or your exact URL from the Vercel deployment (e.g. `https://riseflowhubv10-xxx.vercel.app`).
3. Save. Render will redeploy the backend automatically.

---

## 5. Quick check

- **Backend:** Open `https://<your-render-url>/api/v1/health` in a new tab. Should return JSON.
- **Frontend:** Open your Vercel site, try **Sign in** again.

If you still get 502 on the first request after a long idle time, wait ~60 s and retry (Render free tier cold start).

---

## Summary

| Where   | Variable                 | Set to                                                                 |
|---------|--------------------------|------------------------------------------------------------------------|
| Vercel  | `NEXT_PUBLIC_API_URL`    | `https://riseflowhub-v1-0-1.onrender.com` (no slash) |
| Render  | `FRONTEND_URL`           | Your Vercel site URL, e.g. `https://riseflowhub-v1-0.vercel.app` (no slash) |

Then **redeploy Vercel with cleared cache** so the new API URL is used.
