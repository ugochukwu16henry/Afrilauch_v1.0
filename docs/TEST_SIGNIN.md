# Sign-In Testing Guide

## Quick Test Script

Use the test script to verify sign-in functionality:

```bash
# Test with your credentials
cd backend
node scripts/test-signin.js https://riseflowhub-v1-0.onrender.com your-email@example.com your-password
```

Or test locally if backend is running:
```bash
node scripts/test-signin.js http://localhost:4000 your-email@example.com your-password
```

## Manual Testing Steps

### 1. Wake Up Backend (if on Render free tier)

The backend may be sleeping. First, wake it up:

1. Open in browser: `https://riseflowhub-v1-0.onrender.com/api/v1/health`
2. Wait ~60 seconds for the backend to wake up
3. You should see: `{"status":"ok","message":"API is healthy"}`

### 2. Test Sign-In via Frontend

1. Go to: `https://riseflowhub-v1-0.vercel.app/login`
2. Enter your email and password
3. Click "Sign in"
4. Expected results:
   - ✅ **Success**: Redirects to appropriate dashboard based on role
   - ❌ **Error**: Check error message for details

### 3. Test Sign-In via API Directly

Using curl or Postman:

```bash
curl -X POST https://riseflowhub-v1-0.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Expected response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "...",
    "email": "...",
    "role": "..."
  }
}
```

## Common Issues

### Backend Not Responding (404/502)

**Symptoms:**
- "API unreachable (404 or 502)" error
- Health check returns 404

**Solutions:**
1. Wake up backend: Visit `/api/v1/health` and wait ~60s
2. Check Render deployment status
3. Verify backend URL is correct:
   - Frontend `.env`: `NEXT_PUBLIC_API_URL=https://riseflowhub-v1-0.onrender.com`
   - Render env: `FRONTEND_URL=https://riseflowhub-v1-0.vercel.app`

### Invalid Credentials (401)

**Symptoms:**
- "Invalid email or password" error
- 401 Unauthorized response

**Solutions:**
1. Verify email and password are correct
2. Check if user exists in database
3. If fresh deploy, seed database with test users

### CORS Error

**Symptoms:**
- "Request blocked (CORS)" error
- Network error in browser console

**Solutions:**
1. Set `FRONTEND_URL` on Render to: `https://riseflowhub-v1-0.vercel.app`
2. Redeploy backend after setting env var
3. Verify CORS config in `backend/src/index.ts`

### Token Not Stored

**Symptoms:**
- Login succeeds but user is logged out on refresh
- Token missing from localStorage

**Solutions:**
1. Check browser console for errors
2. Verify `setStoredToken` function in `frontend/src/lib/api.ts`
3. Check browser localStorage after login

## Test Accounts

If you have seeded test users, you can use:

- **Super Admin**: `test-super_admin@example.com` / `Password123`
- **Client**: `test-client@example.com` / `Password123`
- **Investor**: `test-investor@example.com` / `Password123`

(Check your seed script for actual test credentials)

## Verification Checklist

After signing in, verify:

- [ ] Token is stored in localStorage
- [ ] User is redirected to correct dashboard (based on role)
- [ ] User data is displayed correctly
- [ ] Session persists on page refresh
- [ ] Logout works correctly
- [ ] API calls include Authorization header

## Next Steps

If sign-in works:
- Test password reset (if implemented)
- Test email verification (if implemented)
- Test role-based access control
- Test session expiration

If sign-in fails:
- Check backend logs on Render
- Check browser console for errors
- Verify environment variables
- Test health endpoint first
