'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api } from '@/lib/api';
import type { StartupProfile, AdminCreateStartupBody } from '@/lib/api';

export default function AdminStartupsPage() {
  const [startups, setStartups] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<AdminCreateStartupBody>({
    founderName: '',
    founderEmail: '',
    founderPassword: '',
    businessName: '',
    industry: '',
    projectName: '',
    pitchSummary: '',
    fundingNeeded: 0,
    stage: 'Planning',
  });
  const token = getStoredToken();

  useEffect(() => {
    if (!token) return;
    api.auth
      .me(token)
      .then((u) => setIsSuperAdmin(u.role === 'super_admin'))
      .catch(() => setIsSuperAdmin(false));
    api.startups
      .list(token)
      .then(setStartups)
      .catch(() => setStartups([]))
      .finally(() => setLoading(false));
  }, [token]);

  async function approve(id: string) {
    if (!token) return;
    setError('');
    try {
      await api.startups.approve(id, token);
      setStartups((prev) => prev.map((s) => (s.id === id ? { ...s, visibilityStatus: 'approved' } : s)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCreateStartup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !isSuperAdmin) return;
    setCreating(true);
    setError('');
    try {
      const created = await api.startups.adminCreate(
        {
          ...createForm,
          fundingNeeded: Number(createForm.fundingNeeded || 0),
          equityOffer:
            createForm.equityOffer == null || Number.isNaN(Number(createForm.equityOffer))
              ? undefined
              : Number(createForm.equityOffer),
        },
        token
      );
      setStartups((prev) => [created, ...prev]);
      setCreateForm({
        founderName: '',
        founderEmail: '',
        founderPassword: '',
        businessName: '',
        industry: '',
        projectName: '',
        pitchSummary: '',
        fundingNeeded: 0,
        stage: 'Planning',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create startup');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Startup approvals</h1>
      <p className="text-gray-600 mb-6">
        Approve startup profiles before they appear in the investor marketplace.
      </p>

      {isSuperAdmin && (
        <form onSubmit={handleCreateStartup} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wide">Add Person or Company to Marketplace</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Founder full name"
              value={createForm.founderName}
              onChange={(e) => setCreateForm((p) => ({ ...p, founderName: e.target.value }))}
              required
            />
            <input
              type="email"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Founder email"
              value={createForm.founderEmail}
              onChange={(e) => setCreateForm((p) => ({ ...p, founderEmail: e.target.value }))}
              required
            />
            <input
              type="password"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Temporary password (for new user)"
              value={createForm.founderPassword || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, founderPassword: e.target.value }))}
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Business / company name"
              value={createForm.businessName}
              onChange={(e) => setCreateForm((p) => ({ ...p, businessName: e.target.value }))}
              required
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Project name"
              value={createForm.projectName}
              onChange={(e) => setCreateForm((p) => ({ ...p, projectName: e.target.value }))}
              required
            />
            <input
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Industry (optional)"
              value={createForm.industry || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))}
            />
            <input
              type="number"
              min={0}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Funding needed"
              value={createForm.fundingNeeded}
              onChange={(e) => setCreateForm((p) => ({ ...p, fundingNeeded: Number(e.target.value || 0) }))}
              required
            />
            <input
              type="number"
              min={0}
              max={100}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Equity offer % (optional)"
              value={createForm.equityOffer ?? ''}
              onChange={(e) =>
                setCreateForm((p) => ({
                  ...p,
                  equityOffer: e.target.value === '' ? undefined : Number(e.target.value),
                }))
              }
            />
          </div>
          <textarea
            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={4}
            placeholder="Pitch summary"
            value={createForm.pitchSummary}
            onChange={(e) => setCreateForm((p) => ({ ...p, pitchSummary: e.target.value }))}
            required
          />
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? 'Adding…' : 'Add to marketplace'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="mb-6 rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : startups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No startup profiles yet. Clients can publish from their project.
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Funding needed</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-text-dark">{(s.project as { projectName?: string })?.projectName ?? s.projectId}</td>
                  <td className="px-4 py-3 text-gray-600">{s.stage}</td>
                  <td className="px-4 py-3 text-gray-600">{Number(s.fundingNeeded).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.visibilityStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : s.visibilityStatus === 'pending_approval'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {s.visibilityStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.visibilityStatus !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => approve(s.id)}
                        className="text-primary hover:underline"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
