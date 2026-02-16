import { test, expect } from '@playwright/test';

/**
 * Smoke tests: hit multiple API areas in one run.
 * Prerequisite: backend running (e.g. API_BASE_URL=http://localhost:4000), DB seeded.
 * Run: npx playwright test tests/api/smoke.spec.ts
 */
const BASE = process.env.API_BASE_URL || 'http://localhost:4000';

async function loginAsClient(request: any) {
  const res = await request.post(`${BASE}/api/v1/auth/login`, {
    data: { email: 'test-client@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}

async function loginAsAdmin(request: any) {
  const res = await request.post(`${BASE}/api/v1/auth/login`, {
    data: { email: 'test-super_admin@example.com', password: 'Password123' },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}

test.describe('API smoke', () => {
  test('health', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('riseflow-api');
  });

  test('setup-fee config (public)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/setup-fee/config`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ideaStarterSetupFeeUsd).toBeDefined();
    expect(body.investorSetupFeeUsd).toBeDefined();
  });

  test('setup-fee quote USD (public)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/setup-fee/quote?currency=USD`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.amountUsd).toBeDefined();
    expect(body.currency).toBe('USD');
  });

  test('auth login invalid → 401', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/auth/login`, {
      data: { email: 'nope@x.com', password: 'wrong' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.status()).toBe(401);
  });

  test('auth login client → 200 + token', async ({ request }) => {
    const res = await request.post(`${BASE}/api/v1/auth/login`, {
      data: { email: 'test-client@example.com', password: 'Password123' },
      headers: { 'Content-Type': 'application/json' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe('test-client@example.com');
    expect(body.token).toBeDefined();
  });

  test('auth/me with token', async ({ request }) => {
    const token = await loginAsClient(request);
    const res = await request.get(`${BASE}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const user = await res.json();
    expect(user.id).toBeDefined();
    expect(user.email).toBe('test-client@example.com');
    expect(user.role).toBeDefined();
  });

  test('projects list with token', async ({ request }) => {
    const token = await loginAsClient(request);
    const res = await request.get(`${BASE}/api/v1/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('tasks/me with token', async ({ request }) => {
    const token = await loginAsClient(request);
    const res = await request.get(`${BASE}/api/v1/tasks/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('notifications with token', async ({ request }) => {
    const token = await loginAsClient(request);
    const res = await request.get(`${BASE}/api/v1/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.notifications).toBeDefined();
    expect(Array.isArray(body.notifications)).toBeTruthy();
  });

  test('startups marketplace (public)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/v1/startups/marketplace`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('agreements/assigned with token', async ({ request }) => {
    const token = await loginAsClient(request);
    const res = await request.get(`${BASE}/api/v1/agreements/assigned`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('super-admin overview with admin token', async ({ request }) => {
    const token = await loginAsAdmin(request);
    const res = await request.get(`${BASE}/api/v1/super-admin/overview`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toBeDefined();
  });
});
