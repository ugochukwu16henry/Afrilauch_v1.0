import { emailLayout } from './layout';

export interface IdeaSubmissionData {
  name?: string;
  email?: string;
  ideaPreview?: string;
}

export function ideaSubmissionEmail(data: IdeaSubmissionData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const ideaPreview = (data.ideaPreview as string) || 'Your idea';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Your idea has been received</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Thank you for submitting your idea. Our system is analyzing it and preparing your startup proposal.</p>
    <p style="margin:0 0 16px;"><strong>Idea summary:</strong> ${escapeHtml(ideaPreview)}</p>
    <p style="margin:0 0 24px;">We'll be in touch soon. In the meantime, you can log in to your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="color:#0FA958;">dashboard</a>.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'RiseFlow Hub — Your idea has been received',
    html: emailLayout(content, 'Your idea has been received.'),
  };
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
