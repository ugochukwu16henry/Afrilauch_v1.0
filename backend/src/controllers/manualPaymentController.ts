import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { notify } from '../services/notificationService';
import { createAuditLog } from '../services/auditLogService';

const prisma = new PrismaClient();

const ALLOWED_CURRENCIES = ['NGN', 'USD'] as const;
const ALLOWED_TYPES = ['platform_fee', 'donation'] as const;

type AllowedCurrency = (typeof ALLOWED_CURRENCIES)[number];
type AllowedType = (typeof ALLOWED_TYPES)[number];

function isAllowedCurrency(v: string): v is AllowedCurrency {
  return ALLOWED_CURRENCIES.includes(v as AllowedCurrency);
}

function isAllowedType(v: string): v is AllowedType {
  return ALLOWED_TYPES.includes(v as AllowedType);
}

/** POST /api/v1/manual-payments — create a manual bank transfer record (user has already paid offline). */
export async function create(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user?: AuthPayload }).user;
  if (!payload) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { amount, currency, paymentType, notes, proofUrl } = req.body as {
    amount?: number;
    currency?: string;
    paymentType?: string;
    notes?: string;
    proofUrl?: string;
  };

  if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400).json({ error: 'Valid amount is required' });
    return;
  }
  if (!currency || !isAllowedCurrency(currency)) {
    res.status(400).json({ error: 'Currency must be NGN or USD' });
    return;
  }
  if (!paymentType || !isAllowedType(paymentType)) {
    res.status(400).json({ error: 'paymentType must be platform_fee or donation' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const payment = await prisma.manualPayment.create({
    data: {
      userId: user.id,
      amount: Number(amount),
      currency,
      paymentType,
      status: 'Pending',
      notes: notes?.trim() || null,
      proofUrl: proofUrl?.trim() || null,
    },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
  });

  // Notify Super Admins / Finance Admins so they can verify in their bank dashboard.
  const admins = await prisma.user.findMany({
    where: { role: { in: ['super_admin', 'finance_admin'] } },
    select: { id: true },
  });

  const title =
    paymentType === 'donation'
      ? 'New donation via bank transfer'
      : 'New platform fee via bank transfer';
  const message = `User ${user.name} (${user.email}) reported a bank transfer of ${Number(
    amount
  ).toLocaleString()} ${currency} for ${paymentType === 'donation' ? 'donation/support' : 'platform access'}.`;

  await Promise.all(
    admins.map(async (admin) => {
      await prisma.manualPaymentNotification.create({
        data: {
          userId: user.id,
          adminId: admin.id,
          paymentId: payment.id,
          message,
        },
      });
      await notify({
        userId: admin.id,
        type: 'payment',
        title,
        message,
        link: '/dashboard/admin/payments',
      });
    })
  );

  // Acknowledge to user
  await notify({
    userId: user.id,
    type: 'payment',
    title: 'Bank transfer submitted',
    message:
      'Thank you! We will confirm your payment from our side shortly. You will receive a confirmation once it has been verified.',
    link: '/dashboard/payments',
  });

  // Audit: payment reported (user submitted bank transfer)
  createAuditLog(prisma, {
    adminId: null,
    actionType: 'payment_reported',
    entityType: 'payment',
    entityId: payment.id,
    details: {
      userId: user.id,
      amount: Number(amount),
      currency,
      paymentType,
    },
  }).catch(() => {});

  res.status(201).json({
    id: payment.id,
    userId: payment.userId,
    amount: Number(payment.amount),
    currency: payment.currency,
    paymentType: payment.paymentType,
    status: payment.status,
    submittedAt: payment.submittedAt,
    confirmedAt: payment.confirmedAt,
    notes: payment.notes,
  });
}

