import { PrismaClient } from '@prisma/client';
import type { UserRole } from '@prisma/client';
import { sendNotificationEmail } from './emailService';
import { notify } from './notificationService';

export interface AdminSignupAlertParams {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole | string;
  createdAt: Date;
  source?: string;
}

function formatSignupTimestamp(date: Date): {
  formatted: string;
  day: string;
  month: string;
  time: string;
  iso: string;
} {
  return {
    formatted: new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(date),
    day: new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date),
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date),
    time: new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(date),
    iso: date.toISOString(),
  };
}

function getAlertRecipients(): string[] {
  return Array.from(
    new Set(
      [
        process.env.SUPER_ADMIN_SIGNUP_ALERT_EMAIL,
        process.env.FOUNDER_EMAIL_PRIMARY,
        'ugochukwuhenry16@gmail.com',
      ]
        .map((value) => value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value))
    )
  );
}

export async function notifySuperAdminsOfNewSignup(
  prisma: PrismaClient,
  params: AdminSignupAlertParams
): Promise<void> {
  const createdAt = params.createdAt instanceof Date ? params.createdAt : new Date(params.createdAt);
  const signup = formatSignupTimestamp(createdAt);
  const roleLabel = String(params.role || 'client').replace(/_/g, ' ');
  const sourceLabel = String(params.source || 'App signup').replace(/_/g, ' ');
  const phone = params.phone?.trim() || 'Not provided';
  const adminLink = '/dashboard/admin/users';
  const dashboardUrl = `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}${adminLink}`;
  const recipients = getAlertRecipients();

  const [admins] = await Promise.all([
    prisma.user
      .findMany({
        where: { role: 'super_admin' },
        select: { id: true },
      })
      .catch(() => []),
    Promise.allSettled(
      recipients.map((recipient) =>
        sendNotificationEmail({
          type: 'admin_new_signup_alert',
          userEmail: recipient,
          dynamicData: {
            name: params.name,
            email: params.email,
            phone,
            role: roleLabel,
            source: sourceLabel,
            signupDateTime: signup.formatted,
            signupDay: signup.day,
            signupMonth: signup.month,
            signupTime: signup.time,
            signupIso: signup.iso,
            dashboardUrl,
          },
        })
      )
    ),
  ]);

  if (!admins.length) return;

  const message = `${params.name} (${params.email}${phone && phone !== 'Not provided' ? `, ${phone}` : ''}) signed up as ${roleLabel} on ${signup.day}, ${signup.month} at ${signup.time}.`;

  await Promise.allSettled(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        type: 'message',
        title: 'New user signup',
        message,
        link: adminLink,
      })
    )
  );
}
