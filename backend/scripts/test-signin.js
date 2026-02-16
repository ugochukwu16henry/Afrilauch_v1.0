/**
 * Test sign-in functionality
 * Usage: node scripts/test-signin.js [baseUrl] [email] [password]
 * Example: node scripts/test-signin.js https://riseflowhub-v1-0.onrender.com user@example.com password123
 */

const BASE_URL = process.argv[2] || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];

const API_URL = BASE_URL.replace(/\/+$/, '');

if (!EMAIL || !PASSWORD) {
  console.error('Usage: node scripts/test-signin.js [baseUrl] [email] [password]');
  console.error('Example: node scripts/test-signin.js https://riseflowhub-v1-0.onrender.com user@example.com mypassword');
  process.exit(1);
}

console.log('Testing sign-in at:', API_URL);
console.log('Email:', EMAIL);
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

async function testSignIn() {
  // 1. Health check
  console.log('1. Checking backend health...');
  const health = await test('/api/v1/health');
  if (!health.ok) {
    console.log(`   Status: ${health.status} ❌`);
    console.log('   ⚠️  Backend not reachable.');
    console.log('   Possible reasons:');
    console.log('   - Backend is sleeping (Render free tier - wait ~60s)');
    console.log('   - Backend URL is incorrect');
    console.log('   - Backend is not deployed');
    console.log('\n   Try accessing:', `${API_URL}/api/v1/health`);
    return;
  }
  console.log(`   Status: ${health.status} ✅`);
  console.log('');

  // 2. Sign in
  console.log('2. Attempting sign-in...');
  const login = await test('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
  });

  console.log(`   Status: ${login.status} ${login.ok ? '✅' : '❌'}`);
  
  if (login.ok && login.data.token) {
    console.log('   ✅ Sign-in successful!');
    console.log(`   Token received: ${login.data.token.substring(0, 20)}...`);
    console.log(`   User: ${login.data.user?.name || 'N/A'} (${login.data.user?.email || EMAIL})`);
    console.log(`   Role: ${login.data.user?.role || 'N/A'}`);
    
    // 3. Verify token by getting current user
    console.log('');
    console.log('3. Verifying token...');
    const me = await test('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${login.data.token}` },
    });
    
    if (me.ok) {
      console.log(`   Status: ${me.status} ✅`);
      console.log(`   ✅ Token is valid`);
      console.log(`   User ID: ${me.data.id}`);
      console.log(`   Name: ${me.data.name}`);
      console.log(`   Email: ${me.data.email}`);
      console.log(`   Role: ${me.data.role}`);
    } else {
      console.log(`   Status: ${me.status} ❌`);
      console.log('   ⚠️  Token verification failed:', me.data);
    }
  } else {
    console.log('   ❌ Sign-in failed');
    if (login.data?.error) {
      console.log(`   Error: ${login.data.error}`);
    } else if (login.data?.message) {
      console.log(`   Message: ${login.data.message}`);
    } else {
      console.log('   Response:', JSON.stringify(login.data, null, 2));
    }
    
    if (login.status === 401) {
      console.log('\n   Possible issues:');
      console.log('   - Incorrect email or password');
      console.log('   - User account does not exist');
      console.log('   - Account is locked or disabled');
    } else if (login.status === 404) {
      console.log('\n   ⚠️  Endpoint not found. Check backend routes.');
    } else if (login.status === 500) {
      console.log('\n   ⚠️  Server error. Check backend logs.');
    }
  }
  
  console.log('\n---');
  console.log('Test complete.');
}

testSignIn().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
