import { emailLayout } from './layout';

export interface PaymentReminderData {
  name?: string;
  email?: string;
  amount?: string | number;
  projectName?: string;
  dueDate?: string;
}

export function paymentReminderEmail(data: PaymentReminderData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const amount = data.amount != null ? String(data.amount) : '';
  const projectName = (data.projectName as string) || 'Your project';
  const dueDate = (data.dueDate as string) || '';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Payment required</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">A payment is due for <strong>${escapeHtml(projectName)}</strong>${amount ? `: <strong>${escapeHtml(amount)}</strong>` : ''}.</p>
    ${dueDate ? `<p style="margin:0 0 16px;">Due date: ${escapeHtml(dueDate)}</p>` : ''}
    <p style="margin:0 0 24px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/payments" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View payment</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Unlock full features and move your startup forward',
    html: emailLayout(content, 'Payment required.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
