import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { convertUsdToCurrency } from '../services/currencyService';
import { createAuditLog } from '../services/auditLogService';
import { notify } from '../services/notificationService';
import { sendNotificationEmail } from '../services/emailService';
import { isStripeEnabled, createCheckoutSession } from '../services/stripeService';
import { isPaystackEnabled, initializeTransaction, toSmallestUnit as paystackToSmallestUnit } from '../services/paystackService';
import { TALENT_MARKETPLACE_FEE_USD, HIRER_PLATFORM_FEE_USD } from '../config/pricing';

const prisma = new PrismaClient();

const FEE_TYPES = ['talent_marketplace_fee', 'hirer_platform_fee'] as const;

/** Amount in smallest currency unit (cents for USD, kobo for NGN) */
function toSmallestUnit(amount: number, currency: string): number {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'].includes(code);
  return Math.round(amount * (noDecimalCurrencies ? 1 : 100));
}

/** POST /api/v1/marketplace-fee/create-session — Create payment for talent ($7) or hirer ($20) fee */
export async function createSession(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { type, currency = 'USD' } = req.body as { type: 'talent_marketplace_fee' | 'hirer_platform_fee'; currency?: string };

  if (!type || !FEE_TYPES.includes(type)) {
    res.status(400).json({ error: 'type must be talent_marketplace_fee or hirer_platform_fee' });
    return;
  }

  if (type === 'talent_marketplace_fee' && payload.role !== 'talent') {
    res.status(403).json({ error: 'Only talent can pay talent marketplace fee' });
    return;
  }
  if (type === 'hirer_platform_fee' && payload.role !== 'hirer' && payload.role !== 'hiring_company') {
    res.status(403).json({ error: 'Only hiring company can pay platform fee' });
    return;
  }

  const usdAmount = type === 'talent_marketplace_fee' ? TALENT_MARKETPLACE_FEE_USD : HIRER_PLATFORM_FEE_USD;
  const converted = await convertUsdToCurrency(usdAmount, currency);
  const reference = `${type}_${payload.userId}_${Date.now()}`;

  if (type === 'talent_marketplace_fee') {
    const talent = await prisma.talent.findUnique({ where: { userId: payload.userId } });
    if (!talent) {
      res.status(400).json({ error: 'Talent profile required' });
      return;
    }
    if (talent.feePaid) {
      res.json({ ok: true, alreadyPaid: true, feePaid: true });
      return;
    }
  } else {
    const hirer = await prisma.hirer.findUnique({ where: { userId: payload.userId } });
    if (!hirer) {
      res.status(400).json({ error: 'Hirer profile required' });
      return;
    }
    if (hirer.feePaid) {
      res.json({ ok: true, alreadyPaid: true, feePaid: true });
      return;
    }
  }

  const paymentRecord = await prisma.userPayment.create({
    data: {
      userId: payload.userId,
      amount: converted.amount,
      currency: converted.currency,
      type,
      status: 'pending',
      reference,
      metadata: {},
    },
  });

  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/dashboard?marketplace_fee_success=1&ref=${encodeURIComponent(reference)}&type=${type}`;
  const cancelUrl = `${baseUrl}/dashboard?marketplace_fee_cancel=1`;

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });

  if (isPaystackEnabled()) {
    try {
      const amountSmallest = paystackToSmallestUnit(converted.amount, converted.currency);
      const result = await initializeTransaction({
        email: user?.email ?? `user-${payload.userId}@riseflowhub.com`,
        amount: amountSmallest,
        reference,
        callbackUrl: successUrl,
        metadata: { type, userId: payload.userId },
        currency: converted.currency,
      });
      if (result) {
        await prisma.userPayment.update({
          where: { id: paymentRecord.id },
          data: { metadata: { gateway: 'paystack', accessCode: result.accessCode } },
        });
        res.json({
          sessionId: reference,
          checkoutUrl: result.authorizationUrl,
          amount: converted.amount,
          currency: converted.currency,
          amountUsd: usdAmount,
          type,
          gateway: 'paystack',
        });
        return;
      }
    } catch (err) {
      await prisma.userPayment.update({
        where: { id: paymentRecord.id },
        data: { status: 'failed', metadata: { gateway: 'paystack', error: String(err) } },
      }).catch(() => {});
      res.status(502).json({ error: 'Payment provider error', details: err instanceof Error ? err.message : 'Unknown' });
      return;
    }
  }

  if (isStripeEnabled()) {
    try {
      const amountCents = toSmallestUnit(converted.amount, converted.currency);
      const session = await createCheckoutSession({
        amountCents,
        currency: converted.currency,
        reference,
        successUrl,
        cancelUrl,
        metadata: { type, userId: payload.userId },
      });
      if (session) {
        await prisma.userPayment.update({
          where: { id: paymentRecord.id },
          data: { metadata: { gateway: 'stripe', sessionId: session.sessionId } },
        });
        res.json({
          sessionId: reference,
          checkoutUrl: session.url,
          amount: converted.amount,
          currency: converted.currency,
          amountUsd: usdAmount,
          type,
          gateway: 'stripe',
        });
        return;
      }
    } catch (err) {
      await prisma.userPayment.update({
        where: { id: paymentRecord.id },
        data: { status: 'failed', metadata: { gateway: 'stripe', error: String(err) } },
      }).catch(() => {});
      res.status(502).json({ error: 'Payment provider error', details: err instanceof Error ? err.message : 'Unknown' });
      return;
    }
  }

  res.json({
    sessionId: reference,
    checkoutUrl: `${baseUrl}/setup-payment?ref=${encodeURIComponent(reference)}&amount=${converted.amount}&currency=${converted.currency}&success=${encodeURIComponent(successUrl)}&cancel=${encodeURIComponent(cancelUrl)}`,
    amount: converted.amount,
    currency: converted.currency,
    amountUsd: usdAmount,
    type,
    gateway: 'simulated',
  });
}

/** POST /api/v1/marketplace-fee/verify — Verify payment and set feePaid on Talent or Hirer */
export async function verify(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { reference } = req.body as { reference: string };

  if (!reference?.trim()) {
    res.status(400).json({ error: 'reference required' });
    return;
  }

  const payment = await prisma.userPayment.findFirst({
    where: {
      reference: reference.trim(),
      userId: payload.userId,
      type: { in: [...FEE_TYPES] },
    },
  });

  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }

  if (payment.status === 'completed') {
    const feePaid = payment.type === 'talent_marketplace_fee'
      ? (await prisma.talent.findUnique({ where: { userId: payload.userId }, select: { feePaid: true } }))?.feePaid
      : (await prisma.hirer.findUnique({ where: { userId: payload.userId }, select: { feePaid: true } }))?.feePaid;
    res.json({ ok: true, feePaid: feePaid ?? true });
    return;
  }

  await prisma.userPayment.update({
    where: { id: payment.id },
    data: { status: 'completed', completedAt: new Date() },
  });

  if (payment.type === 'talent_marketplace_fee') {
    await prisma.talent.updateMany({
      where: { userId: payload.userId },
      data: { feePaid: true },
    });
  } else {
    await prisma.hirer.updateMany({
      where: { userId: payload.userId },
      data: { feePaid: true, verified: true },
    });
  }

  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'marketplace_fee_paid',
    entityType: 'payment',
    entityId: payment.id,
    details: { type: payment.type },
  }).catch(() => {});

  const description = payment.type === 'talent_marketplace_fee' ? 'Talent marketplace fee' : 'Hiring company platform fee';
  notify({
    userId: payload.userId,
    type: 'payment',
    title: 'Payment confirmed',
    message: `${description} paid successfully. You now have full marketplace access.`,
    link: '/dashboard',
  }).catch(() => {});
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true, email: true } });
  if (user?.email) {
    sendNotificationEmail({
      type: 'payment_confirmation',
      userEmail: user.email,
      dynamicData: { name: user.name, description, amount: `${payment.amount} ${payment.currency}` },
    }).catch(() => {});
  }

  res.json({ ok: true, feePaid: true });
}
