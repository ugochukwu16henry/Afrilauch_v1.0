'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SuperAdminPaymentRow, type ManualPayment } from '@/lib/api';

export default function SuperAdminPaymentsPage() {
  const [rows, setRows] = useState<SuperAdminPaymentRow[]>([]);
  const [manual, setManual] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualLoading, setManualLoading] = useState(true);
  const [period, setPeriod] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [manualStatus, setManualStatus] = useState<string>('Pending');
  const [error, setError] = useState<string | null>(null);

  function load() {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    const params: { period?: string; paymentType?: string; userId?: string } = {};
    if (period) params.period = period;
    if (paymentType) params.paymentType = paymentType;
    if (userId) params.userId = userId;
    api.superAdmin
      .payments(token, params)
      .then((data) => {
        if (typeof data === 'object' && data && 'rows' in data) setRows(data.rows);
        else setRows([]);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }

  function loadManual() {
    const token = getStoredToken();
    if (!token) return;
    setManualLoading(true);
    const q = new URLSearchParams();
    if (manualStatus) q.set('status', manualStatus);
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/super-admin/manual-payments?${q.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: { items: ManualPayment[] }) => setManual(data.items || []))
      .catch(() => setManual([]))
      .finally(() => setManualLoading(false));
  }

  useEffect(() => {
    load();
  }, [period, paymentType, userId]);

  useEffect(() => {
    loadManual();
  }, [manualStatus]);

  async function exportCsv() {
    const token = getStoredToken();
    if (!token) return;
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (paymentType) q.set('paymentType', paymentType);
    if (userId) q.set('userId', userId);
    q.set('format', 'csv');
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${base}/api/v1/super-admin/payments?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payments-audit.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function updateManualStatus(id: string, action: 'confirm' | 'reject') {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    const reason =
      action === 'reject'
        ? window.prompt('Enter a short reason for rejection:')
        : window.prompt('Optional note to attach to this payment (press OK to continue):', '');
    if (action === 'reject' && (!reason || !reason.trim())) {
      return;
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/super-admin/manual-payments/${encodeURIComponent(
          id
        )}/${action === 'confirm' ? 'confirm' : 'reject'}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body:
            action === 'confirm'
              ? JSON.stringify({ notes: reason || undefined })
              : JSON.stringify({ reason: reason?.trim() }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error || 'Request failed');
      }
      loadManual();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update manual payment');
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Payments Audit</h1>
      <p className="text-gray-600 mb-6">
        All platform payments with filters. Export to CSV or view data for PDF.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Payment type</span>
          <select
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value="setup_fee">Setup Fee</option>
            <option value="consultation">Consultation</option>
            <option value="milestone">Milestone</option>
            <option value="subscription">Subscription</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">User ID</span>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Filter by user ID"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm w-48"
          />
        </label>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Payment Type</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Converted USD</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  rows.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">{r.userName}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{r.role.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-600">{r.paymentType}</td>
                      <td className="px-4 py-3 text-right">{r.amount}</td>
                      <td className="px-4 py-3 text-gray-600">{r.currency}</td>
                      <td className="px-4 py-3 text-right font-medium">${r.convertedUsd.toFixed(2)}</td>
                      <td className="px-4 py-3 text-gray-600">{r.status}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(r.date).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-secondary">Manual bank transfers</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Status</span>
          <select
            value={manualStatus}
            onChange={(e) => setManualStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {manualLoading ? (
          <div className="p-6 text-center text-gray-500 text-sm">Loading manual payments...</div>
        ) : manual.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">No manual payments for this status.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Notes</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Receipt</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {manual.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-text-dark">{p.userName ?? p.userId}</div>
                      <div className="text-xs text-gray-500">{p.userEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {p.amount.toLocaleString()} {p.currency}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{p.currency}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.paymentType === 'donation' ? 'Donation / Support' : 'Platform Fee'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 max-w-xs whitespace-pre-wrap">
                      {p.notes || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.proofUrl ? (
                        <span className="flex flex-col gap-1">
                          {/\.(jpe?g|png|webp|gif)$/i.test(p.proofUrl) ? (
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View image
                            </a>
                          ) : (
                            <a
                              href={p.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              View receipt
                            </a>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-700">
                      {p.status === 'Pending' ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => updateManualStatus(p.id, 'confirm')}
                            className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-medium hover:opacity-90"
                          >
                            Confirm & unlock
                          </button>
                          <button
                            type="button"
                            onClick={() => updateManualStatus(p.id, 'reject')}
                            className="rounded-lg border border-red-300 text-red-700 px-3 py-1 text-xs font-medium hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500">{p.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
