/**
 * Stripe webhook: checkout.session.completed.
 * Paystack webhook: charge.success.
 * Both find payment by reference, mark completed, update Talent/Hirer/User, notify and email.
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  isStripeEnabled,
  isWebhookSecretSet,
  constructWebhookEvent,
} from '../services/stripeService';
import {
  isPaystackEnabled,
  verifyWebhookSignature,
  verifyTransaction,
} from '../services/paystackService';
import { createAuditLog } from '../services/auditLogService';
import { notify } from '../services/notificationService';
import { sendNotificationEmail } from '../services/emailService';

const prisma = new PrismaClient();

const FEE_TYPES = ['talent_marketplace_fee', 'hirer_platform_fee', 'setup_fee'] as const;

async function applyPaymentSuccess(
  payment: { id: string; userId: string; type: string; amount: unknown; currency: string },
  gateway: 'stripe' | 'paystack',
  metadataUpdate: Record<string, unknown>
): Promise<void> {
  const type = payment.type as (typeof FEE_TYPES)[number];
  await prisma.userPayment.update({
    where: { id: payment.id },
    data: {
      status: 'completed',
      completedAt: new Date(),
      metadata: metadataUpdate as import('@prisma/client').Prisma.InputJsonValue,
    },
  });

  if (type === 'talent_marketplace_fee') {
    await prisma.talent.updateMany({
      where: { userId: payment.userId },
      data: { feePaid: true },
    });
  } else if (type === 'hirer_platform_fee') {
    await prisma.hirer.updateMany({
      where: { userId: payment.userId },
      data: { feePaid: true, verified: true },
    });
  } else if (type === 'setup_fee') {
    await prisma.user.update({
      where: { id: payment.userId },
      data: { setupPaid: true },
    });
  }

  createAuditLog(prisma, {
    adminId: null,
    actionType: 'payment_webhook_completed',
    entityType: 'payment',
    entityId: payment.id,
    details: { type, reference: (metadataUpdate as { reference?: string }).reference, gateway },
  }).catch(() => {});

  const description = type === 'talent_marketplace_fee' ? 'Talent marketplace fee' : type === 'hirer_platform_fee' ? 'Hiring platform fee' : 'Setup fee';
  notify({
    userId: payment.userId,
    type: 'payment',
    title: 'Payment confirmed',
    message: `Your ${description} payment was successful. You now have full access.`,
    link: '/dashboard',
  }).catch(() => {});

  const user = await prisma.user.findUnique({ where: { id: payment.userId }, select: { name: true, email: true } });
  if (user?.email) {
    sendNotificationEmail({
      type: 'payment_confirmation',
      userEmail: user.email,
      dynamicData: {
        name: user.name,
        description,
        amount: `${Number(payment.amount)} ${payment.currency}`,
      },
    }).catch(() => {});
  }
}

export async function stripeWebhook(req: Request, res: Response): Promise<void> {
  if (!isStripeEnabled() || !isWebhookSecretSet()) {
    res.status(501).json({ error: 'Stripe webhook not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string | undefined;
  if (!sig) {
    res.status(400).json({ error: 'Missing stripe-signature' });
    return;
  }

  let event: import('stripe').Stripe.Event;
  try {
    event = constructWebhookEvent(req.body, sig);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    res.status(400).json({ error: message });
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    res.json({ received: true });
    return;
  }

  const session = event.data.object as import('stripe').Stripe.Checkout.Session;
  const reference = session.client_reference_id;
  if (!reference) {
    res.status(400).json({ error: 'Missing client_reference_id' });
    return;
  }

  const payment = await prisma.userPayment.findFirst({
    where: { reference, status: 'pending' },
  });
  if (!payment) {
    res.json({ received: true });
    return;
  }

  const metadata = (payment.metadata as Record<string, unknown>) || {};
  const updatedMetadata = {
    ...metadata,
    stripeSessionId: session.id,
    stripePaymentStatus: session.payment_status,
    reference,
    completedAt: new Date().toISOString(),
  };
  await applyPaymentSuccess(payment, 'stripe', updatedMetadata);
  res.json({ received: true });
}

/** Paystack webhook: charge.success. req.body is raw Buffer (use express.raw). */
export async function paystackWebhook(req: Request, res: Response): Promise<void> {
  if (!isPaystackEnabled()) {
    res.status(501).json({ error: 'Paystack webhook not configured' });
    return;
  }

  const signature = req.headers['x-paystack-signature'] as string | undefined;
  if (!signature) {
    res.status(400).json({ error: 'Missing x-paystack-signature' });
    return;
  }

  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    res.status(400).json({ error: 'Invalid body' });
    return;
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  let payload: { event?: string; data?: { reference?: string } };
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  if (payload.event !== 'charge.success') {
    res.json({ received: true });
    return;
  }

  const reference = payload.data?.reference;
  if (!reference) {
    res.status(400).json({ error: 'Missing reference' });
    return;
  }

  const verified = await verifyTransaction(reference);
  if (!verified || !verified.success) {
    res.status(400).json({ error: 'Transaction verification failed' });
    return;
  }

  const payment = await prisma.userPayment.findFirst({
    where: { reference, status: 'pending' },
  });
  if (!payment) {
    res.json({ received: true });
    return;
  }

  const metadata = (payment.metadata as Record<string, unknown>) || {};
  const updatedMetadata = {
    ...metadata,
    paystackReference: reference,
    paystackAmount: verified.amount,
    paystackCurrency: verified.currency,
    reference,
    completedAt: new Date().toISOString(),
  };
  await applyPaymentSuccess(payment, 'paystack', updatedMetadata);
  res.json({ received: true });
}
