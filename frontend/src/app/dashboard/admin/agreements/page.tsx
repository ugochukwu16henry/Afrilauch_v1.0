'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';
import type {
  AssignedAgreementRow,
  Agreement,
  AgreementType,
  AgreementAuditLog,
} from '@/lib/api';
import { api } from '@/lib/api';

const AGREEMENT_TYPES: AgreementType[] = ['NDA', 'MOU', 'CoFounder', 'Terms', 'FairTreatment', 'HireContract', 'Partnership', 'Investor'];
const STATUS_OPTIONS = ['Pending', 'Signed', 'Overdue'];

export default function AdminAgreementsPage() {
  const [assignments, setAssignments] = useState<AssignedAgreementRow[]>([]);
  const [templates, setTemplates] = useState<Agreement[]>([]);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modal, setModal] = useState<'add' | 'assign' | 'view' | 'logs' | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignedAgreementRow | null>(null);
  const [selectedAgreementId, setSelectedAgreementId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AgreementAuditLog[]>([]);
  const [addTitle, setAddTitle] = useState('');
  const [addType, setAddType] = useState<AgreementType>('NDA');
  const [addTemplateUrl, setAddTemplateUrl] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [assignDeadline, setAssignDeadline] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = getStoredToken();

  function loadAssignments() {
    if (!token) return;
    const params: { status?: string; type?: string } = {};
    if (filterStatus) params.status = filterStatus;
    if (filterType) params.type = filterType;
    api.agreements
      .listAssignments(token, params)
      .then(setAssignments)
      .catch(() => setAssignments([]));
  }

  function loadTemplates() {
    if (!token) return;
    api.agreements.list(token).then(setTemplates).catch(() => setTemplates([]));
  }

  function loadUsers() {
    if (!token) return;
    fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setUsers)
      .catch(() => setUsers([]));
  }

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      api.agreements.listAssignments(token, {}).then(setAssignments).catch(() => setAssignments([])),
      api.agreements.list(token).then(setTemplates).catch(() => setTemplates([])),
      fetch('/api/v1/users', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
        .then(setUsers),
    ]).finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!token || !modal) return;
    if (filterStatus || filterType) loadAssignments();
  }, [token, filterStatus, filterType]);

  const filtered = assignments.filter((a) => {
    const matchSearch =
      !search ||
      a.agreement.title.toLowerCase().includes(search.toLowerCase()) ||
      a.user.name.toLowerCase().includes(search.toLowerCase()) ||
      a.user.email.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const pendingCount = assignments.filter((a) => a.status === 'Pending').length;
  const overdueCount = assignments.filter((a) => a.status === 'Overdue').length;

  function handleCreateAgreement(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setError('');
    api.agreements
      .create({ title: addTitle, type: addType, templateUrl: addTemplateUrl || undefined }, token)
      .then(() => {
        setSuccess('Agreement created.');
        setAddTitle('');
        setAddType('NDA');
        setAddTemplateUrl('');
        setModal(null);
        loadTemplates();
      })
      .catch((err) => setError(err.message || 'Failed to create'));
  }

  function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !selectedAgreementId || !assignUserId) return;
    setError('');
    api.agreements
      .assign(selectedAgreementId, { userId: assignUserId, deadline: assignDeadline || undefined }, token)
      .then(() => {
        setSuccess('Agreement assigned.');
        setAssignUserId('');
        setAssignDeadline('');
        setSelectedAgreementId(null);
        setModal(null);
        loadAssignments();
      })
      .catch((err) => setError(err.message || 'Failed to assign'));
  }

  function openLogs(agreementId: string) {
    if (!token) return;
    api.agreements.logs(agreementId, token).then(setLogs).catch(() => setLogs([]));
    setSelectedAgreementId(agreementId);
    setModal('logs');
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Agreement Management</h1>
      <p className="text-gray-600 mb-6">
        Search by user / agreement / status. Filters: Pending, Signed, Overdue.
      </p>

      {(pendingCount > 0 || overdueCount > 0) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm">
          {pendingCount > 0 && <span>{pendingCount} agreement(s) pending signature.</span>}
          {overdueCount > 0 && <span className={pendingCount ? ' ml-2' : ''}>{overdueCount} overdue.</span>}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
          {success}
          <button type="button" onClick={() => setSuccess('')} className="ml-2 underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by user or agreement..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm w-64"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {AGREEMENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => { setModal('add'); setError(''); }}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Add New Agreement
        </button>
        <button
          type="button"
          onClick={() => { setModal('assign'); setSelectedAgreementId(null); setAssignUserId(''); setAssignDeadline(''); setError(''); }}
          className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
        >
          Assign Agreement
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Agreement Title</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Assigned To</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Signed On</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No assigned agreements. Create a template and assign it to users.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-text-dark">{row.agreement.title}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.user.name} ({row.user.email})
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.agreement.type}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.status === 'Signed'
                            ? 'bg-green-100 text-green-800'
                            : row.status === 'Overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {row.status === 'Signed' && '🟢 '}
                        {row.status === 'Overdue' && '🔴 '}
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(row.signedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => { setSelectedAssignment(row); setModal('view'); }}
                        className="text-primary hover:underline mr-2"
                      >
                        View
                      </button>
                      {row.agreement.templateUrl && (
                        <a
                          href={row.agreement.templateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline mr-2"
                        >
                          Download
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => openLogs(row.agreement.id)}
                        className="text-gray-600 hover:underline"
                      >
                        Logs
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: Add New Agreement */}
      {modal === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-secondary mb-4">Add New Agreement</h2>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <form onSubmit={handleCreateAgreement}>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="add-agreement-title">Title</label>
              <input
                id="add-agreement-title"
                type="text"
                value={addTitle}
                onChange={(e) => setAddTitle(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
                required
              />
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={addType}
                onChange={(e) => setAddType(e.target.value as AgreementType)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
              >
                {AGREEMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template URL (optional)</label>
              <input
                type="url"
                value={addTemplateUrl}
                onChange={(e) => setAddTemplateUrl(e.target.value)}
                placeholder="https://..."
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Agreement */}
      {modal === 'assign' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-secondary mb-4">Assign Agreement</h2>
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <form onSubmit={handleAssign}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Agreement</label>
              <select
                value={selectedAgreementId || ''}
                onChange={(e) => setSelectedAgreementId(e.target.value || null)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
                required
              >
                <option value="">Select agreement</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title} ({t.type})</option>
                ))}
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <select
                value={assignUserId}
                onChange={(e) => setAssignUserId(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
                required
              >
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (optional)</label>
              <input
                type="date"
                value={assignDeadline}
                onChange={(e) => setAssignDeadline(e.target.value)}
                className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setModal(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View assignment */}
      {modal === 'view' && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-secondary mb-4">Assignment details</h2>
            <p className="text-sm text-gray-600"><strong>Agreement:</strong> {selectedAssignment.agreement.title}</p>
            <p className="text-sm text-gray-600"><strong>Type:</strong> {selectedAssignment.agreement.type}</p>
            <p className="text-sm text-gray-600"><strong>Assigned to:</strong> {selectedAssignment.user.name} ({selectedAssignment.user.email})</p>
            <p className="text-sm text-gray-600"><strong>Status:</strong> {selectedAssignment.status}</p>
            <p className="text-sm text-gray-600"><strong>Signed on:</strong> {formatDate(selectedAssignment.signedAt)}</p>
            {selectedAssignment.agreement.templateUrl && (
              <a href={selectedAssignment.agreement.templateUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-primary hover:underline">
                Open / Download template
              </a>
            )}
            <div className="mt-6 flex justify-end">
              <button type="button" onClick={() => { setModal(null); setSelectedAssignment(null); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Audit logs */}
      {modal === 'logs' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-lg my-8">
            <h2 className="text-lg font-semibold text-secondary mb-4">Audit trail</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-600">User</th>
                    <th className="text-left py-2 font-medium text-gray-600">Action</th>
                    <th className="text-left py-2 font-medium text-gray-600">Timestamp</th>
                    <th className="text-left py-2 font-medium text-gray-600">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr><td colSpan={4} className="py-4 text-center text-gray-500">No logs</td></tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100">
                        <td className="py-2">{log.user?.name} ({log.user?.email})</td>
                        <td className="py-2">{log.action}</td>
                        <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-2">{log.ipAddress || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const csv = [
                    ['User', 'Email', 'Action', 'Timestamp', 'IP'],
                    ...logs.map((l) => [l.user?.name ?? '', l.user?.email ?? '', l.action, l.createdAt, l.ipAddress ?? '']),
                  ].map((row) => row.join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'agreement-audit.csv';
                  a.click();
                }}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
              >
                Export CSV
              </button>
              <button type="button" onClick={() => { setModal(null); setLogs([]); }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
