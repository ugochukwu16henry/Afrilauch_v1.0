const base = process.env.SMOKE_BASE_URL || 'http://localhost:4000';
const adminEmail = process.env.SMOKE_ADMIN_EMAIL || 'test-super_admin@example.com';
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD || 'Password123';

function compact(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

async function parseJsonSafe(res) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { raw: txt };
  }
}

async function request(method, path, token, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await parseJsonSafe(res);
  const preview = compact(JSON.stringify(data)).slice(0, 220);
  const ok = [200, 201, 204].includes(res.status);
  console.log(`${method} ${path} => ${res.status}${ok ? ' OK' : ' FAIL'} :: ${preview}`);
  return { res, data, ok };
}

function pickTarget(items, adminEmailAddress) {
  return (items || []).find((row) => {
    if (!row || !row.id || !row.email) return false;
    if (String(row.email).toLowerCase() === String(adminEmailAddress).toLowerCase()) return false;
    if (row.role === 'super_admin') return false;
    return true;
  });
}

async function main() {
  const login = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password: adminPassword }),
  });

  const auth = await parseJsonSafe(login);
  if (!login.ok || !auth.token) {
    console.log('LOGIN_ERR', login.status, compact(JSON.stringify(auth)).slice(0, 220));
    process.exit(1);
  }

  const token = auth.token;

  let failed = 0;

  const list1 = await request('GET', '/api/v1/super-admin/users/account-status', token);
  if (!list1.ok) {
    console.log('ABORT: account-status listing failed');
    process.exit(2);
  }

  const target = pickTarget(list1.data.items, adminEmail);
  if (!target) {
    console.log('SKIP: No non-super-admin target user found for pause/resume test');
    process.exit(0);
  }

  console.log(`TARGET_USER ${target.id} ${target.email} (${target.role})`);

  const reasonPause = `Smoke pause ${new Date().toISOString()}`;
  const pause = await request('POST', `/api/v1/super-admin/users/${target.id}/pause`, token, {
    reason: reasonPause,
  });
  if (!pause.ok) failed += 1;

  const suspendedList = await request('GET', '/api/v1/super-admin/users/account-status?status=suspended', token);
  if (!suspendedList.ok) {
    failed += 1;
  } else {
    const found = (suspendedList.data.items || []).some((row) => row.id === target.id);
    if (!found) {
      failed += 1;
      console.log('VERIFY_FAIL target not found in suspended list');
    }
  }

  const reasonResume = `Smoke resume ${new Date().toISOString()}`;
  const resume = await request('POST', `/api/v1/super-admin/users/${target.id}/resume`, token, {
    reason: reasonResume,
  });
  if (!resume.ok) failed += 1;

  const list2 = await request('GET', '/api/v1/super-admin/users/account-status?status=active', token);
  if (!list2.ok) {
    failed += 1;
  } else {
    const found = (list2.data.items || []).some((row) => row.id === target.id);
    if (!found) {
      failed += 1;
      console.log('VERIFY_FAIL target not found in active list after resume');
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
