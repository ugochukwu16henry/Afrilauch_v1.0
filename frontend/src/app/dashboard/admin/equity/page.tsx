'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type CompanyEquityRow, type StartupEquityRow } from '@/lib/api';

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatPercent(value: unknown): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(2)}%` : '—';
}

function formatShares(value: unknown): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toLocaleString() : '—';
}

function formatVesting(start: unknown, years: unknown): string {
  if (!start) return '—';
  const date = new Date(String(start));
  const yearValue = Number(years);
  const yearsLabel = Number.isFinite(yearValue) ? `${yearValue}y` : '—';
  return Number.isNaN(date.getTime()) ? yearsLabel : `${date.toLocaleDateString()} · ${yearsLabel}`;
}

export default function SuperAdminEquityPage() {
  const [companyRows, setCompanyRows] = useState<CompanyEquityRow[]>([]);
  const [startupRows, setStartupRows] = useState<StartupEquityRow[]>([]);
  const [startupId, setStartupId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    api.superAdmin.equity.company
      .list(token)
      .then((res) => {
        if (Array.isArray(res)) {
          setCompanyRows(res);
          return;
        }
        const maybeRows = (res as { items?: CompanyEquityRow[]; rows?: CompanyEquityRow[] } | null) ?? null;
        setCompanyRows(asArray<CompanyEquityRow>(maybeRows?.items ?? maybeRows?.rows));
      })
      .catch(() => setCompanyRows([]))
      .finally(() => setLoading(false));
  }, []);

  async function loadStartupEquity(id: string) {
    const token = getStoredToken();
    if (!token || !id) return;
    setError(null);
    try {
      const res = await api.superAdmin.equity.startup.list(id, token);
      if (Array.isArray(res)) {
        setStartupRows(res);
        return;
      }
      const maybeItems = (res as { items?: StartupEquityRow[]; rows?: StartupEquityRow[] } | null) ?? null;
      setStartupRows(asArray<StartupEquityRow>(maybeItems?.items ?? maybeItems?.rows));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load startup equity');
      setStartupRows([]);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl">
        <p className="text-gray-500">Loading cap tables...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Equity & Cap tables</h1>
        <p className="text-gray-600">
          Manage platform-level equity and per-startup ownership. This is a Super Admin view; changes affect cap tables.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-secondary mb-3">Platform equity (company_equity)</h2>
        {companyRows.length === 0 ? (
          <p className="text-sm text-gray-500">No entries yet. Add founder and cofounder allocations from the backend or a future UI.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Person</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Shares</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Equity %</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Vesting</th>
                </tr>
              </thead>
              <tbody>
                {companyRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-800">{r.personName}</td>
                    <td className="px-3 py-2 text-gray-600">{r.role}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{formatShares(r.shares)}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{formatPercent(r.equityPercent)}</td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {formatVesting(r.vestingStart, r.vestingYears)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary mb-1">Startup equity (startup_equity)</h2>
            <p className="text-sm text-gray-600">View equity breakdown for a specific startup profile.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={startupId}
              onChange={(e) => setStartupId(e.target.value)}
              placeholder="StartupProfile ID"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-64"
            />
            <button
              type="button"
              onClick={() => loadStartupEquity(startupId)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Load
            </button>
          </div>
        </div>

        {startupRows.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Person</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Role</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Shares</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Equity %</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Vesting</th>
                </tr>
              </thead>
              <tbody>
                {startupRows.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 text-gray-800">{r.personName}</td>
                    <td className="px-3 py-2 text-gray-600">{r.role}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{formatShares(r.shares)}</td>
                    <td className="px-3 py-2 text-right text-gray-800">{formatPercent(r.equityPercent)}</td>
                    <td className="px-3 py-2 text-gray-600 text-xs">
                      {formatVesting(r.vestingStart, r.vestingYears)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No startup equity loaded yet.</p>
        )}
      </section>
    </div>
  );
}

