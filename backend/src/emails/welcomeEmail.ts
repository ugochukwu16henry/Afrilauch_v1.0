import { emailLayout } from './layout';

export interface WelcomeData {
  name?: string;
  email?: string;
}

export function welcomeEmail(data: WelcomeData): { subject: string; html: string } {
  const name = (data.name as string) || 'there';
  const content = `
    <h1 style="margin:0 0 16px;font-size:24px;">Welcome to RiseFlow Hub</h1>
    <p style="margin:0 0 16px;">Hi ${escapeHtml(name)},</p>
    <p style="margin:0 0 16px;">Your account has been created. You can now log in and start turning your idea into a real business.</p>
    <p style="margin:0 0 24px;">If you have any questions, reply to this email or visit our <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color:#0FA958;">Contact page</a>.</p>
    <p style="margin:0;">— The RiseFlow Hub team</p>
  `;
  return {
    subject: 'Welcome to RiseFlow Hub — Your account is ready',
    html: emailLayout(content, 'Your account has been created.'),
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
