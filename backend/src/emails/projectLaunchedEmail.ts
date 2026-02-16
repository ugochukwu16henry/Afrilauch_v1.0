import { emailLayout } from './layout';

export interface ProjectLaunchedData {
  name?: string;
  email?: string;
  projectName?: string;
  liveUrl?: string;
}

export function projectLaunchedEmail(data: ProjectLaunchedData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const projectName = (data.projectName as string) || 'Your project';
  const liveUrl = (data.liveUrl as string) || '';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Project launched</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Congratulations! <strong>${escapeHtml(projectName)}</strong> has been launched.</p>
    ${liveUrl ? `<p style="margin:0 0 24px;"><a href="${escapeHtml(liveUrl)}" style="display:inline-block;background:#0FA958;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">View live</a></p>` : '<p style="margin:0 0 24px;">View your project in the <a href="' + (process.env.FRONTEND_URL || 'http://localhost:3000') + '/dashboard" style="color:#0FA958;">dashboard</a>.</p>'}
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: `RiseFlow Hub — Launched: ${projectName}`,
    html: emailLayout(content, 'Project launched.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
