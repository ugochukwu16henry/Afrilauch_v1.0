import { isStripeEnabled } from '../services/stripeService';
import { isPaystackEnabled } from '../services/paystackService';

export type GlobalPaymentMethod = 'stripe' | 'paystack' | 'bank_transfer' | 'other';

export interface BankAccountConfig {
  label: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  currency: string;
  routingNumber?: string;
  accountType?: string;
  bankAddress?: string;
}

export interface PaymentConfig {
  supportedCurrencies: string[];
  methods: GlobalPaymentMethod[];
  transferLink?: string;
  bankAccounts: BankAccountConfig[];
}

function parseCsv(value: string | undefined, fallback: string[]): string[] {
  if (!value?.trim()) return fallback;
  return value
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export function getPaymentConfig(): PaymentConfig {
  const supportedCurrencies = parseCsv(process.env.PAYMENT_SUPPORTED_CURRENCIES, ['USD', 'NGN']);

  const methods: GlobalPaymentMethod[] = [];
  if (isStripeEnabled()) methods.push('stripe');
  if (isPaystackEnabled()) methods.push('paystack');
  methods.push('bank_transfer');
  if (process.env.PAYMENT_ENABLE_OTHER_CHECKOUT === 'true') {
    methods.push('other');
  }

  const bankAccounts: BankAccountConfig[] = [
    {
      label: process.env.BANK_NGN_LABEL || 'Naira (Nigeria)',
      bankName: process.env.BANK_NGN_NAME || 'Wema Bank PLC',
      accountName: process.env.BANK_NGN_ACCOUNT_NAME || 'Henry M Ugochukwu',
      accountNumber: process.env.BANK_NGN_ACCOUNT_NUMBER || '0442119025',
      currency: process.env.BANK_NGN_CURRENCY || 'NGN',
    },
    {
      label: process.env.BANK_USD_LABEL || 'USD (USA)',
      bankName: process.env.BANK_USD_NAME || 'Lead Bank',
      accountName: process.env.BANK_USD_ACCOUNT_NAME || 'HENRY MAOBUGHICHI UGOCHUKWU',
      accountNumber: process.env.BANK_USD_ACCOUNT_NUMBER || '216833036586',
      routingNumber: process.env.BANK_USD_ROUTING_NUMBER || '101019644',
      accountType: process.env.BANK_USD_ACCOUNT_TYPE || 'Personal Checking',
      bankAddress: process.env.BANK_USD_ADDRESS || '9450 Southwest Gemini Drive, Beaverton, OR, 97008, USA.',
      currency: process.env.BANK_USD_CURRENCY || 'USD',
    },
  ];

  return {
    supportedCurrencies,
    methods,
    transferLink: process.env.PAYMENT_TRANSFER_LINK || undefined,
    bankAccounts,
  };
}
