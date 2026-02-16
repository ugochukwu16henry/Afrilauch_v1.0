import { emailLayout } from './layout';

export interface ProposalReadyData {
  name?: string;
  email?: string;
  projectName?: string;
}

export function proposalReadyEmail(data: ProposalReadyData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const projectName = (data.projectName as string) || 'Your project';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Your AI proposal is ready</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your proposal for <strong>${escapeHtml(projectName)}</strong> is ready. Log in to your dashboard to view scope, timeline, and next steps.</p>
    <p style="margin:0 0 24px;"><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View proposal</a></p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Your proposal is ready',
    html: emailLayout(content, 'Your AI proposal is ready.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
