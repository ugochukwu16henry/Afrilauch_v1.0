'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStoredToken, api } from '@/lib/api';
import type { Investor, InvestmentListItem } from '@/lib/api';

export default function InvestorDashboardPage() {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [investments, setInvestments] = useState<InvestmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      api.investors.me(token).then(setInvestor).catch(() => setError('Investor profile not found')),
      api.investments.list(token).then(setInvestments).catch(() => setInvestments([])),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error) return <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3">{error}</div>;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-secondary mb-2">Investor Dashboard</h1>
          <p className="text-gray-600">
            Browse startups, view pitch summaries, and fund businesses.
          </p>
        </div>
        <div className="flex-1 flex justify-end">
          <Image
            src="/RiseFlow Hub investores dashboard.png"
            alt="Investor reviewing startup deal room"
            width={380}
            height={240}
            className="w-full max-w-sm rounded-xl border border-secondary/10 bg-white object-cover shadow-sm shadow-secondary/10"
          />
        </div>
      </div>

      {investor && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">Firm</p>
            <p className="font-semibold text-secondary">{investor.firmName || '—'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">Investment range</p>
            <p className="font-semibold text-secondary">
              {investor.investmentRangeMin != null || investor.investmentRangeMax != null
                ? `${investor.investmentRangeMin ?? '0'} – ${investor.investmentRangeMax ?? '∞'}`
                : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className="font-semibold text-primary">{investor.verified ? 'Verified' : 'Pending verification'}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500 mb-1">Interests / commitments</p>
            <p className="font-semibold text-secondary">{investments.length}</p>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="text-lg font-semibold text-secondary mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/investor/marketplace"
            className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            Browse Marketplace
          </Link>
          <Link
            href="/dashboard/investor/investments"
            className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
          >
            My investments
          </Link>
        </div>
      </div>

      {investments.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-secondary mb-3">Recent activity</h2>
          <ul className="space-y-2">
            {investments.slice(0, 5).map((inv) => (
              <li key={inv.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="font-medium text-text-dark">
                  {inv.startup?.project?.projectName ?? inv.startupId}
                </span>
                <span className="text-sm text-gray-500 capitalize">{inv.status}</span>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/investor/investments" className="mt-3 inline-block text-sm text-primary hover:underline">
            View all →
          </Link>
        </div>
      )}
    </div>
  );
}
