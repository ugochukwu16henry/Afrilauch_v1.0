'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getRoleFromToken, api, type User, type UserFeatureState } from '@/lib/api';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus?: string;
  accountStatusReason?: string | null;
  accountStatusAt?: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'locked' | 'pending_deletion' | 'banned'>('all');
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [featureState, setFeatureState] = useState<UserFeatureState | null>(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [me, setMe] = useState<User | null>(null);
  const [tokenRole, setTokenRole] = useState<string | null>(null);
  const [pauseReason, setPauseReason] = useState('');
  const [pauseExpiresAt, setPauseExpiresAt] = useState('');
  const [resumeReason, setResumeReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [actionLoading, setActionLoading] = useState<'pause' | 'resume' | 'delete' | null>(null);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const effectiveRole = me?.role || tokenRole;
  const canViewFeatures = effectiveRole === 'super_admin';
  const canControlAccounts = effectiveRole === 'super_admin';

  async function fetchUsers(currentFilter: typeof statusFilter) {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await api.users.list(token, currentFilter === 'all' ? undefined : { accountStatus: currentFilter });
      setUsers(rows as UserRow[]);
      setSelectedUser((prev) => {
        if (!prev) return null;
        return rows.find((u) => u.id === prev.id) ?? null;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = getStoredToken();
    setTokenRole(getRoleFromToken(token));
    if (!token) {
      setLoading(false);
      return;
    }
    api.auth
      .me(token)
      .then(setMe)
      .catch(() => setMe(null));
    fetchUsers(statusFilter).catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchUsers(statusFilter).catch(() => setUsers([]));
  }, [statusFilter]);

  function handleSelectUser(row: UserRow) {
    const token = getStoredToken();
    setSelectedUser(row);
    setActionError('');
    setActionSuccess('');
    if (!canViewFeatures || !token) return;
    setFeatureLoading(true);
    setFeatureState(null);
    api.superAdmin
      .userFeatures(row.id, token)
      .then(setFeatureState)
      .catch(() => setFeatureState(null))
      .finally(() => setFeatureLoading(false));
  }

  async function handlePauseAccount() {
    const token = getStoredToken();
    if (!token || !selectedUser) return;
    const reason = pauseReason.trim();
    if (!reason) {
      setActionError('Pause reason is required.');
      return;
    }
    setActionLoading('pause');
    setActionError('');
    setActionSuccess('');
    try {
      await api.superAdmin.pauseUserAccount(
        selectedUser.id,
        {
          reason,
          suspensionExpiresAt: pauseExpiresAt.trim() || undefined,
        },
        token
      );
      setActionSuccess('Account paused successfully.');
      await fetchUsers(statusFilter);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to pause account');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleResumeAccount() {
    const token = getStoredToken();
    if (!token || !selectedUser) return;
    setActionLoading('resume');
    setActionError('');
    setActionSuccess('');
    try {
      await api.superAdmin.resumeUserAccount(
        selectedUser.id,
        {
          reason: resumeReason.trim() || undefined,
        },
        token
      );
      setActionSuccess('Account resumed successfully.');
      await fetchUsers(statusFilter);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to resume account');
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePermanentDeleteAccount() {
    const token = getStoredToken();
    if (!token || !selectedUser) return;
    const reason = deleteReason.trim();
    const password = deletePassword.trim();
    if (!reason || !password) {
      setActionError('Delete reason and Super Admin password are required.');
      return;
    }
    const confirmed = window.confirm(
      `This action is irreversible and will permanently delete ${selectedUser.email}. Continue?`
    );
    if (!confirmed) return;

    setActionLoading('delete');
    setActionError('');
    setActionSuccess('');
    try {
      await api.superAdmin.permanentlyDeleteUser(selectedUser.id, { reason, password }, token);
      setActionSuccess('Account permanently deleted.');
      setSelectedUser(null);
      setFeatureState(null);
      setDeleteReason('');
      setDeletePassword('');
      await fetchUsers(statusFilter);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Failed to permanently delete account');
    } finally {
      setActionLoading(null);
    }
  }

  const selectedStatus = selectedUser?.accountStatus ?? 'active';
  const selectedIsSelf = Boolean(selectedUser && me && selectedUser.id === me.id);
  const selectedIsSuperAdmin = selectedUser?.role === 'super_admin';

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Users</h1>
      <p className="text-xs text-gray-500 mb-1">Detected role: {effectiveRole || 'unknown'}</p>
      <p className="text-gray-600 mb-6 text-sm">
        View all users, their roles, and (for Super Admin) a snapshot of feature access and payment-based unlocks.
      </p>
      <div className="mb-4 flex items-center gap-2 text-sm">
        <label className="text-gray-600" htmlFor="statusFilter">
          Account status:
        </label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-md border border-gray-300 px-2 py-1 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="locked">Locked</option>
          <option value="pending_deletion">Pending deletion</option>
          <option value="banned">Banned</option>
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr,minmax(0,1.2fr)] items-start">
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Account status</th>
                  {canViewFeatures && (
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Feature access</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={canViewFeatures ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                      No users
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gray-100 hover:bg-gray-50/50 cursor-pointer"
                      onClick={() => handleSelectUser(u)}
                    >
                      <td className="px-4 py-3 font-medium text-text-dark">{u.name}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3 capitalize text-primary">{u.role.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 capitalize">
                          {(u.accountStatus || 'active').replace('_', ' ')}
                        </span>
                      </td>
                      {canViewFeatures && (
                        <td className="px-4 py-3 text-xs text-gray-600">
                          {selectedUser?.id === u.id && featureLoading && 'Loading…'}
                          {selectedUser?.id === u.id && !featureLoading && featureState && (
                            <span>
                              {featureState.hasSetupAccess ? 'Setup: unlocked' : 'Setup: locked'} ·{' '}
                              {featureState.hasMarketplaceAccess ? 'Marketplace: unlocked' : 'Marketplace: locked'}
                            </span>
                          )}
                          {(!selectedUser || selectedUser.id !== u.id) && 'Click for details'}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {canViewFeatures && (
          <aside className="rounded-xl border border-gray-200 bg-white p-4 text-sm sticky top-4">
            <h2 className="font-semibold text-secondary mb-2">User feature snapshot</h2>
            {!selectedUser && (
              <p className="text-xs text-gray-500">
                Select a user on the left to see their feature access, payment-related unlocks, and badges.
              </p>
            )}
            {selectedUser && featureLoading && (
              <p className="text-xs text-gray-500">Loading feature state for {selectedUser.email}…</p>
            )}
            {selectedUser && !featureLoading && featureState && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-1">
                  {selectedUser.name} · {selectedUser.email}
                </p>
                <ul className="space-y-1 text-xs">
                  <li>
                    <span className="font-medium text-gray-700">Setup access:</span>{' '}
                    {featureState.hasSetupAccess ? 'Unlocked' : 'Locked'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Marketplace:</span>{' '}
                    {featureState.hasMarketplaceAccess ? 'Unlocked' : 'Locked'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Early Founder:</span>{' '}
                    {featureState.isEarlyFounder ? 'Yes' : 'No'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Donor badge:</span>{' '}
                    {featureState.hasDonorBadge ? 'Yes' : 'No'}
                  </li>
                  <li>
                    <span className="font-medium text-gray-700">Pending manual payment:</span>{' '}
                    {featureState.hasPendingManualPayment ? 'Yes' : 'No'}
                  </li>
                </ul>
                {featureState.hasPendingManualPayment && featureState.pendingManualPayment && (
                  <p className="mt-1 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
                    Latest pending: {Number(featureState.pendingManualPayment.amount).toLocaleString()}{' '}
                    {featureState.pendingManualPayment.currency} ({featureState.pendingManualPayment.paymentType})
                  </p>
                )}
                {featureState.badges.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] font-medium text-gray-700 mb-1">Badges</p>
                    <div className="flex flex-wrap gap-1">
                      {featureState.badges.map((b) => (
                        <span
                          key={`${b.badgeName}-${b.dateAwarded}`}
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
                        >
                          {b.badgeName
                            .split('_')
                            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                            .join(' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {featureState.earlyAccess && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <p className="text-[11px] font-medium text-gray-700 mb-1">Early Founder program</p>
                    <p className="text-[11px] text-gray-600">
                      Status: {featureState.earlyAccess.status} · Seat #{featureState.earlyAccess.signupOrder}
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedUser && canControlAccounts && (
              <div className="mt-4 border-t border-gray-100 pt-3 space-y-3">
                <h3 className="font-semibold text-secondary">Account controls</h3>
                <p className="text-xs text-gray-500">
                  Status: <span className="font-medium capitalize">{selectedStatus.replace('_', ' ')}</span>
                </p>
                {selectedUser.accountStatusReason && (
                  <p className="text-xs text-gray-500">Reason: {selectedUser.accountStatusReason}</p>
                )}

                {actionError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-2 py-1">{actionError}</p>
                )}
                {actionSuccess && (
                  <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-md px-2 py-1">
                    {actionSuccess}
                  </p>
                )}

                {(selectedIsSelf || selectedIsSuperAdmin) ? (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1">
                    This account cannot be paused or permanently deleted from this panel.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-700">Pause reason</label>
                      <input
                        value={pauseReason}
                        onChange={(e) => setPauseReason(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Policy violation, security review, etc."
                      />
                      <label className="block text-xs font-medium text-gray-700">Suspension expires at (optional)</label>
                      <input
                        type="datetime-local"
                        value={pauseExpiresAt}
                        onChange={(e) => setPauseExpiresAt(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={handlePauseAccount}
                        className="w-full rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 disabled:opacity-50"
                      >
                        {actionLoading === 'pause' ? 'Pausing…' : 'Pause account'}
                      </button>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <label className="block text-xs font-medium text-gray-700">Resume reason (optional)</label>
                      <input
                        value={resumeReason}
                        onChange={(e) => setResumeReason(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Issue resolved"
                      />
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={handleResumeAccount}
                        className="w-full rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 disabled:opacity-50"
                      >
                        {actionLoading === 'resume' ? 'Resuming…' : 'Resume account'}
                      </button>
                    </div>

                    <div className="space-y-2 border-t border-gray-100 pt-3">
                      <label className="block text-xs font-medium text-gray-700">Permanent delete reason</label>
                      <input
                        value={deleteReason}
                        onChange={(e) => setDeleteReason(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Regulatory request, legal takedown, etc."
                      />
                      <label className="block text-xs font-medium text-gray-700">Super Admin password</label>
                      <input
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        disabled={actionLoading !== null}
                        onClick={handlePermanentDeleteAccount}
                        className="w-full rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-800 disabled:opacity-50"
                      >
                        {actionLoading === 'delete' ? 'Deleting…' : 'Permanently delete account'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
