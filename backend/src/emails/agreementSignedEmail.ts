import { emailLayout } from './layout';

export interface AgreementSignedData {
  name?: string;
  email?: string;
  agreementTitle?: string;
}

export function agreementSignedEmail(data: AgreementSignedData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const title = (data.agreementTitle as string) || 'Agreement';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Agreement signed</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Thank you for signing <strong>${escapeHtml(title)}</strong>. The agreement has been recorded and the other party has been notified.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: `RiseFlow Hub — Signed: ${title}`,
    html: emailLayout(content, 'Agreement signed.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
