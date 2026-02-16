import { emailLayout } from './layout';

export function paymentConfirmationEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const amount = (data.amount as string) ?? '';
  const description = (data.description as string) || 'Payment';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Payment confirmed</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your payment for <strong>${escapeHtml(description)}</strong>${amount ? ` (${escapeHtml(String(amount))})` : ''} has been received successfully.</p>
    <p style="margin:0 0 24px;">You can now access the full features in your dashboard.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Payment confirmed',
    html: emailLayout(content, 'Payment confirmed.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
