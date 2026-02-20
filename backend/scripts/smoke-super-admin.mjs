const base = 'http://localhost:4000';

async function main() {
  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'test-super_admin@example.com', password: 'Password123' }),
  });

  const auth = await login.json().catch(() => ({}));
  if (!login.ok || !auth.token) {
    console.log('LOGIN_ERR', login.status, JSON.stringify(auth));
    process.exit(1);
  }

  const headers = { authorization: `Bearer ${auth.token}` };
  const endpoints = [
    ['GET', '/api/v1/super-admin/overview'],
    ['GET', '/api/v1/super-admin/payments'],
    ['GET', '/api/v1/super-admin/activity'],
    ['GET', '/api/v1/super-admin/audit-logs'],
    ['GET', '/api/v1/super-admin/reports'],
    ['GET', '/api/v1/super-admin/consultations'],
    ['GET', '/api/v1/super-admin/messages'],
    ['GET', '/api/v1/super-admin/skills'],
    ['GET', '/api/v1/super-admin/email-logs'],
    ['GET', '/api/v1/super-admin/equity/company'],
    ['GET', '/api/v1/super-admin/security/overview'],
    ['GET', '/api/v1/super-admin/security/events'],
    ['GET', '/api/v1/super-admin/security/events?severity=undefined'],
    ['GET', '/api/v1/super-admin/security/blocked-ips'],
    ['GET', '/api/v1/super-admin/finance/summary'],
    ['GET', '/api/v1/super-admin/finance/tax-summary?start=2026-01-01&end=2026-02-19'],
    ['GET', '/api/v1/super-admin/system-health'],
    ['GET', '/api/v1/super-admin/manual-payments'],
    ['GET', '/api/v1/super-admin/social-links'],
    ['GET', '/api/v1/super-admin/share-meta'],
    ['GET', '/api/v1/super-admin/birthday-wishes/today'],
    ['GET', '/api/v1/super-admin/birthday-wishes/logs'],
    ['GET', '/api/v1/tenants'],
    ['GET', '/api/v1/team'],
    ['GET', '/api/v1/team/roles'],
  ];

  let failed = 0;
  for (const [method, path] of endpoints) {
    try {
      const res = await fetch(`${base}${path}`, { method, headers });
      const txt = await res.text();
      const ok = [200, 201, 204].includes(res.status);
      if (!ok) failed += 1;
      console.log(`${method} ${path} => ${res.status}${ok ? ' OK' : ' FAIL'} :: ${txt.slice(0, 160).replace(/\s+/g, ' ')}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`${method} ${path} => FETCH_FAIL :: ${message}`);
    }
  }

  console.log('FAILED_COUNT', failed);
  process.exit(failed ? 2 : 0);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('SMOKE_ERR', message);
  process.exit(1);
});
