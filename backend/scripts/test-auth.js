/**
 * Quick auth endpoints test script.
 * Run: node scripts/test-auth.js [baseUrl]
 * Example: node scripts/test-auth.js http://localhost:4000
 * Example: node scripts/test-auth.js https://riseflowhub-v1-0.onrender.com
 */

const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const API_URL = BASE_URL.replace(/\/+$/, '');

console.log('Testing auth endpoints at:', API_URL);
console.log('---\n');

async function test(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  }
}

async function runTests() {
  // 1. Health check
  console.log('1. GET /api/v1/health');
  const health = await test('/api/v1/health');
  console.log(`   Status: ${health.status} ${health.ok ? '✅' : '❌'}`);
  if (!health.ok) {
    console.log('   ⚠️  Backend not reachable. Check URL and ensure backend is running.');
    return;
  }
  console.log('   Response:', JSON.stringify(health.data));
  console.log('');

  // 2. Sign up
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'Test123456';
  console.log('2. POST /api/v1/auth/register');
  console.log(`   Email: ${testEmail}`);
  const signup = await test('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: testEmail,
      password: testPassword,
      role: 'client',
    }),
  });
  console.log(`   Status: ${signup.status} ${signup.ok ? '✅' : '❌'}`);
  if (signup.ok && signup.data.token) {
    console.log('   ✅ User created, token received');
    const token = signup.data.token;
    console.log('');

    // 3. Get current user
    console.log('3. GET /api/v1/auth/me');
    const me = await test('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   Status: ${me.status} ${me.ok ? '✅' : '❌'}`);
    if (me.ok) {
      console.log(`   ✅ User: ${me.data.name} (${me.data.email})`);
    } else {
      console.log('   ❌ Failed:', me.data);
    }
    console.log('');

    // 4. Logout
    console.log('4. POST /api/v1/auth/logout');
    const logout = await test('/api/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`   Status: ${logout.status} ${logout.ok ? '✅' : '❌'}`);
    if (logout.ok) {
      console.log('   ✅ Logout successful');
    }
    console.log('');

    // 5. Login
    console.log('5. POST /api/v1/auth/login');
    const login = await test('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    console.log(`   Status: ${login.status} ${login.ok ? '✅' : '❌'}`);
    if (login.ok && login.data.token) {
      console.log('   ✅ Login successful, token received');
    } else {
      console.log('   ❌ Failed:', login.data);
    }
    console.log('');

    // 6. Invalid login
    console.log('6. POST /api/v1/auth/login (invalid password)');
    const invalidLogin = await test('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'wrongpassword',
      }),
    });
    console.log(`   Status: ${invalidLogin.status} ${invalidLogin.status === 401 ? '✅' : '❌'}`);
    if (invalidLogin.status === 401) {
      console.log('   ✅ Correctly rejected invalid password');
    }
  } else {
    console.log('   ❌ Signup failed:', signup.data);
    if (signup.data?.error === 'Email already registered') {
      console.log('   ℹ️  Test user already exists. Try login instead.');
    }
  }
  console.log('\n---');
  console.log('Tests complete.');
}

runTests().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
