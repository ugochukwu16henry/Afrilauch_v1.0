'use client';

import { useEffect, useState } from 'react';
import { api, getStoredToken, getRoleFromToken, type UserRole } from '@/lib/api';

type EarlyAccessStatus = 'active' | 'inactive' | 'completed' | 'revoked';

interface EarlyFounderItem {
  id: string;
  userId: string;
  signupOrder: number;
  status: EarlyAccessStatus;
  ideaSubmitted: boolean;
  consultationCompleted: boolean;
  referralLink: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
  };
}

interface EarlyFounderResponse {
  limit: number;
  total: number;
  remaining: number;
  items: EarlyFounderItem[];
}

export default function AdminEarlyFoundersPage() {
  const [data, setData] = useState<EarlyFounderResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setAccessDenied(true);
      setLoading(false);
      return;
    }

    const roleFromToken = getRoleFromToken(token);
    api.auth
      .me(token)
      .then((me) => {
        const role: UserRole | string = me.role || roleFromToken || '';
        if (role !== 'super_admin' && role !== 'cofounder') {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setLoading(true);
        setError('');
        api.superAdmin
          .earlyAccessFounders(token)
          .then((res) => setData(res))
          .catch((err: unknown) => {
            setError(err instanceof Error ? err.message : 'Failed to load Early Founder seats');
          })
          .finally(() => setLoading(false));
      })
      .catch(() => {
        setAccessDenied(true);
        setLoading(false);
      });
  }, []);

  if (accessDenied) {
    return (
      <div className="max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
        Access denied. Only Super Admin and Co-Founder can view Early Founder scholarship seats.
      </div>
    );
  }

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500 text-sm">Loading Early Founder seats…</div>;
  }

  if (error && !data) {
    return (
      <div className="max-w-3xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  const limit = data?.limit ?? 0;
  const total = data?.total ?? 0;
  const remaining = data?.remaining ?? 0;
  const items = data?.items ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Early Founder Seats</h1>
      <p className="text-gray-600 mb-6 text-sm">
        View the first {limit} Early Founder scholarship seats created via the Super Admin invite link, including who
        claimed each seat and their progress.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Total seats</p>
          <p className="text-2xl font-bold text-secondary">{limit}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Seats claimed</p>
          <p className="text-2xl font-bold text-gray-900">{total}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium text-gray-600 mb-1">Seats remaining</p>
          <p className="text-2xl font-bold text-emerald-600">{remaining}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-between">
          <h2 className="font-semibold text-secondary text-sm">Founder list</h2>
          <p className="text-xs text-gray-600">
            {items.length === 0 ? 'No founders enrolled yet.' : `Showing ${items.length} founder${items.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Refreshing…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Seat #</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Founder</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Email</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Status</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Idea submitted</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Consultation</th>
                  <th className="text-left px-4 py-2 font-medium text-gray-600 text-xs">Joined</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500 text-sm">
                      No Early Founder seats have been claimed yet.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const joined = new Date(item.user.createdAt || item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });
                    const statusLabel = item.status.replace('_', ' ');
                    const statusColor =
                      item.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : item.status === 'inactive'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-red-100 text-red-800';
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-2 text-xs text-gray-700">{item.signupOrder}</td>
                        <td className="px-4 py-2 font-medium text-text-dark text-sm">{item.user.name}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{item.user.email}</td>
                        <td className="px-4 py-2 text-xs">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {item.ideaSubmitted ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              Yes
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                              No
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {item.consultationCompleted ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-600">{joined}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

