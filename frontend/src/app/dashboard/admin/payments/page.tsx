'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, getStoredToken, type AdminBankTransferDonation, type ManualPayment, type MilestonePaymentRow, type SuperAdminPaymentRow } from '@/lib/api';

type UnifiedStatus = 'pending' | 'successful' | 'failed';
type StatusTab = 'all' | UnifiedStatus;
type PaymentSource = 'platform' | 'manual' | 'donation' | 'milestone';

type UnifiedPaymentRow = {
  id: string;
  source: PaymentSource;
  userName: string;
  role: string;
  paymentType: string;
  method: string;
  amount: number;
  currency: string;
  convertedUsd: number | null;
  status: UnifiedStatus;
  statusRaw: string;
  date: string;
  reference?: string;
  receiptUrl?: string;
  originalId?: string;
};

function normalizeStatus(value: string): UnifiedStatus {
  const status = value.trim().toLowerCase();
  if (['confirmed', 'completed', 'paid', 'successful', 'success', 'succeeded'].includes(status)) return 'successful';
  if (['rejected', 'failed', 'cancelled', 'canceled'].includes(status)) return 'failed';
  return 'pending';
}

function formatPaymentType(value: string): string {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatMethod(value: string): string {
  if (!value) return 'gateway';
  if (value === 'bank_transfer') return 'bank transfer';
  return value.replace(/_/g, ' ');
}

export default function SuperAdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformRows, setPlatformRows] = useState<SuperAdminPaymentRow[]>([]);
  const [manualRows, setManualRows] = useState<ManualPayment[]>([]);
  const [donationRows, setDonationRows] = useState<AdminBankTransferDonation[]>([]);
  const [milestoneRows, setMilestoneRows] = useState<MilestonePaymentRow[]>([]);

  const [period, setPeriod] = useState<string>('');
  const [paymentType, setPaymentType] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | PaymentSource>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  async function loadAll() {
    const token = getStoredToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    const params: { period?: string; paymentType?: string; userId?: string } = {};
    if (period) params.period = period;
    if (paymentType) params.paymentType = paymentType;
    if (userId) params.userId = userId;

    try {
      const [platformRes, manualRes, donationSets, milestoneRes] = await Promise.all([
        api.superAdmin.payments(token, params),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/super-admin/manual-payments`, {
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => (res.ok ? res.json() : Promise.reject(new Error('Could not load manual payments')))),
        Promise.all([
          api.donations.listBankTransfers(token, 'pending'),
          api.donations.listBankTransfers(token, 'successful'),
          api.donations.listBankTransfers(token, 'failed'),
        ]),
        api.milestones.adminPayments(token),
      ]);

      const normalizedPlatform = typeof platformRes === 'object' && platformRes && 'rows' in platformRes ? platformRes.rows : [];
      const normalizedManual = ((manualRes as { items?: ManualPayment[] })?.items || []) as ManualPayment[];
      const normalizedDonations = donationSets.flatMap((set) => set.items || []);
      const normalizedMilestone = milestoneRes.items || [];

      const dedupedDonations = Array.from(new Map(normalizedDonations.map((d) => [d.id, d])).values());

      setPlatformRows(normalizedPlatform);
      setManualRows(normalizedManual);
      setDonationRows(dedupedDonations);
      setMilestoneRows(normalizedMilestone);
    } catch (e) {
      setPlatformRows([]);
      setManualRows([]);
      setDonationRows([]);
      setMilestoneRows([]);
      setError(e instanceof Error ? e.message : 'Could not load payment records');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, [period, paymentType, userId]);

  const unifiedRows = useMemo<UnifiedPaymentRow[]>(() => {
    const fromPlatform: UnifiedPaymentRow[] = platformRows.map((row, index) => ({
      id: `platform-${index}-${row.date}`,
      source: 'platform',
      userName: row.userName,
      role: row.role || 'unknown',
      paymentType: row.paymentType,
      method: 'gateway',
      amount: Number(row.amount),
      currency: row.currency,
      convertedUsd: Number(row.convertedUsd),
      status: normalizeStatus(row.status),
      statusRaw: row.status,
      date: row.date,
    }));

    const fromManual: UnifiedPaymentRow[] = manualRows.map((row) => ({
      id: `manual-${row.id}`,
      source: 'manual',
      userName: row.userName || row.userId,
      role: row.userRole || 'unknown',
      paymentType: row.paymentType,
      method: 'bank_transfer',
      amount: Number(row.amount),
      currency: row.currency,
      convertedUsd: row.currency === 'USD' ? Number(row.amount) : null,
      status: normalizeStatus(row.status),
      statusRaw: row.status,
      date: row.submittedAt,
      receiptUrl: row.proofUrl || undefined,
      originalId: row.id,
    }));

    const fromDonations: UnifiedPaymentRow[] = donationRows.map((row) => ({
      id: `donation-${row.id}`,
      source: 'donation',
      userName: row.email || 'Guest donor',
      role: 'donor',
      paymentType: 'donation',
      method: row.paymentMethod || 'bank_transfer',
      amount: Number(row.amount),
      currency: row.currency,
      convertedUsd: row.currency === 'USD' ? Number(row.amount) : null,
      status: normalizeStatus(row.status),
      statusRaw: row.status,
      date: row.createdAt || new Date().toISOString(),
      reference: row.reference,
      receiptUrl: typeof row.metadata?.proofUrl === 'string' ? row.metadata.proofUrl : undefined,
      originalId: row.id,
    }));

    const fromMilestones: UnifiedPaymentRow[] = milestoneRows.map((row) => ({
      id: `milestone-${row.id}`,
      source: 'milestone',
      userName: row.user?.name || row.user?.email || 'Client',
      role: row.user?.role || 'client',
      paymentType: row.milestone?.title || 'milestone',
      method: row.paymentMethod || 'gateway',
      amount: Number(row.amount),
      currency: row.currency,
      convertedUsd: row.currency === 'USD' ? Number(row.amount) : null,
      status: normalizeStatus(row.status),
      statusRaw: row.status,
      date: row.createdAt,
      reference: row.reference,
      receiptUrl: row.proofOfPaymentUrl || undefined,
      originalId: row.id,
    }));

    return [...fromPlatform, ...fromManual, ...fromDonations, ...fromMilestones].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [platformRows, manualRows, donationRows, milestoneRows]);

  const roleOptions = useMemo(() => {
    return Array.from(new Set(unifiedRows.map((r) => r.role).filter(Boolean))).sort();
  }, [unifiedRows]);

  const currencyOptions = useMemo(() => {
    return Array.from(new Set(unifiedRows.map((r) => r.currency).filter(Boolean))).sort();
  }, [unifiedRows]);

  const methodOptions = useMemo(() => {
    return Array.from(new Set(unifiedRows.map((r) => r.method).filter(Boolean))).sort();
  }, [unifiedRows]);

  const statusCounts = useMemo(() => {
    return {
      all: unifiedRows.length,
      pending: unifiedRows.filter((r) => r.status === 'pending').length,
      successful: unifiedRows.filter((r) => r.status === 'successful').length,
      failed: unifiedRows.filter((r) => r.status === 'failed').length,
    };
  }, [unifiedRows]);

  const filteredRows = useMemo(() => {
    return unifiedRows.filter((row) => {
      if (statusTab !== 'all' && row.status !== statusTab) return false;
      if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
      if (roleFilter !== 'all' && row.role !== roleFilter) return false;
      if (currencyFilter !== 'all' && row.currency !== currencyFilter) return false;
      if (methodFilter !== 'all' && row.method !== methodFilter) return false;
      return true;
    });
  }, [unifiedRows, statusTab, sourceFilter, roleFilter, currencyFilter, methodFilter]);

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

      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update manual payment');
    }
  }

  async function confirmDonation(id: string) {
    const token = getStoredToken();
    if (!token) return;

    setError(null);
    const note = window.prompt('Optional confirmation note (press OK to continue):', '') || undefined;

    try {
      await api.donations.confirmBankTransfer(id, token, note);
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not confirm donation');
    }
  }

  async function updateMilestoneStatus(id: string, action: 'approve' | 'reject') {
    const token = getStoredToken();
    if (!token) return;

    setError(null);
    try {
      if (action === 'approve') {
        const note = window.prompt('Optional confirmation note (press OK to continue):', '') || undefined;
        await api.milestones.approvePayment(id, token, note);
      } else {
        const reason = window.prompt('Enter rejection reason:');
        if (!reason?.trim()) return;
        await api.milestones.rejectPayment(id, token, reason.trim());
      }
      await loadAll();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update milestone payment');
    }
  }

  function exportCsv() {
    const header = 'Date,Source,User,Role,Payment Type,Method,Amount,Currency,Converted USD,Status,Reference\n';
    const body = filteredRows
      .map(
        (r) =>
          `"${new Date(r.date).toISOString()}",${r.source},"${(r.userName || '').replace(/"/g, '""')}",${r.role},${r.paymentType},${r.method},${r.amount},${r.currency},${
            r.convertedUsd ?? ''
          },${r.statusRaw},${r.reference ?? ''}`
      )
      .join('\n');

    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'payment-management.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="max-w-7xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Payment Management</h1>
      <p className="text-gray-600 mb-6">Unified view of platform, manual bank-transfer, and donation payments.</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {([
          ['all', `All (${statusCounts.all})`],
          ['pending', `Pending (${statusCounts.pending})`],
          ['successful', `Successful (${statusCounts.successful})`],
          ['failed', `Failed (${statusCounts.failed})`],
        ] as Array<[StatusTab, string]>).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusTab(key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border ${
              statusTab === key ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Period</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="">All</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Payment type</span>
          <input
            type="text"
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
            placeholder="e.g. setup_fee"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs w-32"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">User ID</span>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Filter by user"
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs w-40"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Source</span>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'all' | PaymentSource)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            <option value="platform">Platform</option>
            <option value="manual">Manual</option>
            <option value="donation">Donation</option>
            <option value="milestone">Milestone</option>
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Role</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Currency</span>
          <select
            value={currencyFilter}
            onChange={(e) => setCurrencyFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            {currencyOptions.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2">
          <span className="text-xs text-gray-600">Method</span>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            {methodOptions.map((method) => (
              <option key={method} value={method}>
                {formatMethod(method)}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg bg-primary text-white px-3 py-1.5 text-xs font-medium hover:opacity-90"
        >
          Export CSV
        </button>
      </div>

      {error && <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading payments...</div>
        ) : filteredRows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No payments found for current filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Method</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Currency</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">USD</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Reference / Receipt</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50 align-top">
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(row.date).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{row.source}</td>
                    <td className="px-4 py-3 font-medium text-text-dark">{row.userName}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{row.role.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 text-gray-600">{formatPaymentType(row.paymentType)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{formatMethod(row.method)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{row.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{row.currency}</td>
                    <td className="px-4 py-3 text-right font-medium">{row.convertedUsd !== null ? `$${row.convertedUsd.toFixed(2)}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{row.status}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="flex flex-col gap-1">
                        {row.reference ? <span className="font-mono text-[11px]">{row.reference}</span> : null}
                        {row.receiptUrl ? (
                          <a href={row.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            View receipt
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {row.status === 'pending' && row.source === 'manual' && row.originalId ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => updateManualStatus(row.originalId!, 'confirm')}
                            className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-medium hover:opacity-90"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => updateManualStatus(row.originalId!, 'reject')}
                            className="rounded-lg border border-red-300 text-red-700 px-3 py-1 text-xs font-medium hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : row.status === 'pending' && row.source === 'donation' && row.originalId ? (
                        <button
                          type="button"
                          onClick={() => confirmDonation(row.originalId!)}
                          className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-medium hover:opacity-90"
                        >
                          Confirm donation
                        </button>
                      ) : row.status === 'pending' && row.source === 'milestone' && row.originalId ? (
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => updateMilestoneStatus(row.originalId!, 'approve')}
                            className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-medium hover:opacity-90"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMilestoneStatus(row.originalId!, 'reject')}
                            className="rounded-lg border border-red-300 text-red-700 px-3 py-1 text-xs font-medium hover:bg-red-50"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
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
