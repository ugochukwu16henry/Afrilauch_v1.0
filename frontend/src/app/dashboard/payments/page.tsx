'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { api, getStoredToken, type GlobalBankAccount } from '@/lib/api';

export default function PaymentsPage() {
  const [loadingDonate, setLoadingDonate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<GlobalBankAccount[]>([]);
  const [quote, setQuote] = useState<{ amount: number; currency: string; amountUsd: number } | null>(null);

  useEffect(() => {
    api.payments
      .options()
      .then((res) => setBankAccounts(res.bankAccounts || []))
      .catch(() => setBankAccounts([]));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.setupFee
      .quote(currency, token)
      .then((r) => {
        setQuote({ amount: r.amount, currency: r.currency, amountUsd: r.amountUsd });
        setAmount(String(r.amount));
      })
      .catch(() => {
        setQuote(null);
      });
  }, [currency]);

  async function handleDonateClick() {
    setError(null);
    setLoadingDonate(true);
    try {
      await api.supportBanner.logEvent('clicked_support', {
        source: 'dashboard_payments',
      });
    } catch {
      // best-effort logging
    } finally {
      setLoadingDonate(false);
      window.location.href = '/donate';
    }
  }

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setManualSuccess(null);

    const token = getStoredToken();
    if (!token) {
      setError('You need to be signed in to submit a bank transfer.');
      return;
    }

    const value = Number(amount);
    if (!value || Number.isNaN(value) || value <= 0) {
      setError('Enter a valid amount for your transfer.');
      return;
    }
    if (!receiptFile) {
      setError('Please upload a receipt or proof of payment.');
      return;
    }

    setSubmittingManual(true);
    try {
      const proofUrl = await api.manualPayments.uploadReceipt(receiptFile, token);
      await api.manualPayments.create(
        {
          amount: value,
          currency,
          paymentType: 'platform_fee',
          notes: notes.trim() || undefined,
          proofUrl,
        },
        token
      );
      setManualSuccess(
        'Thank you. Your bank transfer has been submitted and is pending Super Admin confirmation. You will be notified once it is approved.'
      );
      setAmount('');
      setNotes('');
      setReceiptFile(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not submit bank transfer.';
      setError(msg);
    } finally {
      setSubmittingManual(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary mb-2">Payment Gateway</h1>
          <p className="text-gray-600">
            Use the official app payment gateway for platform payments. Donations remain optional.
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <Image
            src="/Riseflow payment flow pics.png"
            alt="Payments and finance overview illustration"
            width={380}
            height={240}
            className="w-full max-w-sm rounded-xl border border-primary/10 bg-white object-cover shadow-sm shadow-primary/10"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {manualSuccess && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          {manualSuccess}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-secondary mb-2">Platform payment gateway</h2>
          <p className="text-xs text-gray-600 mb-4">
            Pay setup/platform fees through the in-app gateway flow.
          </p>
          <Link
            href="/setup-payment"
            className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Open payment gateway
          </Link>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-semibold text-secondary mb-2">Donate / support</h2>
          <p className="text-xs text-gray-600 mb-4">
            Optional support donation. This opens the same donation flow as the homepage support popup.
          </p>
          <button
            type="button"
            onClick={handleDonateClick}
            disabled={loadingDonate}
            className="inline-flex rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
          >
            {loadingDonate ? 'Opening...' : 'Donate now'}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-secondary mb-2">Bank transfer for setup fee</h2>
        <p className="text-xs text-gray-600 mb-4">
          If you chose <span className="font-semibold">Bank Transfer (manual confirmation)</span> on the setup payment
          screen, use the bank details below and then upload your transfer receipt here. Super Admin will review and
          unlock your setup access once confirmed.
        </p>

        {bankAccounts.length > 0 && (
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            {bankAccounts.map((account, index) => (
              <div
                key={`${account.accountNumber}-${index}`}
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-gray-800"
              >
                <p className="font-semibold text-amber-900">
                  {account.label} — {account.bankName}
                </p>
                <p className="mt-1">Account Name: {account.accountName}</p>
                <p>Account Number: {account.accountNumber}</p>
                <p>Currency: {account.currency}</p>
                {account.routingNumber ? <p>Routing: {account.routingNumber}</p> : null}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-3 text-xs">
          <div className="grid gap-3 sm:grid-cols-[1.2fr,0.8fr]">
            <div>
              <label className="block mb-1 font-medium text-gray-700">Amount to transfer</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
                placeholder={quote ? String(quote.amount) : 'e.g. 7 or 1000'}
              />
              {quote && (
                <p className="mt-1 text-[11px] text-gray-500">
                  Suggested setup fee in {quote.currency}:{' '}
                  <span className="font-semibold">
                    {quote.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {quote.currency}
                  </span>
                  {quote.currency !== 'USD' && (
                    <> (≈ USD {quote.amountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })})</>
                  )}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'NGN' | 'USD')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
              >
                <option value="NGN">NGN (Naira)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Receipt / proof of payment</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Optional note</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
              placeholder="e.g. Date of transfer, bank used, reference, or any extra details."
            />
          </div>

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={submittingManual}
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
            >
              {submittingManual ? 'Submitting…' : 'I have paid and uploaded receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
