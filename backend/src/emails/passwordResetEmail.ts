import { emailLayout } from './layout';

export function passwordResetEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const resetLink = (data.resetLink as string) || (process.env.FRONTEND_URL || 'http://localhost:3000') + '/login';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Reset your password</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">We received a request to reset your password. Click the button below to set a new password. This link expires in 1 hour.</p>
    <p style="margin:0 0 24px;"><a href="${escapeHtml(resetLink)}" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Reset password</a></p>
    <p style="margin:0 0 16px;font-size:14px;color:#666;">If you didn't request this, you can ignore this email.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Reset your password',
    html: emailLayout(content, 'Password reset requested.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
