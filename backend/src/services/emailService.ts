import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { getEmailContent, type EmailType } from '../emails';

const prisma = new PrismaClient();

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let transporter: Transporter | null = null;

const isTestEnv = process.env.NODE_ENV === 'test' || process.env.DISABLE_SMTP === 'true';
const hasSmtpConfig = typeof process.env.SMTP_HOST === 'string' && process.env.SMTP_HOST.trim() !== '';

function getTransport(): Transporter {
  if (transporter) return transporter;
  // Do not connect to real SMTP in test or when SMTP is not configured (avoids ECONNREFUSED 127.0.0.1:1025)
  if (isTestEnv || !hasSmtpConfig) {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    }) as Transporter;
    return transporter;
  }
  const host = process.env.SMTP_HOST!.trim();
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';
  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

/** Verify SMTP connection (for health check / debugging). Returns { ok, error }. */
export async function verifyConnection(): Promise<{ ok: boolean; error?: string }> {
  if (isTestEnv || !hasSmtpConfig) return { ok: true };
  try {
    const transport = getTransport();
    await transport.verify();
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

/** Log email attempt to DB (pending -> sent | failed) */
export async function logEmail(params: {
  type: string;
  toEmail: string;
  subject: string;
  status: 'pending' | 'sent' | 'failed';
  errorMessage?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<string> {
  const created = await prisma.emailLog.create({
    data: {
      type: params.type,
      toEmail: params.toEmail,
      subject: params.subject,
      status: params.status,
      errorMessage: params.errorMessage ?? null,
      sentAt: params.status === 'sent' ? new Date() : null,
      metadata: (params.metadata ?? undefined) as import('@prisma/client').Prisma.InputJsonValue | undefined,
    },
  });
  return created.id;
}

export async function updateEmailLog(
  id: string,
  updates: { status: 'sent' | 'failed'; errorMessage?: string | null; sentAt?: Date | null }
): Promise<void> {
  await prisma.emailLog.update({
    where: { id },
    data: updates,
  });
}

/** Send one email with retries and DB logging */
export async function sendEmail(params: {
  type: EmailType;
  toEmail: string;
  dynamicData?: Record<string, unknown>;
}): Promise<{ success: boolean; logId: string; error?: string }> {
  if (isTestEnv) {
    const logId = await logEmail({
      type: params.type,
      toEmail: params.toEmail,
      subject: 'test',
      status: 'sent',
      metadata: (params.dynamicData ?? undefined) as Record<string, unknown>,
    }).catch(() => '');
    return { success: true, logId: logId || 'test-email' };
  }

  const { type, toEmail, dynamicData = {} } = params;
  const { subject, html } = getEmailContent(type, { ...dynamicData, email: toEmail });

  const logId = await logEmail({
    type,
    toEmail,
    subject,
    status: 'pending',
    metadata: dynamicData as Record<string, unknown>,
  });

  const from = process.env.EMAIL_FROM || 'RiseFlow Hub <noreply@riseflowhub.com>';
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const transport = getTransport();
      await transport.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });
      await updateEmailLog(logId, { status: 'sent', sentAt: new Date() });
      return { success: true, logId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
      }
    }
  }

  const errorMessage = lastError?.message ?? 'Unknown error';
  await updateEmailLog(logId, {
    status: 'failed',
    errorMessage,
    sentAt: null,
  });
  return { success: false, logId, error: errorMessage };
}

/** Queue-style: send email and log; do not throw (for use in hooks) */
export async function sendNotificationEmail(params: {
  type: EmailType;
  userEmail: string;
  dynamicData?: Record<string, unknown>;
}): Promise<void> {
  try {
    const result = await sendEmail({ ...params, toEmail: params.userEmail });
    if (!result.success) {
      console.error('[Email] Failed after retries:', result.logId, result.error);
    }
  } catch (e) {
    console.error('[Email] Send error:', e);
  }
}

/** Send email with PDF attachment (e.g. invoice). Fire-and-forget; logs on failure. */
export async function sendInvoiceEmail(params: {
  toEmail: string;
  subject: string;
  html: string;
  attachment: { filename: string; content: Buffer };
}): Promise<void> {
  if (isTestEnv) return;

  const logId = await logEmail({
    type: 'invoice',
    toEmail: params.toEmail,
    subject: params.subject,
    status: 'pending',
    metadata: { attachment: params.attachment.filename },
  }).catch(() => '');

  const from = process.env.EMAIL_FROM || 'RiseFlow Hub <noreply@riseflowhub.com>';
  try {
    const transport = getTransport();
    await transport.sendMail({
      from,
      to: params.toEmail,
      subject: params.subject,
      html: params.html,
      attachments: [{ filename: params.attachment.filename, content: params.attachment.content }],
    });
    if (logId) await updateEmailLog(logId, { status: 'sent', sentAt: new Date() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (logId) await updateEmailLog(logId, { status: 'failed', errorMessage: msg, sentAt: null });
    console.error('[Email] Invoice email failed:', msg);
  }
}
