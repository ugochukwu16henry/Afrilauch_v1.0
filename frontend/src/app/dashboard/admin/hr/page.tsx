'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type TalentListItem } from '@/lib/api';
import type { AdminCreateTalentBody } from '@/lib/api';

export default function HRDashboardPage() {
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [createForm, setCreateForm] = useState<AdminCreateTalentBody>({
    name: '',
    email: '',
    password: '',
    skills: [],
    yearsExperience: 1,
    roleCategory: '',
    customRole: '',
    portfolioUrl: '',
    country: '',
  });
  const [skillsInput, setSkillsInput] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then((u) => setIsSuperAdmin(u.role === 'super_admin'))
      .catch(() => setIsSuperAdmin(false));
    api.talent.list(token, filter === 'all' ? undefined : filter)
      .then((r) => setTalents(r.items))
      .catch(() => setTalents([]))
      .finally(() => setLoading(false));
  }, [filter]);

  async function handleApprove(id: string, status: 'approved' | 'rejected') {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.talent.approve(id, status, token);
      setTalents((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateTalent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !isSuperAdmin) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (skills.length === 0) {
      setError('Please enter at least one skill.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await api.talent.adminCreate(
        {
          ...createForm,
          skills,
          yearsExperience: Number(createForm.yearsExperience || 0),
        },
        token
      );
      setCreateForm({
        name: '',
        email: '',
        password: '',
        skills: [],
        yearsExperience: 1,
        roleCategory: '',
        customRole: '',
        portfolioUrl: '',
        country: '',
      });
      setSkillsInput('');
      const refreshed = await api.talent.list(token, filter === 'all' ? undefined : filter);
      setTalents(refreshed.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add talent');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">HR Manager — Talent review</h1>
      <p className="text-gray-600 mb-6">Approve or reject talent applications. Only approved talents appear in the marketplace.</p>

      {isSuperAdmin && (
        <form onSubmit={handleCreateTalent} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wide">Add Talent Directly to Marketplace</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Full name"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <input
              type="email"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Email"
              value={createForm.email}
              onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
              required
            />
            <input
              type="password"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Temporary password (for new user)"
              value={createForm.password || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Years of experience"
              value={createForm.yearsExperience}
              onChange={(e) => setCreateForm((p) => ({ ...p, yearsExperience: Number(e.target.value || 0) }))}
              required
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Role category (e.g. engineering)"
              value={createForm.roleCategory || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, roleCategory: e.target.value }))}
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Custom role (e.g. Full-stack dev)"
              value={createForm.customRole || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, customRole: e.target.value }))}
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2"
              placeholder="Skills (comma separated)"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              required
            />
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? 'Adding…' : 'Add talent'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="mb-6 rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : talents.length === 0 ? (
        <p className="text-gray-500">No talents in this category.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {talents.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm">
                    <div>{t.user.name}</div>
                    <div className="text-gray-500">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.skills.slice(0, 4).join(', ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'approved' ? 'bg-green-100 text-green-800' : t.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(t.id, 'approved')} className="text-green-600 text-sm font-medium hover:underline mr-2">Approve</button>
                        <button onClick={() => handleApprove(t.id, 'rejected')} className="text-red-600 text-sm font-medium hover:underline">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/dashboard/admin/hr/hirers" className="text-primary font-medium hover:underline">View all hirers →</Link>
        {' · '}
        <Link href="/dashboard/admin/hr/hires" className="text-primary font-medium hover:underline">View all hires →</Link>
      </div>
    </div>
  );
}
