'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api } from '@/lib/api';
import type { StartupProfile, AdminCreateStartupBody } from '@/lib/api';

const STAGES = ['Planning', 'Development', 'Testing', 'Live'];
const AI_RISK_LEVELS = ['Low', 'Medium', 'High'];
const AI_MARKET_POTENTIALS = ['Low', 'Medium', 'High', 'Very High'];

function isValidHttpUrl(value: string) {
  if (!value.trim()) return true;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

const EMPTY_FORM: AdminCreateStartupBody = {
  founderName: '',
  founderEmail: '',
  founderPassword: '',
  businessName: '',
  industry: '',
  projectName: '',
  pitchSummary: '',
  tractionMetrics: '',
  fundingNeeded: 0,
  equityOffer: undefined,
  stage: 'Planning',
  country: '',
  liveUrl: '',
  repoUrl: '',
  pitchDeckUrl: '',
  aiFeasibilityScore: undefined,
  aiRiskLevel: '',
  aiMarketPotential: '',
};

export default function AdminStartupsPage() {
  const [startups, setStartups] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    fundingNeeded?: string;
    equityOffer?: string;
    liveUrl?: string;
    repoUrl?: string;
    pitchDeckUrl?: string;
    screenshots?: string;
    aiFeasibilityScore?: string;
  }>({});
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [screenshotsInput, setScreenshotsInput] = useState('');
  const [createForm, setCreateForm] = useState<AdminCreateStartupBody>(EMPTY_FORM);
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
    setFieldErrors({});

    const screenshots = screenshotsInput
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    const nextFieldErrors: {
      fundingNeeded?: string;
      equityOffer?: string;
      liveUrl?: string;
      repoUrl?: string;
      pitchDeckUrl?: string;
      screenshots?: string;
      aiFeasibilityScore?: string;
    } = {};

    if (Number(createForm.fundingNeeded) < 0) nextFieldErrors.fundingNeeded = 'Funding needed must be 0 or greater.';
    if (
      createForm.equityOffer != null &&
      (Number.isNaN(Number(createForm.equityOffer)) || Number(createForm.equityOffer) < 0 || Number(createForm.equityOffer) > 100)
    ) {
      nextFieldErrors.equityOffer = 'Equity offer must be between 0 and 100.';
    }

    if (!isValidHttpUrl(createForm.liveUrl || '')) nextFieldErrors.liveUrl = 'Enter a valid http(s) URL.';
    if (!isValidHttpUrl(createForm.repoUrl || '')) nextFieldErrors.repoUrl = 'Enter a valid http(s) URL.';
    if (!isValidHttpUrl(createForm.pitchDeckUrl || '')) nextFieldErrors.pitchDeckUrl = 'Enter a valid http(s) URL.';

    if (screenshots.some((item) => !isValidHttpUrl(item))) nextFieldErrors.screenshots = 'All screenshot URLs must be valid http(s) links.';

    if (
      createForm.aiFeasibilityScore != null &&
      (Number.isNaN(Number(createForm.aiFeasibilityScore)) ||
        Number(createForm.aiFeasibilityScore) < 0 ||
        Number(createForm.aiFeasibilityScore) > 100)
    ) {
      nextFieldErrors.aiFeasibilityScore = 'Score must be between 0 and 100.';
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError('Please correct highlighted fields.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const created = await api.startups.adminCreate(
        {
          ...createForm,
          screenshots,
          fundingNeeded: Number(createForm.fundingNeeded || 0),
          equityOffer:
            createForm.equityOffer == null || Number.isNaN(Number(createForm.equityOffer))
              ? undefined
              : Number(createForm.equityOffer),
          aiFeasibilityScore:
            createForm.aiFeasibilityScore == null || Number.isNaN(Number(createForm.aiFeasibilityScore))
              ? undefined
              : Number(createForm.aiFeasibilityScore),
        },
        token
      );

      setStartups((prev) => [created, ...prev]);
      setCreateForm(EMPTY_FORM);
      setScreenshotsInput('');
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
        <form onSubmit={handleCreateStartup} className="mb-6 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-secondary">Add Project to Marketplace (Super Admin)</h2>
            <p className="text-sm text-gray-600 mt-1">Fill the same required marketplace information used in approved founder publishing.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">1. Founder & Company (Core)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Founder full name *</label>
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Founder full name" value={createForm.founderName} onChange={(e) => setCreateForm((p) => ({ ...p, founderName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Founder email *</label>
                <input type="email" className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Founder email" value={createForm.founderEmail} onChange={(e) => setCreateForm((p) => ({ ...p, founderEmail: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Temporary password (optional)</label>
                <input type="password" className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Temporary password" value={createForm.founderPassword || ''} onChange={(e) => setCreateForm((p) => ({ ...p, founderPassword: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Business / company name *</label>
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Business / company name" value={createForm.businessName} onChange={(e) => setCreateForm((p) => ({ ...p, businessName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Project name *</label>
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Project name" value={createForm.projectName} onChange={(e) => setCreateForm((p) => ({ ...p, projectName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Industry (optional)</label>
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Industry" value={createForm.industry || ''} onChange={(e) => setCreateForm((p) => ({ ...p, industry: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country</label>
                <input className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" placeholder="Country" value={createForm.country || ''} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Startup stage</label>
                <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full" value={createForm.stage || ''} onChange={(e) => setCreateForm((p) => ({ ...p, stage: e.target.value }))}>
                  <option value="">Use default project stage</option>
                  {STAGES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">2. Marketplace Profile (Required)</h3>
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} placeholder="Pitch summary" value={createForm.pitchSummary} onChange={(e) => setCreateForm((p) => ({ ...p, pitchSummary: e.target.value }))} required />
            <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={3} placeholder="Traction metrics (MRR, users, growth, churn, etc.)" value={createForm.tractionMetrics || ''} onChange={(e) => setCreateForm((p) => ({ ...p, tractionMetrics: e.target.value }))} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Funding needed (USD) *</label>
                <input
                  type="number"
                  min={0}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Funding needed (USD)"
                  value={createForm.fundingNeeded}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, fundingNeeded: Number(e.target.value || 0) }));
                    setFieldErrors((prev) => ({ ...prev, fundingNeeded: undefined }));
                  }}
                  required
                />
                {fieldErrors.fundingNeeded && <p className="mt-1 text-xs text-red-600">{fieldErrors.fundingNeeded}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Equity offer %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Equity offer %"
                  value={createForm.equityOffer ?? ''}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, equityOffer: e.target.value === '' ? undefined : Number(e.target.value) }));
                    setFieldErrors((prev) => ({ ...prev, equityOffer: undefined }));
                  }}
                />
                {fieldErrors.equityOffer && <p className="mt-1 text-xs text-red-600">{fieldErrors.equityOffer}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">3. Product Links & Assets</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Live product URL</label>
                <input
                  type="url"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Live product URL"
                  value={createForm.liveUrl || ''}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, liveUrl: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, liveUrl: undefined }));
                  }}
                />
                {fieldErrors.liveUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.liveUrl}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Repo URL</label>
                <input
                  type="url"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Repo URL"
                  value={createForm.repoUrl || ''}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, repoUrl: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, repoUrl: undefined }));
                  }}
                />
                {fieldErrors.repoUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.repoUrl}</p>}
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Pitch deck URL</label>
                <input
                  type="url"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Pitch deck URL"
                  value={createForm.pitchDeckUrl || ''}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, pitchDeckUrl: e.target.value }));
                    setFieldErrors((prev) => ({ ...prev, pitchDeckUrl: undefined }));
                  }}
                />
                {fieldErrors.pitchDeckUrl && <p className="mt-1 text-xs text-red-600">{fieldErrors.pitchDeckUrl}</p>}
              </div>
            </div>
            <label className="block text-xs font-medium text-gray-700 -mb-2">Screenshot URLs (comma separated)</label>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Screenshot URLs (comma separated)"
              value={screenshotsInput}
              onChange={(e) => {
                setScreenshotsInput(e.target.value);
                setFieldErrors((prev) => ({ ...prev, screenshots: undefined }));
              }}
            />
            {fieldErrors.screenshots && <p className="mt-1 text-xs text-red-600">{fieldErrors.screenshots}</p>}
          </div>

          <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">4. AI Evaluation (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full"
                  placeholder="Feasibility score (0-100)"
                  value={createForm.aiFeasibilityScore ?? ''}
                  onChange={(e) => {
                    setCreateForm((p) => ({ ...p, aiFeasibilityScore: e.target.value === '' ? undefined : Number(e.target.value) }));
                    setFieldErrors((prev) => ({ ...prev, aiFeasibilityScore: undefined }));
                  }}
                />
                {fieldErrors.aiFeasibilityScore && <p className="mt-1 text-xs text-red-600">{fieldErrors.aiFeasibilityScore}</p>}
              </div>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={createForm.aiRiskLevel || ''} onChange={(e) => setCreateForm((p) => ({ ...p, aiRiskLevel: e.target.value }))}>
                <option value="">Risk level</option>
                {AI_RISK_LEVELS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
              <select className="rounded-lg border border-gray-300 px-3 py-2 text-sm" value={createForm.aiMarketPotential || ''} onChange={(e) => setCreateForm((p) => ({ ...p, aiMarketPotential: e.target.value }))}>
                <option value="">Market potential</option>
                {AI_MARKET_POTENTIALS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? 'Publishing…' : 'Publish to marketplace'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="mb-6 rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-gray-500">Loading startup profiles…</div>
      ) : startups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
          No startup profiles yet. Clients can publish from their project.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-200/80 bg-white shadow-sm">
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
