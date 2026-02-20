'use client';

import Link from 'next/link';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function DonatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <DonatePageContent />
    </Suspense>
  );
}

function DonatePageContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const status = searchParams.get('status');

  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'NGN'>('USD');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paystack' | 'bank_transfer'>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankInstructions, setBankInstructions] = useState<{
    reference: string;
    note: string;
    ngn: {
      label: string;
      bankName: string;
      accountName: string;
      accountNumber: string;
      currency: string;
    };
    usd: {
      label: string;
      bankName: string;
      accountName: string;
      accountNumber: string;
      routingNumber: string;
      accountType: string;
      bankAddress: string;
      currency: string;
    };
  } | null>(null);
  const [verified, setVerified] = useState<{ ok: boolean; status: 'pending' | 'successful' | 'failed'; message?: string } | null>(null);

  const resolvedAmount = useMemo(() => {
    if (customAmount.trim()) {
      const parsed = Number(customAmount);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return amount;
  }, [amount, customAmount]);

  useEffect(() => {
    if (!reference) return;
    if (status !== 'success') return;

    api.donations
      .verify(reference)
      .then((result) => setVerified({ ok: result.ok, status: result.status, message: result.message }))
      .catch(() => setVerified({ ok: false, status: 'pending', message: 'Unable to verify right now. Please refresh shortly.' }));
  }, [reference, status]);

  async function handleDonate() {
    setLoading(true);
    setError(null);
    setBankInstructions(null);

    try {
      const effectiveCurrency = paymentMethod === 'paystack' ? 'NGN' : currency;
      const response = await api.donations.createSession({
        amount: resolvedAmount,
        paymentMethod,
        currency: effectiveCurrency,
        email: email.trim() || undefined,
      });

      if (response.paymentMethod === 'bank_transfer' && response.instructions) {
        setBankInstructions({
          reference: response.reference,
          note: response.instructions.note,
          ngn: response.instructions.ngn,
          usd: response.instructions.usd,
        });
        return;
      }

      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }

      setError('Unable to start donation payment. Please try again.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process donation.');
    } finally {
      setLoading(false);
    }
  }

  const showSuccess = status === 'success' && verified?.status === 'successful';

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-text-dark sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-secondary sm:text-4xl">Support the Mission</h1>
          <p className="mt-3 text-sm text-gray-600 sm:text-base">
            Your donation helps us equip founders with the tools, structure, and support needed to grow sustainable businesses.
          </p>
        </div>

        {showSuccess && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-emerald-800">Thank you for your support!</h2>
            <p className="mt-2 text-sm text-emerald-700">
              Your donation was received successfully.
            </p>
            <p className="mt-4 text-sm text-gray-700">Would you like to create an account to track your contributions?</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
                Create Account
              </Link>
              <Link href="/" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                Continue as Guest
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold text-secondary">Choose donation amount</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PRESET_AMOUNTS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmount(preset);
                  setCustomAmount('');
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  !customAmount && amount === preset
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Custom Amount</label>
            <input
              type="number"
              min={1}
              step="0.01"
              value={customAmount}
              onChange={(event) => setCustomAmount(event.target.value)}
              placeholder="Enter custom amount"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-secondary">Payment method</h3>
            <div className="mt-3 space-y-2">
              {[
                { value: 'card', label: 'Card (Stripe)' },
                { value: 'paystack', label: 'Paystack (secure checkout)' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
              ].map((method) => (
                <label key={method.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => {
                      const next = method.value as 'card' | 'paystack' | 'bank_transfer';
                      setPaymentMethod(next);
                      if (next === 'paystack') setCurrency('NGN');
                    }}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as 'USD' | 'NGN')}
                disabled={paymentMethod === 'paystack'}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
              </select>
              {paymentMethod === 'paystack' && (
                <p className="mt-1 text-xs text-gray-500">Paystack donation checkout is linked in NGN.</p>
              )}
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          {bankInstructions && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Bank Transfer Instructions</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-amber-300 bg-white p-3 text-xs text-gray-800">
                  <p className="font-semibold text-amber-900">{bankInstructions.ngn.label} — Wema Bank</p>
                  <p className="mt-1">Bank: {bankInstructions.ngn.bankName}</p>
                  <p>Account Name: {bankInstructions.ngn.accountName}</p>
                  <p>Account Number: {bankInstructions.ngn.accountNumber}</p>
                  <p>Currency: {bankInstructions.ngn.currency}</p>
                </div>
                <div className="rounded-lg border border-amber-300 bg-white p-3 text-xs text-gray-800">
                  <p className="font-semibold text-amber-900">{bankInstructions.usd.label} — Lead Bank</p>
                  <p className="mt-1">Bank: {bankInstructions.usd.bankName}</p>
                  <p>Account Name: {bankInstructions.usd.accountName}</p>
                  <p>Account Number: {bankInstructions.usd.accountNumber}</p>
                  <p>Routing Number: {bankInstructions.usd.routingNumber}</p>
                  <p>Account Type: {bankInstructions.usd.accountType}</p>
                  <p>Bank Address: {bankInstructions.usd.bankAddress}</p>
                  <p>Currency: {bankInstructions.usd.currency}</p>
                </div>
              </div>
              <p className="mt-2 font-medium">Reference: {bankInstructions.reference}</p>
              <p className="mt-1 text-xs">{bankInstructions.note}</p>
            </div>
          )}

          {status === 'cancelled' && (
            <div className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-700">
              Donation checkout was cancelled. You can try again anytime.
            </div>
          )}

          <button
            type="button"
            onClick={handleDonate}
            disabled={loading || resolvedAmount < 1}
            className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Donate Now'}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">No account required. Your donation is independent of platform membership.</p>
        </div>
      </div>
    </div>
  );
}
