'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type User } from '@/lib/api';
import type { SuperAdminReportsResponse } from '@/lib/api';

export default function AdminReportsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [data, setData] = useState<SuperAdminReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || user?.role !== 'super_admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.superAdmin
      .reports(token, { period })
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [user?.role, period]);

  if (user !== null && user?.role !== 'super_admin') {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-secondary mb-2">Reports</h1>
        <p className="text-gray-600 mb-6">Revenue summary and activity. (Super Admin only for full reports.)</p>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          Full reports (monthly/yearly financial summary, growth metrics, payment trends) are available to Super Admin only.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Reports</h1>
      <p className="text-gray-600 mb-6">
        Monthly/yearly financial summary, growth metrics, payment trends, platform usage.
      </p>

      <div className="flex gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'monthly' | 'yearly')}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="monthly">Monthly (last 6 months)</option>
            <option value="yearly">Yearly (last 12 months)</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          Failed to load reports.
        </div>
      ) : (
        <>
          <div className="grid gap-6 mb-8">
            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
                Growth metrics
              </h2>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total users</p>
                  <p className="text-xl font-semibold text-secondary">{data.growthMetrics.totalUsers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total projects</p>
                  <p className="text-xl font-semibold text-secondary">{data.growthMetrics.totalProjects}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">New users (30 days)</p>
                  <p className="text-xl font-semibold text-secondary">{data.growthMetrics.newUsersLast30Days}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">New projects (30 days)</p>
                  <p className="text-xl font-semibold text-secondary">{data.growthMetrics.newProjectsLast30Days}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
                Platform usage
              </h2>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total users</p>
                  <p className="text-xl font-semibold text-secondary">{data.platformUsage.totalUsers}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Total projects</p>
                  <p className="text-xl font-semibold text-secondary">{data.platformUsage.totalProjects}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Agreements signed</p>
                  <p className="text-xl font-semibold text-secondary">{data.platformUsage.totalAgreementsSigned}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase">Consultations booked</p>
                  <p className="text-xl font-semibold text-secondary">{data.platformUsage.totalConsultationsBooked}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">
                Financial summary & payment trends
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Period</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Revenue (USD)</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Setup fees (USD)</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600">Milestone (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.financialSummary.map((row) => (
                      <tr key={row.period} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-secondary">{row.period}</td>
                        <td className="px-4 py-3 text-right">${row.revenueUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${row.setupFeesUsd.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">${row.milestoneUsd.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
