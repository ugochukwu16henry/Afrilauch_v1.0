import { emailLayout } from './layout';

export function interviewInviteEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const companyName = (data.companyName as string) || 'a company';
  const dateTime = (data.dateTime as string) || 'TBD';
  const details = (data.details as string) || '';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Interview invitation</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;"><strong>${escapeHtml(companyName)}</strong> would like to schedule an interview with you.</p>
    <p style="margin:0 0 16px;">Suggested time: <strong>${escapeHtml(dateTime)}</strong></p>
    ${details ? `<p style="margin:0 0 16px;">${escapeHtml(details)}</p>` : ''}
    <p style="margin:0 0 24px;"><a href="${(process.env.FRONTEND_URL || 'http://localhost:3000')}/dashboard/talent/hires" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View in dashboard</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: `RiseFlow Hub — Interview invite from ${companyName}`,
    html: emailLayout(content, 'Interview invitation.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
