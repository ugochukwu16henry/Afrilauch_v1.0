import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { AuthPayload } from '../middleware/auth';
import { convertUsdToCurrency } from '../services/currencyService';
import { createAuditLog } from '../services/auditLogService';
import { notify } from '../services/notificationService';
import { sendNotificationEmail } from '../services/emailService';
import { getPricingConfig, IDEA_STARTER_SETUP_FEE_USD, INVESTOR_SETUP_FEE_USD } from '../config/pricing';
import { isPaystackEnabled, getPaystackPublicKey, initializeTransaction, toSmallestUnit as paystackToSmallestUnit } from '../services/paystackService';

const prisma = new PrismaClient();

/** GET /api/v1/setup-fee/config — Public: centralized pricing config + Paystack public key when enabled */
export async function config(_req: Request, res: Response): Promise<void> {
  const config = getPricingConfig();
  const paystackPublicKey = getPaystackPublicKey();
  res.json({ ...config, paystackPublicKey: paystackPublicKey ?? undefined });
}

/** GET /api/v1/setup-fee/quote?currency=NGN — amount in user's currency */
export async function quote(req: Request, res: Response): Promise<void> {
  const currency = (req.query.currency as string) || 'USD';
  const payload = (req as unknown as { user?: AuthPayload }).user;
  const role = payload?.role;
  const usdAmount = role === 'investor' ? INVESTOR_SETUP_FEE_USD : IDEA_STARTER_SETUP_FEE_USD;
  try {
    const result = await convertUsdToCurrency(usdAmount, currency);
    res.json({
      amountUsd: usdAmount,
      amount: result.amount,
      currency: result.currency,
      rate: result.rate,
    });
  } catch (e) {
    res.status(500).json({ error: 'Currency conversion failed' });
  }
}

/** Amount in smallest currency unit (cents for USD) for Stripe */
function toSmallestUnit(amount: number, currency: string): number {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'].includes(code);
  return Math.round(amount * (noDecimalCurrencies ? 1 : 100));
}

/** POST /api/v1/setup-fee/create-session — create payment (Stripe or simulated); returns checkout URL */
export async function createSession(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { currency = 'USD' } = req.body as { currency?: string };
  const usdAmount = payload.role === 'investor' ? INVESTOR_SETUP_FEE_USD : IDEA_STARTER_SETUP_FEE_USD;
  const converted = await convertUsdToCurrency(usdAmount, currency);
  const reference = `setup_${payload.userId}_${Date.now()}`;

  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/dashboard?setup_success=1&ref=${encodeURIComponent(reference)}`;
  const cancelUrl = `${baseUrl}/dashboard?setup_cancel=1`;

  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { email: true } });

  const paymentRecord = await prisma.userPayment.create({
    data: {
      userId: payload.userId,
      amount: converted.amount,
      currency: converted.currency,
      type: 'setup_fee',
      status: 'pending',
      reference,
      metadata: {},
    },
  });

  if (isPaystackEnabled()) {
    try {
      const amountSmallest = paystackToSmallestUnit(converted.amount, converted.currency);
      const result = await initializeTransaction({
        email: user?.email ?? `user-${payload.userId}@riseflowhub.com`,
        amount: amountSmallest,
        reference,
        callbackUrl: successUrl,
        metadata: { type: 'setup_fee', userId: payload.userId },
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

  const { isStripeEnabled, createCheckoutSession } = await import('../services/stripeService');
  if (isStripeEnabled()) {
    try {
      const amountCents = toSmallestUnit(converted.amount, converted.currency);
      const session = await createCheckoutSession({
        amountCents,
        currency: converted.currency,
        reference,
        successUrl,
        cancelUrl,
        metadata: { type: 'setup_fee', userId: payload.userId },
        customerEmail: user?.email ?? undefined,
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
    gateway: 'simulated',
  });
}

/** POST /api/v1/setup-fee/verify — verify payment and unlock (call after gateway callback or simulated success) */
export async function verify(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { reference } = req.body as { reference: string };
  if (!reference?.trim()) {
    res.status(400).json({ error: 'reference required' });
    return;
  }
  const payment = await prisma.userPayment.findFirst({
    where: { reference: reference.trim(), userId: payload.userId, type: 'setup_fee' },
  });
  if (!payment) {
    res.status(404).json({ error: 'Payment not found' });
    return;
  }
  if (payment.status === 'completed') {
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { setupPaid: true } });
    res.json({ ok: true, setupPaid: user?.setupPaid ?? true });
    return;
  }
  await prisma.$transaction([
    prisma.userPayment.update({
      where: { id: payment.id },
      data: { status: 'completed', completedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: payload.userId },
      data: { setupPaid: true },
    }),
  ]);
  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'setup_paid',
    entityType: 'payment',
    entityId: payment.id,
    details: { type: 'setup_fee' },
  }).catch(() => {});
  const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true, email: true } });
  notify({
    userId: payload.userId,
    type: 'payment',
    title: 'Setup fee paid',
    message: 'Your setup payment was successful. You now have full access to your dashboard.',
    link: '/dashboard',
  }).catch(() => {});
  if (user?.email) {
    sendNotificationEmail({
      type: 'payment_confirmation',
      userEmail: user.email,
      dynamicData: { name: user.name, description: 'Setup fee', amount: `${payment.amount} ${payment.currency}` },
    }).catch(() => {});
  }
  res.json({ ok: true, setupPaid: true });
}

/** PUT /api/v1/setup-fee/skip — save skip reason and continue to limited dashboard */
export async function skip(req: Request, res: Response): Promise<void> {
  const payload = (req as unknown as { user: AuthPayload }).user;
  const { reason } = req.body as { reason: string };
  const allowed = ['cant_afford', 'pay_later', 'exploring', 'other'];
  const value = allowed.includes(reason) ? reason : 'other';
  await prisma.user.update({
    where: { id: payload.userId },
    data: { setupReason: value },
  });
  createAuditLog(prisma, {
    adminId: payload.userId,
    actionType: 'setup_skipped',
    entityType: 'user',
    entityId: payload.userId,
    details: { reason: value },
  }).catch(() => {});
  res.json({ ok: true, setupReason: value });
}
