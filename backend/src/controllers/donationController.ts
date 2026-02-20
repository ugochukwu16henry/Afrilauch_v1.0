import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import { createCheckoutSession, isStripeEnabled } from '../services/stripeService';
import { initializeTransaction, isPaystackEnabled, PaystackError, verifyTransaction } from '../services/paystackService';
import { sendNotificationEmail } from '../services/emailService';
import { getSignedObjectUrl } from '../services/uploadService';

const prisma = new PrismaClient();

const MIN_DONATION = 1;
const MAX_DONATION = 1000000;

type DonationRecord = {
  id: string;
  email: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  reference: string;
  metadata: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

type DonationDbRow = {
  id: string;
  email: string | null;
  amount: Prisma.Decimal | number | string;
  currency: string;
  payment_method: string;
  status: string;
  reference: string;
  metadata: Prisma.JsonValue | null;
  created_at?: Date;
  updated_at?: Date;
};

function mapDonation(row: DonationDbRow): DonationRecord {
  return {
    id: row.id,
    email: row.email,
    amount: typeof row.amount === 'number' ? row.amount : Number(row.amount),
    currency: row.currency,
    paymentMethod: row.payment_method,
    status: row.status,
    reference: row.reference,
    metadata: ((row.metadata as Record<string, unknown> | null) || {}) as Record<string, unknown>,
    createdAt: row.created_at ? row.created_at.toISOString() : undefined,
    updatedAt: row.updated_at ? row.updated_at.toISOString() : undefined,
  };
}

async function createDonationRecord(input: {
  email: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  status: string;
  reference: string;
  metadata: Record<string, unknown>;
}): Promise<DonationRecord> {
  const id = randomUUID();
  const metadata = JSON.stringify(input.metadata || {});
  const rows = await prisma.$queryRaw<DonationDbRow[]>`
    INSERT INTO "Donation" (
      "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata", "created_at", "updated_at"
    )
    VALUES (
      ${id}, ${input.email}, ${input.amount}, ${input.currency}, ${input.paymentMethod}, ${input.status}, ${input.reference}, ${metadata}::jsonb, NOW(), NOW()
    )
    RETURNING "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata"
  `;

  return mapDonation(rows[0]);
}

async function updateDonationRecord(id: string, input: { status?: string; metadata?: Record<string, unknown>; email?: string | null }): Promise<DonationRecord> {
  const rows = await prisma.$queryRaw<DonationDbRow[]>`
    UPDATE "Donation"
    SET
      "status" = COALESCE(${input.status ?? null}, "status"),
      "email" = COALESCE(${input.email ?? null}, "email"),
      "metadata" = COALESCE(${input.metadata ? JSON.stringify(input.metadata) : null}::jsonb, "metadata"),
      "updated_at" = NOW()
    WHERE "id" = ${id}
    RETURNING "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata"
  `;

  return mapDonation(rows[0]);
}

async function findDonationByReference(reference: string): Promise<DonationRecord | null> {
  const rows = await prisma.$queryRaw<DonationDbRow[]>`
    SELECT "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata", "created_at", "updated_at"
    FROM "Donation"
    WHERE "reference" = ${reference}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return mapDonation(rows[0]);
}

async function findDonationById(id: string): Promise<DonationRecord | null> {
  const rows = await prisma.$queryRaw<DonationDbRow[]>`
    SELECT "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata", "created_at", "updated_at"
    FROM "Donation"
    WHERE "id" = ${id}
    LIMIT 1
  `;
  if (!rows.length) return null;
  return mapDonation(rows[0]);
}

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
  const effectiveCurrency = paymentMethod === 'paystack' ? 'NGN' : normalizedCurrency;
  const normalizedEmail = email?.trim() ? email.trim().toLowerCase() : null;
  const reference = buildReference();
  const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/donate?status=success&ref=${encodeURIComponent(reference)}`;
  const cancelUrl = `${baseUrl}/donate?status=cancelled`;

  const donation = await createDonationRecord({
    email: normalizedEmail,
    amount: parsedAmount,
    currency: effectiveCurrency,
    paymentMethod,
    status: 'pending',
    reference,
    metadata: { source: 'homepage_popup' },
  });

  if (paymentMethod === 'bank_transfer') {
    res.status(201).json({
      donationId: donation.id,
      reference,
      status: donation.status,
      paymentMethod,
      currency: effectiveCurrency,
      instructions: {
        note: 'Use your donation reference as transfer narration so we can confirm your donation quickly.',
        ngn: {
          label: 'Naira (Nigeria)',
          bankName: 'Wema Bank PLC',
          accountName: 'Henry M Ugochukwu',
          accountNumber: '0442119025',
          currency: 'NGN',
        },
        usd: {
          label: 'USD (USA)',
          bankName: 'Lead Bank',
          accountName: 'HENRY MAOBUGHICHI UGOCHUKWU',
          accountNumber: '216833036586',
          routingNumber: '101019644',
          accountType: 'Personal Checking',
          bankAddress: '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA.',
          currency: 'USD',
        },
      },
    });
    return;
  }

  if (paymentMethod === 'paystack') {
    if (!isPaystackEnabled()) {
      await updateDonationRecord(donation.id, {
        status: 'failed',
        metadata: { gateway: 'paystack', reason: 'not_configured' },
      });
      res.status(503).json({ error: 'Paystack is not configured' });
      return;
    }

    try {
      const result = await initializeTransaction({
        email: normalizedEmail ?? `guest+${reference}@riseflowhub.com`,
        amount: toSmallestUnit(parsedAmount, effectiveCurrency),
        reference,
        callbackUrl: successUrl,
        currency: effectiveCurrency,
        metadata: { type: 'donation', donationId: donation.id },
      });

      if (!result) {
        throw new Error('Unable to initialize payment');
      }

      await updateDonationRecord(donation.id, {
        metadata: {
          gateway: 'paystack',
          accessCode: result.accessCode,
          authorizationUrl: result.authorizationUrl,
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
      await updateDonationRecord(donation.id, {
        status: 'failed',
        metadata: { gateway: 'paystack', reason: message },
      });
      res.status(502).json({ error: 'Paystack session failed', details: message });
      return;
    }
  }

  if (isStripeEnabled()) {
    try {
      const stripeSession = await createCheckoutSession({
        amountCents: toSmallestUnit(parsedAmount, effectiveCurrency),
        currency: effectiveCurrency,
        reference,
        successUrl,
        cancelUrl,
        metadata: { type: 'donation', donationId: donation.id },
        customerEmail: normalizedEmail ?? undefined,
      });

      if (!stripeSession) throw new Error('Unable to initialize card session');

      await updateDonationRecord(donation.id, {
        metadata: {
          gateway: 'stripe',
          sessionId: stripeSession.sessionId,
          checkoutUrl: stripeSession.url,
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
      await updateDonationRecord(donation.id, {
        status: 'failed',
        metadata: { gateway: 'stripe', reason: message },
      });
      res.status(502).json({ error: 'Card session failed', details: message });
      return;
    }
  }

  await updateDonationRecord(donation.id, {
    metadata: {
      gateway: 'simulated',
      checkoutUrl: `${successUrl}`,
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

  const donation = await findDonationByReference(reference.trim());
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

  const metadata = donation.metadata || {};
  const gateway = (metadata.gateway as string | undefined) || (donation.paymentMethod === 'paystack' ? 'paystack' : donation.paymentMethod === 'card' ? 'stripe' : 'simulated');

  if (gateway === 'paystack' && isPaystackEnabled()) {
    const verification = await verifyTransaction(donation.reference);
    if (verification?.success) {
      const updated = await updateDonationRecord(donation.id, {
        status: 'successful',
        metadata: {
          ...metadata,
          paystackAmount: verification.amount,
          paystackCurrency: verification.currency,
          completedAt: new Date().toISOString(),
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
    const updated = await updateDonationRecord(donation.id, {
      status: 'successful',
      metadata: {
        ...metadata,
        completedAt: new Date().toISOString(),
      },
    });
    res.json({ ok: true, status: 'successful', donation: updated });
    return;
  }

  res.json({ ok: true, status: donation.status, donation, message: 'Awaiting provider confirmation webhook.' });
}

export async function listBankTransferDonations(req: Request, res: Response): Promise<void> {
  const rawStatus = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : 'pending';
  const status = rawStatus || 'pending';
  if (!['pending', 'successful', 'failed'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  const rows = await prisma.$queryRaw<DonationDbRow[]>`
    SELECT "id", "email", "amount", "currency", "payment_method", "status", "reference", "metadata", "created_at", "updated_at"
    FROM "Donation"
    WHERE "payment_method" = 'bank_transfer' AND "status" = ${status}
    ORDER BY "created_at" DESC
    LIMIT 200
  `;

  const items = await Promise.all(
    rows.map(async (row) => {
      const donation = mapDonation(row);
      const metadata = donation.metadata || {};
      const proofKey = typeof metadata.proofKey === 'string' ? metadata.proofKey : '';
      if (proofKey) {
        try {
          const freshProofUrl = await getSignedObjectUrl(proofKey);
          donation.metadata = {
            ...metadata,
            ...(freshProofUrl ? { proofUrl: freshProofUrl } : {}),
          };
        } catch {
          donation.metadata = metadata;
        }
      }
      return donation;
    })
  );

  res.json({ items });
}

export async function submitBankTransferConfirmation(req: Request, res: Response): Promise<void> {
  const reference = String(req.body?.reference || '').trim();
  const proofUrl = String(req.body?.proofUrl || '').trim();
  const proofKey = String(req.body?.proofKey || '').trim();
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!reference) {
    res.status(400).json({ error: 'reference is required' });
    return;
  }
  if (!proofUrl && !proofKey) {
    res.status(400).json({ error: 'proofUrl or proofKey is required' });
    return;
  }

  const donation = await findDonationByReference(reference);
  if (!donation) {
    res.status(404).json({ error: 'Donation not found' });
    return;
  }
  if (donation.paymentMethod !== 'bank_transfer') {
    res.status(400).json({ error: 'This confirmation endpoint is for bank transfer donations only' });
    return;
  }
  if (donation.status === 'successful') {
    res.json({ ok: true, message: 'Donation already confirmed.', donation: { id: donation.id, reference: donation.reference, status: donation.status } });
    return;
  }

  const metadata = donation.metadata || {};
  const updated = await updateDonationRecord(donation.id, {
    email: email || donation.email,
    metadata: {
      ...metadata,
      ...(proofUrl ? { proofUrl } : {}),
      ...(proofKey ? { proofKey } : {}),
      payerNote: note || null,
      confirmationRequested: true,
      confirmationRequestedAt: new Date().toISOString(),
    },
  });

  res.json({
    ok: true,
    message: 'Payment confirmation submitted. Super admin will verify and approve shortly.',
    donation: { id: updated.id, reference: updated.reference, status: updated.status },
  });
}

export async function confirmBankTransferDonation(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id || '').trim();
  if (!id) {
    res.status(400).json({ error: 'Donation id is required' });
    return;
  }

  const donation = await findDonationById(id);
  if (!donation) {
    res.status(404).json({ error: 'Donation not found' });
    return;
  }

  if (donation.paymentMethod !== 'bank_transfer') {
    res.status(400).json({ error: 'Only bank transfer donations can be manually confirmed' });
    return;
  }

  if (donation.status === 'successful') {
    res.json({ ok: true, donation });
    return;
  }

  const admin = (req as Request & { user?: { userId?: string; email?: string } }).user;
  const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
  const metadata = donation.metadata || {};

  const updated = await updateDonationRecord(donation.id, {
    status: 'successful',
    metadata: {
      ...metadata,
      manuallyConfirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedByUserId: admin?.userId || null,
      confirmedByEmail: admin?.email || null,
      ...(note ? { adminNote: note } : {}),
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

  res.json({ ok: true, donation: updated });
}
