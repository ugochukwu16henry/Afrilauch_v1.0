import { emailLayout } from './layout';

export function adminNewSignupAlertEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = escapeHtml((data.name as string) || 'New user');
  const email = escapeHtml((data.email as string) || 'Not provided');
  const role = escapeHtml(((data.role as string) || 'client').replace(/_/g, ' '));
  const phone = escapeHtml((data.phone as string) || 'Not provided');
  const source = escapeHtml(((data.source as string) || 'App signup').replace(/_/g, ' '));
  const signupDateTime = escapeHtml((data.signupDateTime as string) || 'Just now');
  const signupDay = escapeHtml((data.signupDay as string) || 'Unknown');
  const signupMonth = escapeHtml((data.signupMonth as string) || 'Unknown');
  const signupTime = escapeHtml((data.signupTime as string) || 'Unknown');
  const dashboardUrl =
    (data.dashboardUrl as string) ||
    `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/admin/users`;

  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">New user signup alert</h1>
    <p style="margin:0 0 16px;"><strong>${name}</strong> just created a new account on RiseFlow Hub.</p>
    <p style="margin:0 0 16px;">Here are the signup details so you can follow up quickly:</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 16px;">
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Name</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${name}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Email</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Phone</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${phone}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Role</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${role}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Signup source</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${source}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Date & time</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${signupDateTime}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Day</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${signupDay}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Month</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${signupMonth}</td></tr>
      <tr><td style="padding:8px;border:1px solid #e5e7eb;"><strong>Time</strong></td><td style="padding:8px;border:1px solid #e5e7eb;">${signupTime}</td></tr>
    </table>
    <p style="margin:0 0 20px;">Open the Super Admin dashboard to review the account and follow up with the user.</p>
    <p style="margin:0;"><a href="${dashboardUrl}" style="display:inline-block;background:#0FA958;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;">Open Super Admin dashboard</a></p>
  `;

  return {
    subject: `New signup alert — ${name} (${role})`,
    html: emailLayout(content, `${name} just created a new account.`),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
