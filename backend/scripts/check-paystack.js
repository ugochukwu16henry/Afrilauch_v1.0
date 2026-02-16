/**
 * Run from backend folder: node scripts/check-paystack.js
 * Checks if Paystack env vars are set and (optionally) calls Paystack API to validate the key.
 */
const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../.env');
const loaded = fs.existsSync(envPath);
if (loaded) {
  require('dotenv').config({ path: envPath });
  console.log('Loaded .env from:', envPath);
} else {
  require('dotenv').config();
  console.log('.env not found at', envPath, '- using default dotenv load');
}

const sk = process.env.PAYSTACK_SECRET_KEY?.trim();
const pk = process.env.PAYSTACK_PUBLIC_KEY?.trim();

console.log('--- Paystack config check ---');
const paystackKeys = Object.keys(process.env).filter((k) => k.toUpperCase().includes('PAYSTACK'));
if (paystackKeys.length) console.log('Env keys containing PAYSTACK:', paystackKeys.join(', '));
console.log('PAYSTACK_SECRET_KEY:', sk ? `set (${sk.substring(0, 12)}...)` : 'NOT SET');
console.log('PAYSTACK_PUBLIC_KEY:', pk ? `set (${pk.substring(0, 12)}...)` : 'NOT SET');

const enabled = sk && sk.startsWith('sk_');
console.log('Paystack enabled:', enabled ? 'YES' : 'NO');

if (!enabled) {
  console.log('\nTo enable: add to backend/.env (or host env):');
  console.log('  PAYSTACK_SECRET_KEY=sk_live_...');
  console.log('  PAYSTACK_PUBLIC_KEY=pk_live_...');
  process.exit(1);
}

// Optional: hit Paystack API to validate secret key (list transactions or similar)
async function validateKey() {
  try {
    const res = await fetch('https://api.paystack.co/transaction/totals', {
      headers: { Authorization: `Bearer ${sk}` },
    });
    if (res.ok) {
      const data = await res.json();
      console.log('\nPaystack API: OK (totals:', data.data ? 'returned' : 'n/a', ')');
    } else {
      console.log('\nPaystack API response:', res.status, await res.text());
    }
  } catch (e) {
    console.log('\nPaystack API request failed:', e.message);
  }
}

validateKey().then(() => process.exit(0));
