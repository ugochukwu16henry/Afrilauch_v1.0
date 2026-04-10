import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as emailService from '../services/emailService';
import type { EmailType } from '../emails';

const prisma = new PrismaClient();

const VALID_EMAIL_TYPES: EmailType[] = [
  'account_created',
  'consultation_booked',
  'idea_submitted',
  'proposal_ready',
  'agreement_pending',
  'agreement_signed',
  'payment_required',
  'milestone_completed',
  'project_launched',
  'investor_interest_received',
  'team_invite',
  'payment_confirmation',
  'talent_approval',
  'interview_invite',
  'password_reset',
  'admin_new_signup_alert',
];

/** GET /api/v1/super-admin/email-logs — List email logs (Super Admin only) */
export async function list(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const status = req.query.status as string | undefined;
  const type = req.query.type as string | undefined;
  const toEmail = req.query.toEmail as string | undefined;

  const where: { status?: string; type?: string; toEmail?: { contains: string; mode: 'insensitive' } } = {};
  if (status && ['pending', 'sent', 'failed'].includes(status)) where.status = status;
  if (type) where.type = type;
  if (toEmail?.trim()) where.toEmail = { contains: toEmail.trim(), mode: 'insensitive' };

  const [rows, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.emailLog.count({ where }),
  ]);

  res.json({
    rows: rows.map((r) => ({
      id: r.id,
      type: r.type,
      toEmail: r.toEmail,
      subject: r.subject,
      status: r.status,
      errorMessage: r.errorMessage,
      sentAt: r.sentAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
      metadata: r.metadata,
    })),
    total,
    page,
    limit,
  });
}

/** POST /api/v1/super-admin/email-logs/:id/resend — Resend email (Super Admin only) */
export async function resend(req: Request, res: Response): Promise<void> {
  const id = req.params.id as string;
  const log = await prisma.emailLog.findUnique({ where: { id } });
  if (!log) {
    res.status(404).json({ error: 'Email log not found' });
    return;
  }
  const type = log.type as EmailType;
  if (!VALID_EMAIL_TYPES.includes(type)) {
    res.status(400).json({ error: `Cannot resend unsupported type: ${type}` });
    return;
  }
  const dynamicData = (log.metadata as Record<string, unknown>) ?? {};
  const result = await emailService.sendEmail({
    type,
    toEmail: log.toEmail,
    dynamicData,
  });
  if (result.success) {
    res.json({ ok: true, message: 'Email resent', logId: result.logId });
  } else {
    res.status(500).json({ error: result.error ?? 'Failed to resend', logId: result.logId });
  }
}
