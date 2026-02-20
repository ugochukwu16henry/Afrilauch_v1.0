import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createCheckoutSession, isStripeEnabled } from '../services/stripeService';
import { initializeTransaction, isPaystackEnabled, PaystackError, verifyTransaction } from '../services/paystackService';
import { sendNotificationEmail } from '../services/emailService';

const prisma = new PrismaClient();

const MIN_DONATION = 1;
const MAX_DONATION = 1000000;

function parseAmount(value: unknown): number {
  const numeric = typeof value === 'string' ? Number(value) : (value as number);
  if (!Number.isFinite(numeric)) return NaN;
  return Number(numeric.toFixed(2));
}

function toSmallestUnit(amount: number, currency: string): number {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'].includes(code);
  return Math.round(amount * (noDecimalCurrencies ? 1 : 100));
}

function buildReference(): string {
  return `don_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createSession(req: Request, res: Response): Promise<void> {
  const { amount, paymentMethod, email, currency = 'USD' } = req.body as {
    amount: number;
    paymentMethod: 'card' | 'paystack' | 'bank_transfer';
    email?: string;
    currency?: string;
  };

  const parsedAmount = parseAmount(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < MIN_DONATION || parsedAmount > MAX_DONATION) {
    res.status(400).json({ error: `Donation amount must be between ${MIN_DONATION} and ${MAX_DONATION}` });
    return;
  }

  if (!['card', 'paystack', 'bank_transfer'].includes(paymentMethod)) {
    res.status(400).json({ error: 'Unsupported payment method' });
    return;
  }

  const normalizedCurrency = (currency || 'USD').toUpperCase().slice(0, 3);
  const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;
  const reference = buildReference();
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/donate?status=success&ref=${encodeURIComponent(reference)}`;
  const cancelUrl = `${baseUrl}/donate?status=cancelled`;

  const donation = await prisma.donation.create({
    data: {
      email: normalizedEmail,
      amount: parsedAmount,
      currency: normalizedCurrency,
      paymentMethod,
      status: 'pending',
      reference,
      metadata: { source: 'homepage_popup' },
    },
  });

  if (paymentMethod === 'bank_transfer') {
    res.status(201).json({
      donationId: donation.id,
      reference,
      status: donation.status,
      paymentMethod,
      instructions: {
        bankName: 'RiseFlow Hub Bank',
        accountName: 'RiseFlow Hub',
        accountNumber: '0000000000',
        note: 'Use your donation reference as transfer narration and upload proof via support if requested.',
      },
    });
    return;
  }

  if (paymentMethod === 'paystack') {
    if (!isPaystackEnabled()) {
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: 'failed', metadata: { gateway: 'paystack', reason: 'not_configured' } },
      });
      res.status(503).json({ error: 'Paystack is not configured' });
      return;
    }

    try {
      const result = await initializeTransaction({
        email: normalizedEmail ?? `guest+${reference}@riseflowhub.com`,
        amount: toSmallestUnit(parsedAmount, normalizedCurrency),
        reference,
        callbackUrl: successUrl,
        currency: normalizedCurrency,
        metadata: { type: 'donation', donationId: donation.id },
      });

      if (!result) {
        throw new Error('Unable to initialize payment');
      }

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          metadata: {
            gateway: 'paystack',
            accessCode: result.accessCode,
            authorizationUrl: result.authorizationUrl,
          },
        },
      });

      res.status(201).json({
        donationId: donation.id,
        reference,
        paymentMethod,
        checkoutUrl: result.authorizationUrl,
        successUrl,
        cancelUrl,
      });
      return;
    } catch (error) {
      const message = error instanceof PaystackError ? error.message : error instanceof Error ? error.message : 'Paystack session failed';
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'failed',
          metadata: { gateway: 'paystack', reason: message },
        },
      });
      res.status(502).json({ error: 'Paystack session failed', details: message });
      return;
    }
  }

  if (isStripeEnabled()) {
    try {
      const stripeSession = await createCheckoutSession({
        amountCents: toSmallestUnit(parsedAmount, normalizedCurrency),
        currency: normalizedCurrency,
        reference,
        successUrl,
        cancelUrl,
        metadata: { type: 'donation', donationId: donation.id },
        customerEmail: normalizedEmail ?? undefined,
      });

      if (!stripeSession) throw new Error('Unable to initialize card session');

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          metadata: {
            gateway: 'stripe',
            sessionId: stripeSession.sessionId,
            checkoutUrl: stripeSession.url,
          },
        },
      });

      res.status(201).json({
        donationId: donation.id,
        reference,
        paymentMethod,
        checkoutUrl: stripeSession.url,
        successUrl,
        cancelUrl,
      });
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Card session failed';
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'failed',
          metadata: { gateway: 'stripe', reason: message },
        },
      });
      res.status(502).json({ error: 'Card session failed', details: message });
      return;
    }
  }

  await prisma.donation.update({
    where: { id: donation.id },
    data: {
      metadata: {
        gateway: 'simulated',
        checkoutUrl: `${successUrl}`,
      },
    },
  });

  res.status(201).json({
    donationId: donation.id,
    reference,
    paymentMethod,
    checkoutUrl: successUrl,
    successUrl,
    cancelUrl,
    gateway: 'simulated',
  });
}

export async function verify(req: Request, res: Response): Promise<void> {
  const { reference } = req.body as { reference: string };
  if (!reference?.trim()) {
    res.status(400).json({ error: 'reference is required' });
    return;
  }

  const donation = await prisma.donation.findUnique({ where: { reference: reference.trim() } });
  if (!donation) {
    res.status(404).json({ error: 'Donation not found' });
    return;
  }

  if (donation.status === 'successful') {
    res.json({ ok: true, status: 'successful', donation });
    return;
  }

  if (donation.paymentMethod === 'bank_transfer') {
    res.json({ ok: true, status: 'pending', donation, message: 'Bank transfer donation is pending manual confirmation.' });
    return;
  }

  const metadata = (donation.metadata || {}) as Record<string, unknown>;
  const gateway = (metadata.gateway as string | undefined) || (donation.paymentMethod === 'paystack' ? 'paystack' : donation.paymentMethod === 'card' ? 'stripe' : 'simulated');

  if (gateway === 'paystack' && isPaystackEnabled()) {
    const verification = await verifyTransaction(donation.reference);
    if (verification?.success) {
      const updated = await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'successful',
          metadata: {
            ...metadata,
            paystackAmount: verification.amount,
            paystackCurrency: verification.currency,
            completedAt: new Date().toISOString(),
          },
        },
      });
      if (updated.email) {
        sendNotificationEmail({
          type: 'payment_receipt',
          userEmail: updated.email,
          dynamicData: {
            name: 'Supporter',
            amount: Number(updated.amount),
            currency: updated.currency,
            paymentType: 'donation',
          },
        }).catch(() => {});
      }
      res.json({ ok: true, status: 'successful', donation: updated });
      return;
    }
    res.json({ ok: true, status: donation.status, donation, message: 'Payment is still processing.' });
    return;
  }

  if (gateway === 'simulated') {
    const updated = await prisma.donation.update({
      where: { id: donation.id },
      data: {
        status: 'successful',
        metadata: {
          ...metadata,
          completedAt: new Date().toISOString(),
        },
      },
    });
    res.json({ ok: true, status: 'successful', donation: updated });
    return;
  }

  res.json({ ok: true, status: donation.status, donation, message: 'Awaiting provider confirmation webhook.' });
}
