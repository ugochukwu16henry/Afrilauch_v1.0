'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getStoredToken, type GlobalBankAccount, type PaymentOptionsResponse, type User } from '@/lib/api';

type SetupMethod = 'auto' | 'stripe' | 'paystack' | 'bank_transfer';
const FALLBACK_METHODS: PaymentOptionsResponse['methods'] = ['paystack', 'bank_transfer'];

export default function SetupPaymentPage() {
  const [user, setUser] = useState<User | null>(null);
  const [quote, setQuote] = useState<{ amount: number; currency: string; amountUsd: number } | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<SetupMethod>('auto');
  const [availableMethods, setAvailableMethods] = useState<PaymentOptionsResponse['methods']>(FALLBACK_METHODS);
  const [bankAccounts, setBankAccounts] = useState<GlobalBankAccount[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currency, setCurrency] = useState<'USD' | 'NGN'>(() => {
    if (typeof navigator !== 'undefined' && navigator.language?.includes('NG')) return 'NGN';
    return 'USD';
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setInitializing(false);
      return;
    }

    Promise.all([
      api.auth.me(token),
      api.setupFee.quote(currency, token).catch(() => api.setupFee.quote('USD', token)),
      api.payments.options().catch(() => ({ methods: FALLBACK_METHODS } as PaymentOptionsResponse)),
    ])
      .then(([me, quoteRes, optionsRes]) => {
        setUser(me);
        setQuote({ amount: quoteRes.amount, currency: quoteRes.currency, amountUsd: quoteRes.amountUsd });
        const methods = (optionsRes.methods?.length ? optionsRes.methods : FALLBACK_METHODS).filter(
          (method): method is PaymentOptionsResponse['methods'][number] =>
            method === 'stripe' || method === 'paystack' || method === 'bank_transfer'
        );
        setAvailableMethods(methods.length ? methods : FALLBACK_METHODS);
        if (!methods.includes('stripe') && paymentMethod === 'stripe') {
          setPaymentMethod('auto');
        }
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Unable to load setup payment details.');
      })
      .finally(() => setInitializing(false));
  }, [currency]);

  function handleMethodChange(value: SetupMethod) {
    if (value === 'paystack' && currency !== 'NGN') {
      setCurrency('NGN');
    }
    setPaymentMethod(value);
  }

  async function handleStartPayment() {
    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const session = await api.setupFee.createSession(
        {
          currency,
          paymentMethod,
        },
        token
      );

      if (session.gateway === 'bank_transfer') {
        setBankAccounts(session.bankAccounts || []);
        setMessage(session.message || 'Bank transfer created and pending super admin confirmation.');
        setLoading(false);
        return;
      }

      if (!session.checkoutUrl) {
        setError('Payment session created but checkout URL is missing. Please try again.');
        setLoading(false);
        return;
      }

      window.location.href = session.checkoutUrl;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not start setup payment.';
      setError(msg);
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <p className="text-gray-600">Loading payment gateway…</p>
      </div>
    );
  }

  const token = getStoredToken();
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold text-secondary mb-2">Sign in to continue</h1>
          <p className="text-gray-600 text-sm mb-6">You need to log in before paying your setup fee.</p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl py-3 px-4 font-semibold text-white bg-primary hover:opacity-90"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (user?.setupPaid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold text-secondary mb-2">Setup fee already paid</h1>
          <p className="text-gray-600 text-sm mb-6">Your premium features are already unlocked.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl py-3 px-4 font-semibold text-white bg-primary hover:opacity-90"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-secondary mb-2">Payment Gateway</h1>
        <p className="text-gray-600 text-sm mb-6">Complete your one-time setup fee to unlock full platform access.</p>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Amount</p>
          <p className="text-2xl font-bold text-secondary">
            {quote ? `${quote.currency} ${quote.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
          </p>
          {quote && quote.currency !== 'USD' ? (
            <p className="text-xs text-gray-500 mt-1">≈ USD {quote.amountUsd}</p>
          ) : null}
          <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
            <span>Currency:</span>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'USD' | 'NGN')}
              className="rounded border border-gray-300 px-2 py-1 text-xs"
            >
              <option value="USD">USD</option>
              <option value="NGN">NGN</option>
            </select>
          </div>
        </div>

        <label className="block text-sm text-gray-600 mb-2">Payment method</label>
        <select
          value={paymentMethod}
          onChange={(e) => handleMethodChange(e.target.value as SetupMethod)}
          className="mb-4 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="auto">Auto (best available)</option>
          {availableMethods.includes('stripe') ? <option value="stripe">Pay with Card (Global)</option> : null}
          {availableMethods.includes('paystack') ? <option value="paystack">Paystack (Africa)</option> : null}
          {availableMethods.includes('bank_transfer') ? <option value="bank_transfer">Bank Transfer (manual confirmation)</option> : null}
        </select>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
        {message && <p className="text-sm text-emerald-700 mb-4">{message}</p>}

        {bankAccounts.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2 text-sm mb-4">
            <p className="font-medium text-amber-800">Bank transfer pending confirmation</p>
            {bankAccounts.map((account, index) => (
              <div key={`${account.accountNumber}-${index}`} className="rounded border border-amber-200 bg-white p-2 text-xs text-gray-700">
                <p><span className="font-medium">{account.label}</span> ({account.currency})</p>
                <p>{account.bankName}</p>
                <p>{account.accountName} — {account.accountNumber}</p>
                {account.routingNumber ? <p>Routing: {account.routingNumber}</p> : null}
              </div>
            ))}
            <p className="text-xs text-amber-900">After transfer, super admin confirmation automatically unlocks your setup access.</p>
          </div>
        )}

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 inline-flex items-center justify-center rounded-xl py-3 px-4 font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleStartPayment}
            disabled={loading}
            className="flex-1 rounded-xl py-3 px-4 font-semibold text-white bg-primary hover:opacity-90"
          >
            {loading ? 'Processing…' : 'Pay setup fee'}
          </button>
        </div>
      </div>
    </div>
  );
}
