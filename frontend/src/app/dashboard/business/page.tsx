'use client';

import { useEffect, useState } from 'react';
import { getStoredRoleFromToken, getStoredToken } from '@/lib/api';

interface StatusResponse {
  unlocked: boolean;
  reason: string;
  startupId?: string;
  stage?: string;
  hasLaunch?: boolean;
  hasInvestor?: boolean;
  latestFinancial?: {
    periodMonth: string;
    revenue: number;
    expenses: number;
    profit?: number;
    assets: number;
    liabilities: number;
    netWorth: number | null;
  } | null;
}

interface Growth {
  startupId: string;
  ideaValidated: boolean;
  mvpBuilt: boolean;
  firstCustomer: boolean;
  revenueGenerated: boolean;
  investorOnboarded: boolean;
}

interface FinancialRow {
  id: string;
  periodMonth: string;
  revenue: number;
  expenses: number;
  profit: number;
  assets: number;
  liabilities: number;
  netWorth: number;
  notes?: string | null;
}

export default function BusinessModulePage() {
  const roleFromToken = typeof window !== 'undefined' ? getStoredRoleFromToken() : null;
  const isSuperAdmin = roleFromToken === 'super_admin';
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [growth, setGrowth] = useState<Growth | null>(null);
  const [financials, setFinancials] = useState<FinancialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [fixedCosts, setFixedCosts] = useState('');
  const [variableCost, setVariableCost] = useState('');
  const [price, setPrice] = useState('');

  const [salaryRevenue, setSalaryRevenue] = useState('');
  const [salaryProfitMargin, setSalaryProfitMargin] = useState('30');

  const [equitySharesOwned, setEquitySharesOwned] = useState('');
  const [equityTotalShares, setEquityTotalShares] = useState('');

  const [assets, setAssets] = useState('');
  const [liabilities, setLiabilities] = useState('');

  const [periodMonth, setPeriodMonth] = useState('');
  const [revInput, setRevInput] = useState('');
  const [expInput, setExpInput] = useState('');

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/v1/business/status', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load status'))))
        .then(setStatus),
      fetch('/api/v1/business/growth', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load growth'))))
        .then(setGrowth)
        .catch(() => setGrowth(null)),
      fetch('/api/v1/business/financials', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load financials'))))
        .then((data) => setFinancials((data as { items: FinancialRow[] }).items || []))
        .catch(() => setFinancials([])),
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function computeBreakEven(): number | null {
    const f = parseFloat(fixedCosts || '0');
    const v = parseFloat(variableCost || '0');
    const p = parseFloat(price || '0');
    if (!p || p <= v) return null;
    return f / (p - v);
  }

  function computeEquityPercent(): number | null {
    const owned = parseFloat(equitySharesOwned || '0');
    const total = parseFloat(equityTotalShares || '0');
    if (!owned || !total) return null;
    return (owned / total) * 100;
  }

  function computeNetWorthLocal(): number | null {
    const a = parseFloat(assets || '0');
    const l = parseFloat(liabilities || '0');
    if (Number.isNaN(a) || Number.isNaN(l)) return null;
    return a - l;
  }

  function computeSuggestedSalary(): number | null {
    const revenue = parseFloat(salaryRevenue || '0');
    const margin = parseFloat(salaryProfitMargin || '0');
    if (!revenue || !margin) return null;
    const targetProfit = (revenue * margin) / 100;
    const safeSalary = targetProfit * 0.4;
    return safeSalary;
  }

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-5xl">
        <p className="text-gray-500">Loading Business OS...</p>
      </div>
    );
  }

  const unlocked = Boolean(status?.unlocked || isSuperAdmin);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Business Administration & Growth Intelligence</h1>
        <p className="text-gray-600">
          This premium module helps you think like a CEO: understand your numbers, track growth, and prepare for
          investors.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm">{success}</div>
      )}

      {!unlocked && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold text-amber-900 mb-1">Module locked</h2>
          <p className="text-amber-900">
            This Business OS unlocks after you{' '}
            <strong>launch your product (website or app)</strong> or{' '}
            <strong>bring on an investor</strong>. Super Admins can also grant early access for selected founders.
          </p>
          <ul className="list-disc list-inside text-amber-900">
            <li>Make sure your startup profile is published and marked as launched.</li>
            <li>Or secure your first investor commitment through the platform.</li>
          </ul>
        </div>
      )}

      {unlocked && (
        <>
          {/* 1. Business foundations */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 text-sm">
            <h2 className="text-lg font-semibold text-secondary">1. Business foundations (quick primer)</h2>
            <p className="text-gray-700">
              Before optimizing metrics, make sure you understand the core building blocks of a real business.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800">Revenue vs profit</h3>
                <p className="text-gray-700">
                  <strong>Revenue</strong> is all the money you bring in. <strong>Profit</strong> is what&apos;s left
                  after expenses. Many startups die because they confuse top-line revenue with healthy profit.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800">Cost of operations</h3>
                <p className="text-gray-700">
                  Fixed costs (salaries, rent, tools) + variable costs (per unit or per customer) = your cost base.
                  Controlling costs is as important as growing revenue.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800">Business model</h3>
                <p className="text-gray-700">
                  Subscription, transaction fee, marketplace, service + product bundles — your model shapes how you grow
                  and what investors expect.
                </p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-gray-800">Growth mechanics</h3>
                <p className="text-gray-700">
                  Traction comes from repeatable channels: sales, partnerships, paid ads, referrals, community. Track
                  what works and double down.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Break-even calculator & salary planner */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-6 text-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h2 className="text-lg font-semibold text-secondary mb-1">2. Break-even analysis</h2>
                <p className="text-gray-700 mb-3">
                  Break-even = Fixed costs ÷ (Price per unit − Variable cost per unit).
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fixed costs / month</label>
                    <input
                      type="number"
                      value={fixedCosts}
                      onChange={(e) => setFixedCosts(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 2000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Variable cost per unit
                    </label>
                    <input
                      type="number"
                      value={variableCost}
                      onChange={(e) => setVariableCost(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Price per unit</label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 15"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 px-3 py-2 text-sm">
                  {computeBreakEven() != null ? (
                    <p className="text-gray-800">
                      You need to sell approximately{' '}
                      <span className="font-semibold">
                        {Math.ceil(computeBreakEven() || 0)} units
                      </span>{' '}
                      per month to break even.
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Enter costs and price to see how many units you must sell to stop losing money.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-secondary mb-1">3. Founder salary planner</h2>
                <p className="text-gray-700 mb-3">
                  As a rule of thumb, founders should pay themselves a modest, sustainable salary only after the company
                  can consistently cover costs and maintain a profit buffer.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Monthly revenue (current)
                    </label>
                    <input
                      type="number"
                      value={salaryRevenue}
                      onChange={(e) => setSalaryRevenue(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Target profit margin (%) before founder salary
                    </label>
                    <input
                      type="number"
                      value={salaryProfitMargin}
                      onChange={(e) => setSalaryProfitMargin(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-gray-50 border border-dashed border-gray-200 px-3 py-2 text-sm">
                  {computeSuggestedSalary() != null ? (
                    <p className="text-gray-800">
                      Suggested safe founder salary is around{' '}
                      <span className="font-semibold">
                        {Math.round((computeSuggestedSalary() || 0) * 100) / 100}
                      </span>{' '}
                      per month (approx. 40% of your target profit).
                    </p>
                  ) : (
                    <p className="text-gray-500">
                      Use this as guidance only — always keep runway and future hiring needs in mind.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4–6 investor education, equity, net worth */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-6 text-sm">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-secondary">4. Investor payout logic</h2>
                <p className="text-gray-700">
                  Once the business is profitable, you can either pay out <strong>dividends</strong> or{' '}
                  <strong>reinvest</strong> profits. Early-stage startups typically reinvest most profits into growth.
                </p>
                <ul className="list-disc list-inside text-gray-700 text-xs space-y-1 mt-1">
                  <li>Agree up front how profits will be split and when dividends may start.</li>
                  <li>Track investor capital, equity %, and realized ROI over time.</li>
                  <li>Remember: paying dividends reduces cash for growth but increases investor trust.</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-secondary">5–6. Net worth & equity calculator</h2>
                <div className="grid gap-3">
                  <div className="space-y-1">
                    <p className="text-gray-700 font-medium text-sm">Company net worth</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Assets</label>
                        <input
                          type="number"
                          value={assets}
                          onChange={(e) => setAssets(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="e.g. 15000"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Liabilities</label>
                        <input
                          type="number"
                          value={liabilities}
                          onChange={(e) => setLiabilities(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="e.g. 4000"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-gray-800">
                      Net worth = Assets − Liabilities ={' '}
                      <span className="font-semibold">
                        {computeNetWorthLocal() != null ? computeNetWorthLocal() : '—'}
                      </span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-700 font-medium text-sm">Equity percentage</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Shares you own</label>
                        <input
                          type="number"
                          value={equitySharesOwned}
                          onChange={(e) => setEquitySharesOwned(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total company shares</label>
                        <input
                          type="number"
                          value={equityTotalShares}
                          onChange={(e) => setEquityTotalShares(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-gray-800">
                      Equity % = Shares Owned ÷ Total Shares × 100 ={' '}
                      <span className="font-semibold">
                        {computeEquityPercent() != null ? `${computeEquityPercent()!.toFixed(2)}%` : '—'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. Growth tracker */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-secondary">7. Business growth tracker</h2>
            <p className="text-gray-700">
              Mark the milestones you&apos;ve reached. This becomes part of your internal growth history and investor
              narrative.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {growth && (
                <>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={growth.ideaValidated}
                      onChange={(e) =>
                        setGrowth({ ...growth, ideaValidated: e.target.checked })
                      }
                    />
                    <span>Idea validated</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={growth.mvpBuilt}
                      onChange={(e) =>
                        setGrowth({ ...growth, mvpBuilt: e.target.checked })
                      }
                    />
                    <span>MVP built</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={growth.firstCustomer}
                      onChange={(e) =>
                        setGrowth({ ...growth, firstCustomer: e.target.checked })
                      }
                    />
                    <span>First customer</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={growth.revenueGenerated}
                      onChange={(e) =>
                        setGrowth({ ...growth, revenueGenerated: e.target.checked })
                      }
                    />
                    <span>Revenue generated</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={growth.investorOnboarded}
                      onChange={(e) =>
                        setGrowth({ ...growth, investorOnboarded: e.target.checked })
                      }
                    />
                    <span>Investor onboarded</span>
                  </label>
                </>
              )}
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex-1 mr-4 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{
                    width: `${
                      growth
                        ? ([
                          growth.ideaValidated,
                          growth.mvpBuilt,
                          growth.firstCustomer,
                          growth.revenueGenerated,
                          growth.investorOnboarded,
                        ].filter(Boolean).length /
                          5) *
                        100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <button
                type="button"
                disabled={!growth || saving}
                onClick={async () => {
                  if (!token || !growth) return;
                  setSaving(true);
                  setError(null);
                  setSuccess(null);
                  try {
                    const res = await fetch('/api/v1/business/growth', {
                      method: 'POST',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(growth),
                    });
                    if (!res.ok) throw new Error('Failed to save growth status');
                    const updated = (await res.json()) as Growth;
                    setGrowth(updated);
                    setSuccess('Growth tracker updated');
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to save growth tracker');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save growth status'}
              </button>
            </div>
          </section>

          {/* 8. Financial dashboard */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-secondary">8. Financial dashboard</h2>
            <p className="text-gray-700">
              Track monthly revenue, expenses, and net worth. This does not replace formal accounting but gives you a
              clear at-a-glance view.
            </p>

            <div className="grid gap-3 md:grid-cols-4 text-xs">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-gray-500 mb-1">Latest revenue</p>
                <p className="text-base font-semibold text-secondary">
                  {status?.latestFinancial ? Number(status.latestFinancial.revenue).toLocaleString() : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-gray-500 mb-1">Latest expenses</p>
                <p className="text-base font-semibold text-secondary">
                  {status?.latestFinancial ? Number(status.latestFinancial.expenses).toLocaleString() : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-gray-500 mb-1">Latest profit</p>
                <p className="text-base font-semibold text-secondary">
                  {status?.latestFinancial
                    ? (Number(status.latestFinancial.revenue) -
                        Number(status.latestFinancial.expenses)
                      ).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-gray-500 mb-1">Latest net worth</p>
                <p className="text-base font-semibold text-secondary">
                  {status?.latestFinancial?.netWorth != null
                    ? Number(status.latestFinancial.netWorth).toLocaleString()
                    : '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4 grid gap-6 md:grid-cols-[minmax(0,2fr),minmax(0,1fr)]">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Monthly entries</h3>
                {financials.length === 0 ? (
                  <p className="text-gray-500 text-sm">No financial snapshots yet. Add your first month on the right.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">Month</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">Revenue</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">Expenses</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">Profit</th>
                          <th className="px-3 py-2 text-left text-gray-600 font-medium">Net worth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financials.map((f) => (
                          <tr key={f.id} className="border-t border-gray-100">
                            <td className="px-3 py-2 text-gray-800">
                              {new Date(f.periodMonth).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                              })}
                            </td>
                            <td className="px-3 py-2 text-gray-800">{f.revenue.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-800">{f.expenses.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-800">{f.profit.toLocaleString()}</td>
                            <td className="px-3 py-2 text-gray-800">{f.netWorth.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2 text-sm">Add / update month</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Month</label>
                    <input
                      type="month"
                      value={periodMonth}
                      onChange={(e) => setPeriodMonth(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Revenue</label>
                    <input
                      type="number"
                      value={revInput}
                      onChange={(e) => setRevInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Expenses</label>
                    <input
                      type="number"
                      value={expInput}
                      onChange={(e) => setExpInput(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="text-xs text-gray-500">
                    Assets & liabilities for this month use the values you entered above in the net worth section, or
                    you can keep them at 0 if you only track P&amp;L.
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={async () => {
                      if (!token || !periodMonth) return;
                      setSaving(true);
                      setError(null);
                      setSuccess(null);
                      try {
                        const body = {
                          periodMonth: `${periodMonth}-01`,
                          revenue: parseFloat(revInput || '0'),
                          expenses: parseFloat(expInput || '0'),
                          assets: parseFloat(assets || '0'),
                          liabilities: parseFloat(liabilities || '0'),
                        };
                        const res = await fetch('/api/v1/business/financials', {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify(body),
                        });
                        if (!res.ok) throw new Error('Failed to save financial snapshot');
                        const row = (await res.json()) as FinancialRow;
                        setFinancials((prev) => {
                          const others = prev.filter(
                            (p) =>
                              new Date(p.periodMonth).toISOString().slice(0, 7) !==
                              new Date(row.periodMonth).toISOString().slice(0, 7)
                          );
                          return [...others, row].sort(
                            (a, b) =>
                              new Date(a.periodMonth).getTime() - new Date(b.periodMonth).getTime()
                          );
                        });
                        setStatus((s) =>
                          s
                            ? {
                                ...s,
                                latestFinancial: {
                                  periodMonth: row.periodMonth,
                                  revenue: row.revenue,
                                  expenses: row.expenses,
                                  assets: row.assets,
                                  liabilities: row.liabilities,
                                  netWorth: row.netWorth,
                                },
                              }
                            : s
                        );
                        setSuccess('Financial snapshot saved');
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to save financials');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50 mt-2"
                  >
                    {saving ? 'Saving…' : 'Save month'}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 9–10 Reports and training */}
          <section className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
            <h2 className="text-lg font-semibold text-secondary">9–10. Reports & founder training</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-gray-700">
                  Export your financial and growth data to share with investors or advisors. You can generate CSV (open
                  in Excel) or JSON (for custom reports / PDF tools).
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={async () => {
                      if (!token) return;
                      try {
                        const res = await fetch('/api/v1/business/reports?format=csv', {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error('Failed to export CSV');
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'business-report.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to export CSV');
                      }
                    }}
                  >
                    Download CSV
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    onClick={async () => {
                      if (!token) return;
                      try {
                        const res = await fetch('/api/v1/business/reports', {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!res.ok) throw new Error('Failed to export JSON');
                        const data = await res.json();
                        const blob = new Blob([JSON.stringify(data, null, 2)], {
                          type: 'application/json',
                        });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'business-report.json';
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to export JSON');
                      }
                    }}
                  >
                    Download JSON
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">Founder training topics</p>
                <ul className="list-disc list-inside text-gray-700 text-xs space-y-1">
                  <li>
                    <strong>Negotiating with investors:</strong> focus on terms (equity %, control, dilution) not just
                    valuation.
                  </li>
                  <li>
                    <strong>Sales negotiation:</strong> price confidently, anchor on value, and trade scope for price
                    instead of discounting heavily.
                  </li>
                  <li>
                    <strong>Scaling operations:</strong> document processes, hire against clear KPIs, and separate
                    founder tasks from repeatable roles.
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

