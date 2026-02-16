import { PrismaClient } from '@prisma/client';
import { sendNotificationEmail } from './emailService';
import { notify } from './notificationService';

const prisma = new PrismaClient();

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}

function isBirthdayToday(date: Date): boolean {
  const today = new Date();
  return date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export async function getUsersWithBirthdayToday() {
  const users = await prisma.user.findMany({
    where: { birthday: { not: null } },
    select: {
      id: true,
      name: true,
      email: true,
      birthday: true,
      timezone: true,
      notificationSettings: {
        select: {
          emailNotifications: true,
          inAppNotifications: true,
        },
      },
    },
  });

  const todayUsers = users.filter((u) => u.birthday && isBirthdayToday(u.birthday));

  const logs = await prisma.birthdayWishLog.findMany({
    where: {
      userId: { in: todayUsers.map((u) => u.id) },
      sentAt: { gte: startOfToday(), lt: endOfToday() },
    },
  });

  const logMap = new Map<string, typeof logs[number]>();
  for (const l of logs) logMap.set(l.userId, l);

  return todayUsers.map((u) => ({
    ...u,
    log: logMap.get(u.id) || null,
  }));
}

export async function sendBirthdayWishesForToday(): Promise<{
  totalCandidates: number;
  sentCount: number;
  skippedAlreadySent: number;
}> {
  const candidates = await getUsersWithBirthdayToday();
  let sentCount = 0;
  let skippedAlreadySent = 0;

  for (const u of candidates) {
    if (u.log) {
      skippedAlreadySent += 1;
      continue;
    }

    const emailEnabled = u.notificationSettings?.emailNotifications ?? true;
    const inAppEnabled = u.notificationSettings?.inAppNotifications ?? true;

    let sentEmail = false;
    let sentInApp = false;
    let sentPush = false;

    const firstName = (u.name || '').split(' ')[0] || u.name || 'there';
    const platformName = process.env.PLATFORM_NAME || 'RiseFlow Hub';
    const message = `Happy Birthday, ${firstName}! 🎉 Thank you for being a part of ${platformName}. We appreciate your support and are excited to continue growing with you. Have an amazing day!`;

    if (emailEnabled && u.email) {
      await sendNotificationEmail({
        type: 'birthday_wish',
        userEmail: u.email,
        dynamicData: { name: u.name, platformName },
      });
      sentEmail = true;
    }

    if (inAppEnabled) {
      await notify({
        userId: u.id,
        type: 'birthday',
        title: `Happy Birthday, ${firstName}! 🎉`,
        message,
        link: '/dashboard',
      });
      sentInApp = true;
    }

    // Push notifications can be integrated later via mobile push tokens.
    sentPush = false;

    await prisma.birthdayWishLog.create({
      data: {
        userId: u.id,
        sentEmail,
        sentInApp,
        sentPush,
      },
    });

    sentCount += 1;
  }

  return {
    totalCandidates: candidates.length,
    sentCount,
    skippedAlreadySent,
  };
}

