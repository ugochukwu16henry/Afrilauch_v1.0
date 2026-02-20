'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api } from '@/lib/api';

export default function PaymentsPage() {
  const [loadingDonate, setLoadingDonate] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Payment Gateway</h1>
      <p className="text-gray-600 mb-6">
        Use the official app payment gateway for platform payments. Donations remain optional.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
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
    </div>
  );
}
