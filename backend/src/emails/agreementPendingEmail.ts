import { emailLayout } from './layout';

export interface AgreementPendingData {
  name?: string;
  email?: string;
  agreementTitle?: string;
  deadline?: string;
}

export function agreementPendingEmail(data: AgreementPendingData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const title = (data.agreementTitle as string) || 'Agreement';
  const deadline = (data.deadline as string) || '';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Agreement pending your signature</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">You have an agreement waiting for your signature: <strong>${escapeHtml(title)}</strong>.</p>
    ${deadline ? `<p style="margin:0 0 16px;">Deadline: ${escapeHtml(deadline)}</p>` : ''}
    <p style="margin:0 0 24px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">Sign agreement</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: `RiseFlow Hub — Sign: ${title}`,
    html: emailLayout(content, 'Agreement pending your signature.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
