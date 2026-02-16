/**
 * Stripe integration for checkout sessions and webhook verification.
 * When STRIPE_SECRET_KEY is set, create-session returns a real Stripe Checkout URL.
 * Webhook at POST /api/v1/webhooks/stripe updates payments and unlocks access.
 */

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

export const stripe =
  secretKey && secretKey.startsWith('sk_')
    ? new Stripe(secretKey)
    : null;

export function isStripeEnabled(): boolean {
  return !!stripe;
}

export function isWebhookSecretSet(): boolean {
  return !!webhookSecret && webhookSecret.startsWith('whsec_');
}

export interface CreateCheckoutParams {
  amountCents: number;
  currency: string;
  reference: string;
  successUrl: string;
  cancelUrl: string;
  metadata: { type: string; userId: string };
  customerEmail?: string;
}

export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<{ url: string; sessionId: string } | null> {
  if (!stripe) return null;
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amountCents,
          product_data: {
            name:
              params.metadata.type === 'talent_marketplace_fee'
                ? 'Talent Marketplace Fee'
                : params.metadata.type === 'hirer_platform_fee'
                  ? 'Hiring Company Platform Fee'
                  : 'RiseFlow Setup Fee',
            description: 'One-time payment',
          },
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.reference,
    metadata: params.metadata,
    ...(params.customerEmail && { customer_email: params.customerEmail }),
  });
  if (!session.url) throw new Error('Stripe did not return checkout URL');
  return { url: session.url, sessionId: session.id };
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe!.webhooks.constructEvent(
    payload,
    signature,
    webhookSecret
  ) as Stripe.Event;
}
