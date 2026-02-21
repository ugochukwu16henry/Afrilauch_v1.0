'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type TeamMemberRow, type CustomRoleRow } from '@/lib/api';
import { ProfileImage } from '@/components/common/ProfileImage';

const TEAM_ROLES = [
  'cofounder',
  'developer',
  'designer',
  'marketer',
  'project_manager',
  'finance_admin',
  'hr_manager',
  'legal_team',
  'super_admin',
];

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRoleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('developer');
  const [inviteCustomRoleId, setInviteCustomRoleId] = useState<string>('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDept, setNewRoleDept] = useState('');
  const [newRoleLevel, setNewRoleLevel] = useState('');
  const [addRoleSending, setAddRoleSending] = useState(false);
  const [avatarUpdatingId, setAvatarUpdatingId] = useState<string | null>(null);

  function load() {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      api.team.list(token),
      api.team.listCustomRoles(token),
    ])
      .then(([list, roles]) => {
        setMembers(list);
        setCustomRoles(roles);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !inviteEmail.trim()) return;
    setInviteError('');
    setInviteSending(true);
    try {
      await api.team.invite(
        {
          email: inviteEmail.trim(),
          role: inviteRole,
          customRoleId: inviteCustomRoleId || undefined,
        },
        token
      );
      setInviteEmail('');
      setInviteSending(false);
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
      setInviteSending(false);
    }
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !newRoleName.trim()) return;
    setAddRoleSending(true);
    try {
      await api.team.createCustomRole(
        {
          name: newRoleName.trim(),
          department: newRoleDept.trim() || undefined,
          level: newRoleLevel.trim() || undefined,
        },
        token
      );
      setNewRoleName('');
      setNewRoleDept('');
      setNewRoleLevel('');
      load();
    } catch {
      // ignore
    }
    setAddRoleSending(false);
  }

  async function handleDelete(userId: string) {
    const token = getStoredToken();
    if (!token || !confirm('Remove this team member?')) return;
    try {
      await api.team.deleteMember(userId, token);
      load();
    } catch {
      // ignore
    }
  }

  async function handleAvatarUpload(userId: string, file: File | null) {
    const token = getStoredToken();
    if (!token || !file) return;
    setAvatarUpdatingId(userId);
    try {
      await api.settings.profileMedia.adminUploadUserAvatar(userId, file, token);
      load();
    } catch {
      // ignore
    } finally {
      setAvatarUpdatingId(null);
    }
  }

  async function handleAvatarDelete(userId: string) {
    const token = getStoredToken();
    if (!token) return;
    setAvatarUpdatingId(userId);
    try {
      await api.settings.profileMedia.adminDeleteUserAvatar(userId, token);
      load();
    } catch {
      // ignore
    } finally {
      setAvatarUpdatingId(null);
    }
  }

  function roleLabel(m: TeamMemberRow) {
    return m.customRole?.name ?? m.role.replace(/_/g, ' ');
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Team Management</h1>
      <p className="text-gray-600 mb-6">
        Invite team members, assign roles, and manage custom roles. Super Admin only.
      </p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="font-semibold text-secondary mb-4">Invite team member</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap gap-4 items-end">
          <label className="min-w-[200px]">
            <span className="block text-sm text-gray-600 mb-1">Email</span>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="colleague@example.com"
            />
          </label>
          <label>
            <span className="block text-sm text-gray-600 mb-1">Role</span>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {TEAM_ROLES.map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </label>
          {customRoles.length > 0 && (
            <label>
              <span className="block text-sm text-gray-600 mb-1">Custom role (optional)</span>
              <select
                value={inviteCustomRoleId}
                onChange={(e) => setInviteCustomRoleId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">—</option>
                {customRoles.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </label>
          )}
          <button
            type="submit"
            disabled={inviteSending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {inviteSending ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        {inviteError && <p className="mt-2 text-sm text-red-600">{inviteError}</p>}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="font-semibold text-secondary mb-4">Add custom role</h2>
        <form onSubmit={handleAddRole} className="flex flex-wrap gap-4 items-end">
          <label>
            <span className="block text-sm text-gray-600 mb-1">Role name</span>
            <input
              type="text"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48"
              placeholder="e.g. Brand Designer"
            />
          </label>
          <label>
            <span className="block text-sm text-gray-600 mb-1">Department</span>
            <input
              type="text"
              value={newRoleDept}
              onChange={(e) => setNewRoleDept(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-40"
              placeholder="Optional"
            />
          </label>
          <label>
            <span className="block text-sm text-gray-600 mb-1">Level</span>
            <input
              type="text"
              value={newRoleLevel}
              onChange={(e) => setNewRoleLevel(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-36"
              placeholder="e.g. Level 2"
            />
          </label>
          <button
            type="submit"
            disabled={addRoleSending || !newRoleName.trim()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Add role
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <h2 className="px-4 py-3 border-b border-gray-100 font-semibold text-secondary">Team members</h2>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last login</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No team members yet. Send an invite above.
                    </td>
                  </tr>
                ) : (
                  members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium text-text-dark">
                        <div className="flex items-center gap-2">
                          <ProfileImage src={m.avatarUrl} alt={`${m.name} avatar`} name={m.name} className="h-8 w-8 rounded-full" />
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{m.email}</td>
                      <td className="px-4 py-3 text-gray-600">{roleLabel(m)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {m.lastLoginAt ? new Date(m.lastLoginAt).toLocaleString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <label className="text-primary hover:underline text-sm mr-3 cursor-pointer">
                          {avatarUpdatingId === m.id ? 'Updating…' : 'Upload avatar'}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => handleAvatarUpload(m.id, e.target.files?.[0] || null)}
                            disabled={avatarUpdatingId === m.id}
                          />
                        </label>
                        {m.avatarUrl && (
                          <button
                            type="button"
                            onClick={() => handleAvatarDelete(m.id)}
                            className="text-amber-600 hover:underline text-sm mr-3"
                            disabled={avatarUpdatingId === m.id}
                          >
                            Remove avatar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(m.id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Remove
                        </button>
                      </td>
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
