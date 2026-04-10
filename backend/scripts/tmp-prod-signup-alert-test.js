require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const startedAt = new Date();
  const base = process.argv[2] || 'https://riseflowhub-v1-0-1.onrender.com';
  const testEmail = `henry+prodroute-${Date.now()}@riseflowhub.app`;

  const payload = {
    name: 'Mark Obi',
    email: testEmail,
    password: 'MarkObi#2026',
    phone: '07068313709',
    role: 'client',
  };

  const res = await fetch(`${base}/api/v1/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text;
  }

  const createdUser = await prisma.user.findUnique({
    where: { email: testEmail },
    select: { id: true, email: true, createdAt: true },
  }).catch(() => null);

  const emailLogs = await prisma.emailLog.findMany({
    where: {
      createdAt: { gte: startedAt },
      OR: [
        { toEmail: testEmail },
        { toEmail: process.env.SUPER_ADMIN_SIGNUP_ALERT_EMAIL || 'ugochukwuhenry16@gmail.com' },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      type: true,
      toEmail: true,
      status: true,
      createdAt: true,
      subject: true,
    },
  }).catch(() => []);

  console.log(
    JSON.stringify(
      {
        status: res.status,
        ok: res.ok,
        base,
        testEmail,
        response: parsed,
        createdUser,
        emailLogs,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
