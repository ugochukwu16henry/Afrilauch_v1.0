'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type User } from '@/lib/api';
import type { FinanceSummary } from '@/lib/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const FINANCE_ROLES = ['super_admin', 'finance_admin'];

export default function AdminFinancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [taxStart, setTaxStart] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [taxEnd, setTaxEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [taxDownloading, setTaxDownloading] = useState(false);
  const [taxError, setTaxError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !user || !FINANCE_ROLES.includes(user.role)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.superAdmin.finance
      .summary(token)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const canAccess = user && FINANCE_ROLES.includes(user.role);

  async function handleTaxDownload() {
    const token = getStoredToken();
    if (!token || !canAccess) return;
    setTaxError(null);
    setTaxDownloading(true);
    try {
      const blob = await api.superAdmin.finance.downloadTaxSummary(token, taxStart, taxEnd);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tax_summary_${taxStart}_${taxEnd}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setTaxError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setTaxDownloading(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-secondary mb-2">Financial Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Platform revenue, tax-ready exports, and payment analytics. (Super Admin and Finance team only.)
        </p>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          You don’t have access to the financial dashboard. Contact a Super Admin or Finance Admin if you need access.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Financial Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Platform revenue, tax-ready exports, and payment analytics.
      </p>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          Failed to load finance summary.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <MetricCard label="Total Revenue (USD)" value={`$${data.totalRevenueUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            <MetricCard label="This Month (USD)" value={`$${data.revenueThisMonthUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            <MetricCard label="This Year (USD)" value={`$${data.revenueThisYearUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
            <MetricCard label="Paid Users" value={data.totalPaidUsers} />
            <MetricCard label="Pending Approvals" value={data.pendingApprovals} />
            <MetricCard label="Refunds (USD)" value={`$${(data.refundsTotalUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
                Revenue by month (last 12 months)
              </h2>
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, 'Revenue']} labelFormatter={(l) => `Month: ${l}`} />
                    <Legend />
                    <Bar dataKey="revenueUsd" name="Total (USD)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
                Revenue trend (last 12 months)
              </h2>
              <div className="p-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${Number(v).toFixed(2)}`, 'Revenue (USD)']} labelFormatter={(l) => `Month: ${l}`} />
                    <Legend />
                    <Line type="monotone" dataKey="totalUsd" name="Total (USD)" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
            <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
              Payment method breakdown
            </h2>
            <div className="p-4">
              {data.paymentMethodBreakdown.length === 0 ? (
                <p className="text-gray-500 text-sm">No confirmed manual payments yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.paymentMethodBreakdown.map((t) => (
                    <li key={t.method} className="flex justify-between items-center text-sm">
                      <span className="text-gray-700">{t.method}</span>
                      <span className="font-medium text-secondary">
                        {t.count} payment{t.count !== 1 ? 's' : ''} · {Number(t.totalAmount).toLocaleString()} total
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
              Tax summary export
            </h2>
            <p className="px-4 py-2 text-sm text-gray-600">
              Download a CSV of all confirmed transactions in a date range for accountants or tax software.
            </p>
            <div className="p-4 flex flex-wrap items-end gap-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">Start date</span>
                <input
                  type="date"
                  value={taxStart}
                  onChange={(e) => setTaxStart(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500">End date</span>
                <input
                  type="date"
                  value={taxEnd}
                  onChange={(e) => setTaxEnd(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={handleTaxDownload}
                disabled={taxDownloading}
                className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {taxDownloading ? 'Downloading…' : 'Download CSV'}
              </button>
            </div>
            {taxError && <p className="px-4 pb-4 text-sm text-red-600">{taxError}</p>}
          </section>

          <div className="mt-6">
            <Link
              href="/dashboard/admin/payments"
              className="text-primary font-medium hover:underline"
            >
              ← Payments audit (approve manual payments)
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold text-secondary">{value}</p>
    </div>
  );
}
