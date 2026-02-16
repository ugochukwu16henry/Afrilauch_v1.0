'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SuperAdminAuditLogEntry } from '@/lib/api';

export default function SuperAdminAuditLogsPage() {
  const [data, setData] = useState<{ items: SuperAdminAuditLogEntry[]; total: number; page: number; limit: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>('');
  const [actionType, setActionType] = useState<string>('');

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    const params: { page?: number; limit?: number; entityType?: string; actionType?: string } = { page, limit: 50 };
    if (entityType) params.entityType = entityType;
    if (actionType) params.actionType = actionType;
    api.superAdmin
      .auditLogs(token, params)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, [page, entityType, actionType]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const limit = data?.limit ?? 50;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Audit Logs</h1>
      <p className="text-gray-600 mb-6">
        Platform-wide audit trail: who did what, when.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Entity type</span>
          <select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="user">User</option>
            <option value="payment">Payment</option>
            <option value="agreement">Agreement</option>
            <option value="project">Project</option>
            <option value="idea">Idea</option>
            <option value="consultation">Consultation</option>
            <option value="investment">Investment</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Action</span>
          <select
            value={actionType}
            onChange={(e) => { setActionType(e.target.value); setPage(1); }}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="login">Login</option>
            <option value="idea_submitted">Idea submitted</option>
            <option value="setup_skipped">Setup skipped</option>
            <option value="setup_paid">Setup paid</option>
            <option value="payment_reported">Payment reported</option>
            <option value="payment_approved">Payment approved</option>
            <option value="payment_rejected">Payment rejected</option>
            <option value="invoice_generated">Invoice generated</option>
            <option value="tax_export_downloaded">Tax export downloaded</option>
            <option value="agreement_signed">Agreement signed</option>
            <option value="consultation_booked">Consultation booked</option>
            <option value="investor_interest">Investor interest</option>
          </select>
        </label>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Time</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Entity</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Actor</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No audit logs yet
                      </td>
                    </tr>
                  ) : (
                    items.map((l) => (
                      <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {new Date(l.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 font-medium text-secondary">{l.actionType}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {l.entityType}
                          {l.entityId ? ` ${l.entityId.slice(0, 8)}…` : ''}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{l.adminEmail ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                          {l.details && typeof l.details === 'object'
                            ? JSON.stringify(l.details)
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
