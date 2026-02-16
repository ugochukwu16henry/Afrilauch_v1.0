import { emailLayout } from './layout';

export function platformMessageForwardEmail(data: Record<string, unknown>): { subject: string; html: string } {
  const senderName = (data.senderName as string) || 'Unknown sender';
  const senderEmail = (data.senderEmail as string) || 'unknown@example.com';
  const senderPhone = (data.senderPhone as string) || 'Not provided';
  const subjectLine = (data.subject as string) || 'No subject';
  const messageBody = (data.message as string) || '';

  const subject = `New Platform Message — ${subjectLine}`;
  const preheader = 'New message received via RiseFlow platform contact form.';

  const content = `
    <p>You have received a new message from the RiseFlow platform.</p>
    <p><strong>Sender Name:</strong> ${senderName}</p>
    <p><strong>Sender Email:</strong> ${senderEmail}</p>
    <p><strong>Phone / WhatsApp:</strong> ${senderPhone}</p>
    <p><strong>Subject:</strong> ${subjectLine}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-line;">${messageBody}</p>
    <p style="margin-top:16px;">You can view this message in the Admin Dashboard for full details.</p>
  `;

  return {
    subject,
    html: emailLayout(content, preheader),
  };
}

