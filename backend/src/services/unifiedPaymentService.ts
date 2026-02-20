import { createCheckoutSession, isStripeEnabled } from './stripeService';
import {
  initializeTransaction,
  isPaystackEnabled,
  PaystackError,
  toSmallestUnit as paystackToSmallestUnit,
} from './paystackService';

export type UnifiedPaymentMethod = 'auto' | 'stripe' | 'paystack' | 'bank_transfer' | 'other';

export interface UnifiedSessionInput {
  amount: number;
  currency: string;
  reference: string;
  userEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: { type: string; userId?: string; donationId?: string };
  method?: UnifiedPaymentMethod;
}

export interface UnifiedSessionResult {
  gateway: 'stripe' | 'paystack' | 'bank_transfer' | 'other' | 'simulated';
  checkoutUrl?: string;
  providerRef?: string;
  note?: string;
}

function toSmallestUnit(amount: number, currency: string): number {
  const code = (currency || 'USD').toUpperCase().slice(0, 3);
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND'].includes(code);
  return Math.round(amount * (noDecimalCurrencies ? 1 : 100));
}

function orderedGateways(currency: string, method: UnifiedPaymentMethod): Array<'stripe' | 'paystack'> {
  if (method === 'stripe') return ['stripe'];
  if (method === 'paystack') return ['paystack'];
  if (method === 'auto') {
    return currency.toUpperCase() === 'NGN' ? ['paystack', 'stripe'] : ['stripe', 'paystack'];
  }
  return [];
}

export async function createUnifiedCheckoutSession(input: UnifiedSessionInput): Promise<UnifiedSessionResult> {
  const preferredMethod = input.method || 'auto';

  if (preferredMethod === 'bank_transfer') {
    return { gateway: 'bank_transfer' };
  }

  if (preferredMethod === 'other') {
    return { gateway: 'other' };
  }

  const gateways = orderedGateways(input.currency, preferredMethod);
  let lastError: string | null = null;

  for (const gateway of gateways) {
    if (gateway === 'paystack') {
      if (!isPaystackEnabled()) {
        lastError = 'Paystack is not configured';
        continue;
      }
      try {
        const result = await initializeTransaction({
          email: input.userEmail ?? `guest+${input.reference}@riseflowhub.com`,
          amount: paystackToSmallestUnit(input.amount, input.currency),
          reference: input.reference,
          callbackUrl: input.successUrl,
          metadata: input.metadata,
          currency: input.currency,
        });
        if (result) {
          return {
            gateway: 'paystack',
            checkoutUrl: result.authorizationUrl,
            providerRef: result.accessCode,
          };
        }
      } catch (error) {
        lastError = error instanceof PaystackError ? error.message : error instanceof Error ? error.message : 'Paystack failed';
      }
      continue;
    }

    if (gateway === 'stripe') {
      if (!isStripeEnabled()) {
        lastError = 'Stripe is not configured';
        continue;
      }
      try {
        const result = await createCheckoutSession({
          amountCents: toSmallestUnit(input.amount, input.currency),
          currency: input.currency,
          reference: input.reference,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          metadata: input.metadata,
          customerEmail: input.userEmail,
        });
        if (result) {
          return {
            gateway: 'stripe',
            checkoutUrl: result.url,
            providerRef: result.sessionId,
          };
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Stripe failed';
      }
    }
  }

  if (preferredMethod === 'auto') {
    return {
      gateway: 'simulated',
      checkoutUrl: input.successUrl,
      note: lastError || 'No live gateway available; using simulated checkout fallback',
    };
  }

  throw new Error(lastError || 'Selected payment method is unavailable');
}
