/**
 * Paystack live API: initialize transaction, verify transaction, webhook signature verification.
 * Use PAYSTACK_SECRET_KEY and PAYSTACK_PUBLIC_KEY in .env (never commit live keys).
 */

const PAYSTACK_BASE = 'https://api.paystack.co';
const secretKey = process.env.PAYSTACK_SECRET_KEY?.trim();

export function isPaystackEnabled(): boolean {
  return !!secretKey && secretKey.startsWith('sk_');
}

export function getPaystackPublicKey(): string | null {
  const pk = process.env.PAYSTACK_PUBLIC_KEY?.trim();
  return pk && pk.startsWith('pk_') ? pk : null;
}

/** Amount in smallest unit: kobo for NGN, cents for USD, etc. */
export function toSmallestUnit(amount: number, currency: string): number {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  const noDecimal = ['JPY', 'KRW', 'VND'].includes(code);
  return Math.round(amount * (noDecimal ? 1 : 100));
}

export interface InitializeParams {
  email: string;
  amount: number; // already in kobo/cents
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, string>;
  currency?: string;
}

export interface InitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

/** POST /transaction/initialize — returns URL to redirect user to Paystack. */
export async function initializeTransaction(
  params: InitializeParams
): Promise<InitializeResult | null> {
  if (!isPaystackEnabled()) return null;
  const body: Record<string, unknown> = {
    email: params.email,
    amount: params.amount,
    reference: params.reference,
    callback_url: params.callbackUrl,
    metadata: params.metadata ?? {},
  };
  if (params.currency && params.currency.toUpperCase() !== 'NGN') {
    body.currency = params.currency.toUpperCase();
  }
  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Paystack initialize failed: ${res.status}`);
  }
  const data = (await res.json()) as { status?: boolean; data?: { authorization_url: string; access_code: string; reference: string } };
  if (!data.status || !data.data?.authorization_url) return null;
  return {
    authorizationUrl: data.data.authorization_url,
    accessCode: data.data.access_code,
    reference: data.data.reference,
  };
}

export interface VerifyResult {
  success: boolean;
  reference: string;
  amount: number;
  currency: string;
  status: string;
}

/** GET /transaction/verify/:reference */
export async function verifyTransaction(reference: string): Promise<VerifyResult | null> {
  if (!isPaystackEnabled()) return null;
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    status?: boolean;
    data?: {
      reference: string;
      amount: number;
      currency: string;
      status: string;
    };
  };
  if (!data.status || !data.data) return null;
  return {
    success: data.data.status === 'success',
    reference: data.data.reference,
    amount: data.data.amount / 100,
    currency: data.data.currency || 'NGN',
    status: data.data.status,
  };
}

/** Verify x-paystack-signature (HMAC SHA512 of raw body using secret key). */
export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  if (!secretKey || !signature) return false;
  const crypto = require('crypto');
  const hmac = crypto.createHmac('sha512', secretKey);
  hmac.update(payload);
  const computed = hmac.digest('hex');
  return computed === signature;
}
