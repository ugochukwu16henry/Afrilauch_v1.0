'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';

const PRESET_AMOUNTS = [10, 25, 50, 100];

export default function DonatePage() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('ref');
  const status = searchParams.get('status');

  const [amount, setAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paystack' | 'bank_transfer'>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankInstructions, setBankInstructions] = useState<{
    reference: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    note: string;
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
      const response = await api.donations.createSession({
        amount: resolvedAmount,
        paymentMethod,
        currency: 'USD',
        email: email.trim() || undefined,
      });

      if (response.paymentMethod === 'bank_transfer' && response.instructions) {
        setBankInstructions({
          reference: response.reference,
          bankName: response.instructions.bankName,
          accountName: response.instructions.accountName,
          accountNumber: response.instructions.accountNumber,
          note: response.instructions.note,
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
                { value: 'paystack', label: 'Paystack' },
                { value: 'bank_transfer', label: 'Bank Transfer' },
              ].map((method) => (
                <label key={method.value} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.value}
                    checked={paymentMethod === method.value}
                    onChange={() => setPaymentMethod(method.value as 'card' | 'paystack' | 'bank_transfer')}
                  />
                  <span>{method.label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}

          {bankInstructions && (
            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">Bank Transfer Instructions</p>
              <p className="mt-1">Bank: {bankInstructions.bankName}</p>
              <p>Account Name: {bankInstructions.accountName}</p>
              <p>Account Number: {bankInstructions.accountNumber}</p>
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
