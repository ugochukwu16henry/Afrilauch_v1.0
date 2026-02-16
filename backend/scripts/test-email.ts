import path from 'path';
import dotenv from 'dotenv';
import { sendNotificationEmail } from '../src/services/emailService';

// Always load backend/.env explicitly so we don't accidentally pick up the root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const to = process.env.SMTP_USER;
  if (!to) {
    console.error('SMTP_USER is not set in backend .env — cannot send test email.');
    process.exit(1);
  }

  console.log(`Sending test email to ${to} using host ${process.env.SMTP_HOST}:${process.env.SMTP_PORT} ...`);

  try {
    await sendNotificationEmail({
      type: 'payment_confirmation',
      userEmail: to,
      dynamicData: {
        name: 'RiseFlow Hub SMTP Test',
        description: 'Test email from RiseFlow Hub backend',
        amount: '0 USD',
      },
    });
    console.log('Test email queued. Check your inbox and EmailLog table for status.');
  } catch (e) {
    console.error('Test email failed:', e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

main();

