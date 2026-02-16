/**
 * Verify SMTP connection using env from backend/.env
 * Run from backend folder: node scripts/verify-smtp.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST || 'localhost';
const port = Number(process.env.SMTP_PORT) || 1025;
const secure = process.env.SMTP_SECURE === 'true';
const user = process.env.SMTP_USER || '';
const pass = process.env.SMTP_PASS || '';

console.log('Checking SMTP connection...');
console.log('  Host:', host);
console.log('  Port:', port);
console.log('  User:', user ? `${user.substring(0, 4)}***` : '(none)');
console.log('  Pass:', pass ? '***set***' : '(not set)');
console.log('');

if (!host || !port) {
  console.error('ERROR: Set SMTP_HOST and SMTP_PORT in backend/.env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user && pass ? { user, pass } : undefined,
});

transporter.verify((err, success) => {
  if (err) {
    console.error('SMTP connection FAILED:', err.message);
    process.exit(1);
  }
  console.log('SMTP connection OK – Resend/SMTP is reachable and credentials work.');
  process.exit(0);
});
