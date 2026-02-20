'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';

export default function HirerPayFeePage() {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'stripe' | 'paystack' | 'bank_transfer'>('auto');
  const [message, setMessage] = useState<string | null>(null);

  async function handlePay() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setMessage(null);
    try {
      const r = await api.marketplaceFee.createSession({ type: 'hirer_platform_fee', paymentMethod }, token);
      if ((r as { alreadyPaid?: boolean }).alreadyPaid) {
        window.location.href = '/dashboard/hirer';
        return;
      }
      if (r.gateway === 'bank_transfer') {
        setMessage(r.message || 'Bank transfer created and pending super admin confirmation.');
        setLoading(false);
        return;
      }
      window.location.href = (r as { checkoutUrl: string }).checkoutUrl;
    } catch (e) {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Hirer platform fee</h1>
      <p className="text-gray-600 mb-4">One-time $20 fee to hire talent on the platform. You must also sign the Fair Treatment Agreement.</p>
      <label className="block text-sm text-gray-600 mb-2">Payment method</label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as 'auto' | 'stripe' | 'paystack' | 'bank_transfer')}
        className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="auto">Auto (best available)</option>
        <option value="stripe">Pay with Card (Global)</option>
        <option value="paystack">Paystack (Africa)</option>
        <option value="bank_transfer">Bank Transfer (manual confirmation)</option>
      </select>
      {message && <p className="mb-3 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
      <button onClick={handlePay} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90 disabled:opacity-50">Pay $20</button>
      <Link href="/dashboard/hirer" className="ml-3 text-gray-600 hover:underline">Cancel</Link>
    </div>
  );
}
