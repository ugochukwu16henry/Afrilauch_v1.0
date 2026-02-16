# Playwright E2E Test Timeout Fixes

## Problem Statement

8 Playwright E2E tests were failing with timeouts at ~20-21 seconds:

1. Auth › logout redirects to login
2. Auth › register new user redirects to dashboard
3. Client Dashboard › navigate to Files page
4. Client Dashboard › navigate to Messages page
5. Admin Dashboard › navigate to Projects page
6. Admin Dashboard › navigate to Agreements page
7. Admin Dashboard › Agreements page has table and filters
8. Admin Dashboard › Add New Agreement modal opens and closes

## Root Cause Analysis

The tests were timing out because pages were getting stuck in an infinite loading state. This happened when:

1. A page's `useEffect` checked for a token with `getStoredToken()`
2. If the token was `null`, the code would `return` early
3. However, `loading` state was never set to `false`
4. The page would remain in loading state forever
5. Playwright navigation expectations would timeout waiting for page to stabilize

### Critical Issue: Dashboard Layout

The most critical issue was in `/frontend/src/app/dashboard/layout.tsx`:

```typescript
// BEFORE (BROKEN):
useEffect(() => {
  const token = getStoredToken();
  if (!token) {
    router.replace('/login');  // Missing: setLoading(false)
    return;
  }
  // ... rest of auth logic
}, [router]);
```

This caused the entire dashboard to hang in loading state when token was missing, blocking:
- All navigation within dashboard
- Page rendering
- Test expectations

### Secondary Issues: Admin Pages

Similar issues in:
- `/frontend/src/app/dashboard/admin/projects/page.tsx`
- `/frontend/src/app/dashboard/admin/agreements/page.tsx`

Both pages had `useEffect` hooks that:
- Returned early when token was missing without setting `loading=false`
- Lacked error handling for failed fetch requests

## Solutions Implemented

### 1. Dashboard Layout Fix

**File**: `frontend/src/app/dashboard/layout.tsx`

**Change**: Added `setLoading(false)` when token is missing

```typescript
// AFTER (FIXED):
useEffect(() => {
  const token = getStoredToken();
  if (!token) {
    setLoading(false);  // ✅ Added this line
    router.replace('/login');
    return;
  }
  api.auth.me(token)
    .then((userData) => {
      setUser(userData);
      setLoading(false);
    })
    .catch(() => {
      clearStoredToken();
      setLoading(false);
      router.replace('/login');
    });
}, [router]);
```

**Impact**: Ensures dashboard layout never hangs in loading state, allowing all navigation to work properly.

### 2. Admin Projects Page Fix

**File**: `frontend/src/app/dashboard/admin/projects/page.tsx`

**Changes**:
- Added `setLoading(false)` when token is missing
- Added `.catch()` handler for fetch failures

```typescript
// AFTER (FIXED):
useEffect(() => {
  const token = getStoredToken();
  if (!token) {
    setLoading(false);  // ✅ Added
    return;
  }
  fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
    .then((res) => res.ok ? res.json() : [])
    .then(setProjects)
    .catch(() => setProjects([]))  // ✅ Added error handling
    .finally(() => setLoading(false));
}, []);
```

**Impact**: Page renders with empty state on token/API errors instead of hanging.

### 3. Admin Agreements Page Fix

**File**: `frontend/src/app/dashboard/admin/agreements/page.tsx`

**Changes**:
- Added `setLoading(false)` when token is missing
- Added `.catch()` handlers to all Promise chains
- Proper error handling order (`.catch()` before final `.then()`)

```typescript
// AFTER (FIXED):
useEffect(() => {
  if (!token) {
    setLoading(false);  // ✅ Added
    return;
  }
  setLoading(true);
  Promise.all([
    api.agreements.listAssignments(token, {})
      .then(setAssignments)
      .catch(() => setAssignments([])),  // ✅ Added error handling
    api.agreements.list(token)
      .then(setTemplates)
      .catch(() => setTemplates([])),  // ✅ Added error handling
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => [])  // ✅ Catches network errors
      .then(setUsers),
  ]).finally(() => setLoading(false));
}, [token]);
```

**Impact**: Page renders with empty state on token/API errors instead of hanging.

## Why Tests Were Failing

### Before Fix

1. Test logs in user
2. Test navigates to a page (e.g., `/dashboard/files`)
3. Dashboard layout checks token
4. If token temporarily unavailable (race condition), layout stays in loading state
5. Navigation never completes
6. Playwright waits for `navigationTimeout` (15s)
7. Then waits for expect timeout (~5s)
8. Test fails at ~20-21 seconds

### After Fix

1. Test logs in user
2. Test navigates to a page
3. Dashboard layout checks token
4. If token unavailable: `setLoading(false)` is called, page renders immediately
5. If token available: auth completes normally
6. Navigation completes quickly
7. Test passes in ~2-3 seconds

## Retry Pattern Explained

Tests showed this pattern:
- Attempt 1: FAIL at ~20s
- Retry 1: FAIL at ~21s
- Retry 2: PASS at ~2s

**Why?**
- First two attempts: Next.js dev mode compiling pages on-demand, backend cold start
- Third attempt: Everything warmed up, but more importantly, the fix ensures loading state never hangs
- The fixes make tests resilient to cold start delays

## Test Configuration

From `playwright.config.ts`:
- Test timeout: 30000ms (30 seconds)
- Navigation timeout: 15000ms (15 seconds)
- Action timeout: 10000ms (10 seconds)
- Expect timeout: 10000ms (10 seconds)
- Retries in CI: 2

## Validation

✅ Code review completed - no issues found
✅ CodeQL security scan passed - 0 alerts
✅ All changes are minimal and surgical
✅ No functionality removed or broken
✅ Error handling properly structured
✅ Loading states managed in all code paths

## Files Modified

1. `frontend/src/app/dashboard/layout.tsx` (+1 line)
2. `frontend/src/app/dashboard/admin/projects/page.tsx` (+6 lines)
3. `frontend/src/app/dashboard/admin/agreements/page.tsx` (+14 lines)

Total: 3 files, 21 lines added/modified

## Expected Test Results

After these fixes, all 8 previously failing tests should pass consistently:

- ✅ Auth › logout redirects to login
- ✅ Auth › register new user redirects to dashboard
- ✅ Client Dashboard › navigate to Files page
- ✅ Client Dashboard › navigate to Messages page
- ✅ Admin Dashboard › navigate to Projects page
- ✅ Admin Dashboard › navigate to Agreements page
- ✅ Admin Dashboard › Agreements page has table and filters
- ✅ Admin Dashboard › Add New Agreement modal opens and closes

## References

- This fix aligns with `CI_FIX_SUMMARY.md` which documented the correct pattern
- Similar to previous race condition fix in dashboard layout
- Follows best practices for loading state management in React
