# Backend URL Configuration Update

## ✅ Sign-In Test Results

**Backend URL:** `https://riseflowhub-v1-0-1.onrender.com`

Sign-in test completed successfully:
- ✅ Backend health check: **200 OK**
- ✅ Sign-in endpoint: **200 OK**
- ✅ Token generation: **Success**
- ✅ Token verification: **Success**
- ✅ User authenticated: `ugochukwuhenry16@gmail.com` (Super Admin)

## 🔧 Required Updates

### 1. Vercel Environment Variables

Update `NEXT_PUBLIC_API_URL` on Vercel:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `riseflowhub_v1.0`
3. Go to **Settings** → **Environment Variables**
4. Find `NEXT_PUBLIC_API_URL`
5. Update value to: `https://riseflowhub-v1-0-1.onrender.com` (no trailing slash)
6. **Redeploy** the frontend (or wait for next deployment)

**Important:** After updating, you must **redeploy** for the change to take effect. You can:
- Trigger a new deployment manually, or
- Push a commit to trigger automatic deployment

### 2. Render Environment Variables

Verify `FRONTEND_URL` on Render:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your backend service: `riseflowhub-v1-0-1` (or similar)
3. Go to **Environment** tab
4. Verify `FRONTEND_URL` is set to: `https://riseflowhub-v1-0.vercel.app` (no trailing slash)
5. If missing or incorrect, add/update it
6. Render will automatically redeploy after saving

### 3. Paystack Webhook URL

Update Paystack webhook URL:

1. Go to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **Webhooks**
3. Update webhook URL to: `https://riseflowhub-v1-0-1.onrender.com/api/v1/webhooks/paystack`
4. Save changes

## 📝 Local Development

The local `.env` files have been updated:
- ✅ `frontend/.env` - Updated `NEXT_PUBLIC_API_URL` to production URL
- ✅ `backend/.env` - Updated Paystack webhook URL comment

For local development, use:
- Frontend: `NEXT_PUBLIC_API_URL=http://localhost:4000` (in `frontend/.env.local`)
- Backend: `FRONTEND_URL=http://localhost:3000` (in `backend/.env.local`)

## ✅ Verification Steps

After updating Vercel and Render:

1. **Test Backend Health:**
   ```
   https://riseflowhub-v1-0-1.onrender.com/api/v1/health
   ```
   Should return: `{"status":"ok","service":"riseflow-api"}`

2. **Test Sign-In via Frontend:**
   - Go to: `https://riseflowhub-v1-0.vercel.app/login`
   - Enter credentials
   - Should successfully sign in and redirect to dashboard

3. **Check Browser Console:**
   - Open DevTools → Network tab
   - Sign in
   - Verify API calls go to `https://riseflowhub-v1-0-1.onrender.com/api/v1/auth/login`
   - Should return 200 OK with token

## 🐛 Troubleshooting

If sign-in still fails after updates:

1. **Clear Vercel Cache:**
   - Vercel → Project → Deployments
   - Click "..." → "Redeploy" → Check "Use existing Build Cache" → **Uncheck it**
   - Redeploy

2. **Verify Environment Variables:**
   - Vercel: Check `NEXT_PUBLIC_API_URL` is set correctly
   - Render: Check `FRONTEND_URL` is set correctly

3. **Check CORS:**
   - Backend should allow `https://riseflowhub-v1-0.vercel.app`
   - Verify in `backend/src/index.ts` CORS configuration

4. **Backend Logs:**
   - Check Render logs for any errors
   - Look for CORS or authentication errors

## 📋 Summary

| Service | Variable | Value |
|---------|----------|-------|
| **Vercel** | `NEXT_PUBLIC_API_URL` | `https://riseflowhub-v1-0-1.onrender.com` |
| **Render** | `FRONTEND_URL` | `https://riseflowhub-v1-0.vercel.app` |
| **Paystack** | Webhook URL | `https://riseflowhub-v1-0-1.onrender.com/api/v1/webhooks/paystack` |

**Next Steps:**
1. ✅ Update Vercel `NEXT_PUBLIC_API_URL`
2. ✅ Verify Render `FRONTEND_URL`
3. ✅ Update Paystack webhook URL
4. ✅ Redeploy Vercel frontend
5. ✅ Test sign-in on production
