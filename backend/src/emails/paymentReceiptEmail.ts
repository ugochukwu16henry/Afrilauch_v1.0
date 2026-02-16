import { emailLayout } from './layout';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Official receipt email after admin approves a manual (bank transfer) payment */
export function paymentReceiptEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const amount = (data.amount as number) ?? 0;
  const currency = (data.currency as string) || 'USD';
  const paymentType = (data.paymentType as string) || 'platform_fee';
  const confirmedAt = (data.confirmedAt as string) || new Date().toISOString();
  const dateStr = new Date(confirmedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const description =
    paymentType === 'donation'
      ? 'Donation / Support'
      : 'Platform setup fee';

  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Payment receipt</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your payment has been verified and confirmed. This is your official receipt.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e5e7eb;">
      <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;">Description</td><td style="padding:10px 12px;">${escapeHtml(description)}</td></tr>
      <tr><td style="padding:10px 12px;font-weight:600;">Amount</td><td style="padding:10px 12px;">${escapeHtml(Number(amount).toLocaleString())} ${escapeHtml(currency)}</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:10px 12px;font-weight:600;">Date confirmed</td><td style="padding:10px 12px;">${escapeHtml(dateStr)}</td></tr>
    </table>
    <p style="margin:0 0 16px;">${paymentType === 'platform_fee' ? 'Your platform features are now unlocked. You can access the full dashboard and all services.' : 'Thank you for supporting our mission.'}</p>
    <p style="margin:0;">— RiseFlow Hub</p>
  `;
  return {
    subject: 'Payment receipt — RiseFlow Hub',
    html: emailLayout(content, 'Your payment has been confirmed. Official receipt.'),
  };
}
