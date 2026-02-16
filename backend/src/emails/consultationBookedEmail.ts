import { emailLayout } from './layout';

export interface ConsultationBookedData {
  name?: string;
  email?: string;
  preferredDate?: string;
  preferredTime?: string;
}

export function consultationBookedEmail(data: ConsultationBookedData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const date = (data.preferredDate as string) || '';
  const time = (data.preferredTime as string) || '';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Consultation booked</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your consultation has been booked. We'll confirm your preferred time shortly.</p>
    ${date || time ? `<p style="margin:0 0 16px;">Your preferred slot: ${escapeHtml([date, time].filter(Boolean).join(' at '))}</p>` : ''}
    <p style="margin:0 0 24px;">If you need to reschedule, reply to this email or <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#0FA958;">contact us</a>.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Your consultation is booked',
    html: emailLayout(content, 'Consultation booked.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
