import { emailLayout } from './layout';

export function talentApprovalEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const status = (data.status as string) || 'approved';
  const approved = status === 'approved';
  const content = approved
    ? `
    <h1 style="margin:0 0 16px;font-size:24px;">You're approved for the Talent Marketplace</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Great news — your talent application has been approved. You can now pay the marketplace fee to showcase your profile and receive hire requests.</p>
    <p style="margin:0 0 24px;"><a href="${(process.env.FRONTEND_URL || 'http://localhost:3000')}/dashboard/talent/pay-fee" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Complete marketplace access</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `
    : `
    <h1 style="margin:0 0 16px;font-size:24px;">Update on your talent application</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">After review, your talent application was not approved at this time. You may reapply with additional portfolio or experience details.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: approved ? 'RiseFlow Hub — Talent application approved' : 'RiseFlow Hub — Talent application update',
    html: emailLayout(content, approved ? 'You are approved for the marketplace.' : 'Application update.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
