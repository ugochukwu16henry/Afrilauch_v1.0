const base = 'http://localhost:4000';

function randomEmail() {
  return `acct.ctrl.${Date.now()}@example.com`;
}

async function requestJson(path, options = {}) {
  const { headers: customHeaders, ...restOptions } = options;
  const res = await fetch(`${base}${path}`, {
    ...restOptions,
    headers: { 'content-type': 'application/json', ...(customHeaders || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { res, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password) {
  const { res, body } = await requestJson('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return { status: res.status, body };
}

async function register(name, email, password, role = 'client') {
  const { res, body } = await requestJson('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
  return { status: res.status, body };
}

async function main() {
  const superAdminEmail = 'test-super_admin@example.com';
  const superAdminPassword = 'Password123';
  const disposablePassword = 'Passw0rd!234';
  const disposableEmail = randomEmail();

  console.log('STEP 1: Super admin login');
  const adminLogin = await login(superAdminEmail, superAdminPassword);
  assert(adminLogin.status === 200 && adminLogin.body?.token, `Super admin login failed: ${adminLogin.status}`);
  const adminToken = adminLogin.body.token;

  console.log('STEP 2: Register disposable user');
  const signup = await register('Account Control Smoke User', disposableEmail, disposablePassword, 'client');
  assert(signup.status === 201 && signup.body?.user?.id, `User signup failed: ${signup.status} ${JSON.stringify(signup.body)}`);
  const userId = signup.body.user.id;

  console.log('STEP 3: Disposable user can login before pause');
  const userLoginBeforePause = await login(disposableEmail, disposablePassword);
  assert(userLoginBeforePause.status === 200 && userLoginBeforePause.body?.token, `User login before pause failed: ${userLoginBeforePause.status}`);
  const userTokenBeforePause = userLoginBeforePause.body.token;

  console.log('STEP 4: Pause account');
  const pause = await requestJson(`/api/v1/super-admin/users/${userId}/pause`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ reason: 'Smoke test suspension check' }),
  });
  assert(pause.res.status === 200, `Pause failed: ${pause.res.status} ${JSON.stringify(pause.body)}`);

  console.log('STEP 5: Login blocked while paused (expect 403)');
  const userLoginWhilePaused = await login(disposableEmail, disposablePassword);
  assert(userLoginWhilePaused.status === 403, `Paused login expected 403, got ${userLoginWhilePaused.status}`);

  console.log('STEP 6: Existing token blocked on API (expect 403)');
  const meWhilePaused = await requestJson('/api/v1/users/me', {
    method: 'GET',
    headers: { authorization: `Bearer ${userTokenBeforePause}` },
  });
  assert(meWhilePaused.res.status === 403, `Paused API expected 403, got ${meWhilePaused.res.status}`);

  console.log('STEP 7: Resume account');
  const resume = await requestJson(`/api/v1/super-admin/users/${userId}/resume`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ reason: 'Smoke test resume check' }),
  });
  assert(resume.res.status === 200, `Resume failed: ${resume.res.status} ${JSON.stringify(resume.body)}`);

  console.log('STEP 8: Login works after resume');
  const userLoginAfterResume = await login(disposableEmail, disposablePassword);
  assert(userLoginAfterResume.status === 200, `Login after resume failed: ${userLoginAfterResume.status}`);

  console.log('STEP 9: Permanent delete account');
  const permanentDelete = await requestJson(`/api/v1/super-admin/users/${userId}/permanent`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ reason: 'Smoke test permanent delete', password: superAdminPassword }),
  });
  assert(permanentDelete.res.status === 200, `Permanent delete failed: ${permanentDelete.res.status} ${JSON.stringify(permanentDelete.body)}`);

  console.log('STEP 10: Re-registration blocked for deleted email (expect 403)');
  const reSignup = await register('Account Control Smoke User', disposableEmail, disposablePassword, 'client');
  assert(reSignup.status === 403, `Re-signup expected 403, got ${reSignup.status} ${JSON.stringify(reSignup.body)}`);

  console.log('SUCCESS: Account control flow verified end-to-end.');
}

main().catch((error) => {
  console.error('SMOKE_ACCOUNT_CONTROL_ERR', error?.message || String(error));
  process.exit(1);
});
