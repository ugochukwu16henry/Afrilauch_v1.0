'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type Investor } from '@/lib/api';

export default function AdminInvestorsPage() {
  const [list, setList] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me(token)
      .then((me) => {
        if (me.role !== 'super_admin' && me.role !== 'cofounder') {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        api.investors
          .list(token)
          .then((data) => (Array.isArray(data) ? setList(data) : setList([])))
          .catch(() => setList([]))
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setAccessDenied(true);
        setLoading(false);
      });
  }, []);

  if (accessDenied) {
    return (
      <div className="max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
        Access denied. Only Super Admin and Co-Founder can view all investors.
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Investors</h1>
      <p className="text-gray-600 mb-6">All registered investors (Super Admin / admin view).</p>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Firm</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Range (min–max)</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Verified</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No investors yet
                    </td>
                  </tr>
                ) : (
                  list.map((inv) => (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{inv.name}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.email}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.firmName ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.country ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {inv.investmentRangeMin != null && inv.investmentRangeMax != null
                          ? `${Number(inv.investmentRangeMin)} – ${Number(inv.investmentRangeMax)}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{inv.verified ? 'Yes' : 'No'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
