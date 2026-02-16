import { emailLayout } from './layout';

export interface InvestorInterestData {
  name?: string;
  email?: string;
  startupName?: string;
  investorName?: string;
}

export function investorInterestEmail(data: InvestorInterestData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const startupName = (data.startupName as string) || 'Your startup';
  const investorName = (data.investorName as string) || 'An investor';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Investor interest received</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;"><strong>${escapeHtml(investorName)}</strong> has expressed interest in <strong>${escapeHtml(startupName)}</strong>.</p>
    <p style="margin:0 0 24px;">Log in to your dashboard to view the message and respond.</p>
    <p style="margin:0 0 24px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View dashboard</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: `RiseFlow Hub — Investor interest: ${startupName}`,
    html: emailLayout(content, 'Investor interest received.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
