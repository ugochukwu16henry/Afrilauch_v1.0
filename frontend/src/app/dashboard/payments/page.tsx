'use client';

import { useState } from 'react';
import { getStoredToken, api } from '@/lib/api';

export default function PaymentsPage() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [paymentType, setPaymentType] = useState<'platform_fee' | 'donation'>('platform_fee');
  const [notes, setNotes] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setMessage(null);
    const token = getStoredToken();
    if (!token) {
      setError('Please log in to submit a payment.');
      return;
    }
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    setSubmitting(true);
    try {
      let proofUrlToSend = proofUrl.trim() || undefined;
      if (receiptFile) {
        try {
          proofUrlToSend = await api.manualPayments.uploadReceipt(receiptFile, token);
        } catch (uploadErr) {
          const msg = uploadErr instanceof Error ? uploadErr.message : 'Receipt upload failed';
          if (msg.includes('not configured') || msg.includes('503')) {
            setError('Receipt upload is not configured on the server. You can paste a link to your receipt in the "Proof of payment URL" field instead.');
          } else {
            setError(msg);
          }
          setSubmitting(false);
          return;
        }
      }
      await api.manualPayments.create(
        {
          amount: Number(amount),
          currency,
          paymentType,
          notes: notes.trim() || undefined,
          proofUrl: proofUrlToSend,
        },
        token
      );
      setMessage('Thank you! We will confirm your payment from our side shortly.');
      setAmount('');
      setNotes('');
      setProofUrl('');
      setReceiptFile(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not submit payment. Please try again.';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('502') || msg.includes('NetworkError')) {
        setError('Unable to connect to the server. Ensure the backend is running and NEXT_PUBLIC_API_URL is set to your Railway backend URL.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Payments</h1>
      <p className="text-gray-600 mb-6">
        You can pay your platform fee or send a donation via secure bank transfer.
      </p>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-secondary mb-2">Naira (Nigeria) — Wema Bank</h2>
          <dl className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <dt>Bank Name</dt>
              <dd className="font-medium">Wema Bank PLC</dd>
            </div>
            <div className="flex justify-between">
              <dt>Account Name</dt>
              <dd className="font-medium">Henry M Ugochukwu</dd>
            </div>
            <div className="flex justify-between">
              <dt>Account Number</dt>
              <dd className="font-mono font-semibold">0442119025</dd>
            </div>
            <div className="flex justify-between">
              <dt>Currency</dt>
              <dd className="font-medium">NGN</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-secondary mb-2">USD (USA) — Lead Bank</h2>
          <dl className="text-sm text-gray-700 space-y-1">
            <div className="flex justify-between">
              <dt>Bank Name</dt>
              <dd className="font-medium">Lead Bank</dd>
            </div>
            <div className="flex justify-between">
              <dt>Account Name</dt>
              <dd className="font-medium">HENRY MAOBUGHICHI UGOCHUKWU</dd>
            </div>
            <div className="flex justify-between">
              <dt>Account Number</dt>
              <dd className="font-mono font-semibold">216833036586</dd>
            </div>
            <div className="flex justify-between">
              <dt>Routing Number</dt>
              <dd className="font-mono font-semibold">101019644</dd>
            </div>
            <div className="flex justify-between">
              <dt>Account Type</dt>
              <dd className="font-medium">Personal Checking</dd>
            </div>
            <div className="flex justify-between">
              <dt>Bank Address</dt>
              <dd className="text-right text-xs">
                9450 Southwest Gemini Drive,
                <br />
                Beaverton, OR, 97008, USA
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-secondary mb-3">Report your bank transfer</h2>
        <p className="text-xs text-gray-600 mb-4">
          After you have transferred the funds to one of the accounts above, enter the details below and click
          &quot;I have paid&quot;. We will verify on our side and send you a confirmation receipt.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount paid</label>
            <input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="e.g. 20000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'NGN' | 'USD')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="NGN">NGN (Naira)</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Payment type</label>
            <select
              value={paymentType}
              onChange={(e) => setPaymentType(e.target.value as 'platform_fee' | 'donation')}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="platform_fee">Platform Fee</option>
              <option value="donation">Donation / Support</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Notes or reference (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Include any reference, date, or short note about your transfer."
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Receipt / proof of payment
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Upload a screenshot or PDF of your bank transfer confirmation, or paste a link below.
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:font-medium file:text-primary"
          />
          {receiptFile && (
            <p className="mt-1 text-xs text-gray-600">
              Selected: {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <input
            type="url"
            value={proofUrl}
            onChange={(e) => setProofUrl(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Or paste a link to your receipt (optional)"
          />
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'I have paid'}
        </button>
      </div>
    </div>
  );
}
