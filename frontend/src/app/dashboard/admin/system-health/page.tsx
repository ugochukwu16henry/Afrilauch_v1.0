'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SystemHealthStatus, type User } from '@/lib/api';

const ADMIN_ROLES = ['super_admin', 'finance_admin'];

export default function AdminSystemHealthPage() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SystemHealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !user || !ADMIN_ROLES.includes(user.role)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    api.superAdmin
      .systemHealth(token)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const canAccess = user && ADMIN_ROLES.includes(user.role);

  if (!canAccess) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-2xl font-bold text-secondary mb-2">System Health</h1>
        <p className="text-gray-600 mb-6">
          Overview of core platform services (email, AI engine, payments, and database).
        </p>
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          You don’t have access to the system health dashboard. Only Super Admin and Finance Admin can view this page.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">System Health</h1>
      <p className="text-gray-600 mb-6">
        Live status for email, AI engine, payments, and database connectivity.
      </p>

      {loading ? (
        <div className="p-8 text-center text-gray-500">Checking services…</div>
      ) : !status ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          Could not load system health. Try again in a few seconds.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody>
              <HealthRow
                label="Email Service"
                ok={status.email.ok}
                details={status.email.error || `Host: ${process.env.NEXT_PUBLIC_SMTP_HOST ?? 'configured in backend'}`}
              />
              <HealthRow
                label="AI Engine"
                ok={status.ai.ok}
                details={
                  status.ai.ok
                    ? `Provider: ${status.ai.provider}`
                    : status.ai.error || `Provider: ${status.ai.provider}`
                }
              />
              <HealthRow
                label="Payments API"
                ok={status.payments.ok}
                details={
                  status.payments.ok
                    ? `Gateway: ${status.payments.gateway}`
                    : status.payments.error || `Gateway: ${status.payments.gateway}`
                }
              />
              <HealthRow
                label="Database"
                ok={status.database.ok}
                details={status.database.error || 'Prisma connected'}
              />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HealthRow({ label, ok, details }: { label: string; ok: boolean; details?: string }) {
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="px-4 py-3 font-medium text-secondary">{label}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            ok ? 'bg-green-50 text-green-700 ring-1 ring-green-600/20' : 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
          }`}
        >
          {ok ? 'Healthy' : 'Issue'}
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600 text-xs sm:text-sm">{details || '—'}</td>
    </tr>
  );
}

