import fs from 'fs';
import path from 'path';

const backendRoot = process.cwd();
const indexPath = path.join(backendRoot, 'src', 'index.ts');
const indexText = fs.readFileSync(indexPath, 'utf8');

const importRegex = /import\s+\{\s*([A-Za-z0-9_]+)\s*\}\s+from\s+'\.\/routes\/([^']+)'/g;
const varToFile = new Map();
for (const match of indexText.matchAll(importRegex)) {
  varToFile.set(match[1], match[2]);
}

const useRegex = /app\.use\(\s*'([^']+)'\s*,\s*([A-Za-z0-9_]+)\s*\)/g;
const mounts = [];
for (const match of indexText.matchAll(useRegex)) {
  const base = match[1];
  const varName = match[2];
  const file = varToFile.get(varName);
  if (!file) continue;
  mounts.push({ base, file });
}

const endpoints = [];
for (const m of mounts) {
  const routePath = path.join(backendRoot, 'src', 'routes', `${m.file}.ts`);
  if (!fs.existsSync(routePath)) continue;
  const text = fs.readFileSync(routePath, 'utf8');
  const routeRegex = /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g;
  for (const rm of text.matchAll(routeRegex)) {
    const method = rm[1].toUpperCase();
    const sub = rm[2];
    let full = `${m.base}${sub === '/' ? '' : sub}`.replace(/\/\/+/g, '/');
    full = full.replace(/:(\w+)/g, '00000000-0000-0000-0000-000000000000');
    endpoints.push({ method, path: full, source: `routes/${m.file}.ts` });
  }
}

for (const extra of [
  { method: 'GET', path: '/health', source: 'index.ts' },
  { method: 'GET', path: '/api/v1/health', source: 'index.ts' },
  { method: 'POST', path: '/api/v1/monitor/alert', source: 'index.ts' },
]) endpoints.push(extra);

const unique = [];
const seen = new Set();
for (const e of endpoints) {
  const k = `${e.method} ${e.path}`;
  if (!seen.has(k)) {
    seen.add(k);
    unique.push(e);
  }
}

const baseUrl = 'http://localhost:4000';

async function login(email, password) {
  const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  return body.token || '';
}

const superToken = await login('test-super_admin@example.com', 'Password123');
const clientToken = await login('test-client@example.com', 'Password123');

const results = [];

for (const ep of unique) {
  const headers = { 'content-type': 'application/json' };
  if (ep.path.startsWith('/api/v1/super-admin')) {
    if (superToken) headers['authorization'] = `Bearer ${superToken}`;
  } else if (ep.path.startsWith('/api/v1/auth/')) {
  } else if (ep.path === '/api/v1/monitor/alert') {
  } else {
    if (clientToken) headers['authorization'] = `Bearer ${clientToken}`;
  }

  const init = { method: ep.method, headers };
  if (['POST', 'PUT', 'PATCH'].includes(ep.method)) {
    init.body = JSON.stringify({});
  }

  try {
    const res = await fetch(`${baseUrl}${ep.path}`, init);
    const text = await res.text().catch(() => '');
    results.push({ ...ep, status: res.status, ok: res.ok, preview: text.slice(0, 120) });
  } catch (err) {
    results.push({ ...ep, status: 0, ok: false, preview: String(err) });
  }

  await new Promise((r) => setTimeout(r, 15));
}

const netErrors = results.filter((r) => r.status === 0);
const serverErrors = results.filter((r) => r.status >= 500);
const rateLimited = results.filter((r) => r.status === 429);
const success2xx = results.filter((r) => r.status >= 200 && r.status < 300).length;
const authOrValidation4xx = results.filter((r) => r.status >= 400 && r.status < 500 && r.status !== 429).length;

console.log(`TOTAL_ENDPOINTS_TESTED=${results.length}`);
console.log(`SUCCESS_2XX=${success2xx}`);
console.log(`AUTH_OR_VALIDATION_4XX=${authOrValidation4xx}`);
console.log(`RATE_LIMIT_429=${rateLimited.length}`);
console.log(`SERVER_5XX=${serverErrors.length}`);
console.log(`NETWORK_ERRORS=${netErrors.length}`);

if (serverErrors.length) {
  console.log('\n--- 5XX ENDPOINTS ---');
  for (const e of serverErrors) {
    console.log(`${e.method} ${e.path} => ${e.status} :: ${e.preview.replace(/\s+/g, ' ')}`);
  }
}
if (netErrors.length) {
  console.log('\n--- NETWORK ERRORS ---');
  for (const e of netErrors) {
    console.log(`${e.method} ${e.path} => ${e.preview}`);
  }
}
if (rateLimited.length) {
  console.log('\n--- RATE LIMITED 429 (sample up to 15) ---');
  for (const e of rateLimited.slice(0, 15)) {
    console.log(`${e.method} ${e.path}`);
  }
}
