import { test, expect } from '@playwright/test';

test.describe('Backend health', () => {
  test('GET /api/v1/health returns ok', async ({ request }) => {
    const res = await request.get('/api/v1/health');
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body).toMatchObject({ status: 'ok', service: 'riseflow-api' });
  });
});
