import { emailLayout } from './layout';

export function birthdayWishEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const rawName = (data.name as string | undefined) || (data.fullName as string | undefined) || 'there';
  const firstName = rawName.split(' ')[0] || rawName;
  const platformName = process.env.PLATFORM_NAME || 'RiseFlow Hub';

  const subject = `Happy Birthday, ${firstName}! 🎉`;
  const preheader = `Warm birthday wishes from ${platformName}.`;

  const content = `
    <p style="font-size:16px;margin:0 0 16px;">Hi <strong>${firstName}</strong>,</p>
    <p style="font-size:15px;margin:0 0 12px;">
      Happy Birthday! 🎉 Thank you for being a part of <strong>${platformName}</strong>.
      We appreciate your trust and are excited to keep building with you.
    </p>
    <p style="font-size:15px;margin:0 0 12px;">
      Wishing you an amazing day filled with new ideas, meaningful progress, and opportunities.
    </p>
    <p style="font-size:15px;margin:0 0 12px;">
      — The ${platformName} team
    </p>
  `;

  return {
    subject,
    html: emailLayout(content, preheader),
  };
}

