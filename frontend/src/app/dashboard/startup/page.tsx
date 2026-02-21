'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type Project, type StartupProfile, type StartupPublishBody, type StartupScoreResponse } from '@/lib/api';

const STAGES = ['Planning', 'Development', 'Testing', 'Live'];
const AI_RISK_LEVELS = ['Low', 'Medium', 'High'];
const AI_MARKET_POTENTIALS = ['Low', 'Medium', 'High', 'Very High'];

export default function PublishToMarketplacePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [myProfiles, setMyProfiles] = useState<StartupProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<StartupPublishBody>({
    projectId: '',
    pitchSummary: '',
    tractionMetrics: '',
    fundingNeeded: 0,
    equityOffer: undefined,
    stage: '',
  });
  const [score, setScore] = useState<StartupScoreResponse | null>(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [screenshotsInput, setScreenshotsInput] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([api.projects.list(token), api.startups.myProfiles(token)])
      .then(async ([projList, profileList]) => {
        setProjects(projList);
        setMyProfiles(Array.isArray(profileList) ? profileList : []);
        if (projList.length > 0 && !form.projectId) {
          const first = projList[0];
          const existing = (Array.isArray(profileList) ? profileList : []).find(
            (p: StartupProfile) => p.projectId === first.id
          );
          setForm((f) => ({
            ...f,
            projectId: first.id,
            pitchSummary: existing?.pitchSummary ?? '',
            tractionMetrics: existing?.tractionMetrics ?? '',
            fundingNeeded: existing?.fundingNeeded ?? 0,
            equityOffer: existing?.equityOffer ?? undefined,
            stage: existing?.stage ?? first.stage ?? '',
            country: existing?.country ?? '',
            liveUrl: existing?.liveUrl ?? '',
            repoUrl: existing?.repoUrl ?? '',
            pitchDeckUrl: existing?.pitchDeckUrl ?? '',
            aiFeasibilityScore: existing?.aiFeasibilityScore ?? undefined,
            aiRiskLevel: existing?.aiRiskLevel ?? '',
            aiMarketPotential: existing?.aiMarketPotential ?? '',
          }));
          setScreenshotsInput(Array.isArray(existing?.screenshots) ? existing!.screenshots!.join(', ') : '');
          if (existing) {
            setScoreLoading(true);
            api.startups
              .getScore(existing.id, token)
              .then(setScore)
              .catch(() => setScore(null))
              .finally(() => setScoreLoading(false));
          }
        }
      })
      .catch(() => setError('Failed to load projects or profiles'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!form.projectId || myProfiles.length === 0) return;
    const existing = myProfiles.find((p) => p.projectId === form.projectId);
    if (existing) {
      setForm((f) => ({
        ...f,
        pitchSummary: existing.pitchSummary,
        tractionMetrics: existing.tractionMetrics ?? '',
        fundingNeeded: Number(existing.fundingNeeded),
        equityOffer: existing.equityOffer != null ? Number(existing.equityOffer) : undefined,
        stage: existing.stage,
        country: existing.country ?? '',
        liveUrl: existing.liveUrl ?? '',
        repoUrl: existing.repoUrl ?? '',
        pitchDeckUrl: existing.pitchDeckUrl ?? '',
        aiFeasibilityScore: existing.aiFeasibilityScore ?? undefined,
        aiRiskLevel: existing.aiRiskLevel ?? '',
        aiMarketPotential: existing.aiMarketPotential ?? '',
      }));
      setScreenshotsInput(Array.isArray(existing.screenshots) ? existing.screenshots.join(', ') : '');
      const token = getStoredToken();
      if (token) {
        setScoreLoading(true);
        api.startups
          .getScore(existing.id, token)
          .then(setScore)
          .catch(() => setScore(null))
          .finally(() => setScoreLoading(false));
      }
    }
  }, [form.projectId, myProfiles]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const token = getStoredToken();
    if (!token) return;
    if (!form.projectId || !form.pitchSummary.trim() || form.fundingNeeded < 0) {
      setError('Please fill in project, pitch summary, and funding needed.');
      return;
    }
    setSubmitting(true);
    const body: StartupPublishBody = {
      projectId: form.projectId,
      pitchSummary: form.pitchSummary.trim(),
      fundingNeeded: Number(form.fundingNeeded),
      stage: form.stage || undefined,
      country: form.country?.trim() || undefined,
      liveUrl: form.liveUrl?.trim() || undefined,
      repoUrl: form.repoUrl?.trim() || undefined,
      pitchDeckUrl: form.pitchDeckUrl?.trim() || undefined,
      aiFeasibilityScore:
        form.aiFeasibilityScore == null || Number.isNaN(Number(form.aiFeasibilityScore))
          ? undefined
          : Number(form.aiFeasibilityScore),
      aiRiskLevel: form.aiRiskLevel?.trim() || undefined,
      aiMarketPotential: form.aiMarketPotential?.trim() || undefined,
    };
    if (form.tractionMetrics?.trim()) body.tractionMetrics = form.tractionMetrics.trim();
    if (form.equityOffer != null && form.equityOffer >= 0) body.equityOffer = Number(form.equityOffer);
    const screenshots = screenshotsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (screenshots.length > 0) body.screenshots = screenshots;
    api.startups
      .publish(body, token)
      .then((created) => {
        setSuccess(
          created.visibilityStatus === 'approved'
            ? 'Startup profile published and visible on the marketplace.'
            : 'Startup profile submitted for admin approval. It will appear on the marketplace once approved.'
        );
        setMyProfiles((prev) => {
          const rest = prev.filter((p) => p.projectId !== created.projectId);
          return [{ ...created, project: created.project } as StartupProfile, ...rest];
        });
      })
      .catch((err: Error) => setError(err.message || 'Failed to publish'))
      .finally(() => setSubmitting(false));
  }

  if (loading) {
    return (
      <div className="max-w-2xl">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const currentProfile = myProfiles.find((p) => p.projectId === form.projectId);

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Publish to Marketplace</h1>
      <p className="text-gray-600 mb-6">
        Submit your startup profile so verified investors can discover and fund your business. Profiles require admin
        approval before they appear on the marketplace.
      </p>

      {projects.length === 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          You need at least one project before you can publish to the marketplace. Create a project from your dashboard
          first.
        </div>
      )}

      {projects.length > 0 && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm" role="alert">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
            <select
              value={form.projectId}
              onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectName}
                </option>
              ))}
            </select>
            {currentProfile && (
              <p className="mt-1 text-xs text-gray-500">
                Status: <span className="font-medium capitalize">{currentProfile.visibilityStatus.replace('_', ' ')}</span>
              </p>
            )}
          </div>
          {currentProfile && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">Startup success score</span>
                {scoreLoading ? (
                  <span className="text-gray-500 text-xs">Calculating…</span>
                ) : score ? (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {score.scoreTotal}/100
                  </span>
                ) : (
                  <span className="text-gray-500 text-xs">Not calculated yet</span>
                )}
              </div>
              {score?.suggestions && score.suggestions.length > 0 && (
                <ul className="list-disc list-inside text-gray-600 text-xs">
                  {score.suggestions.slice(0, 3).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              )}
              {score?.breakdown && (
                <dl className="mt-2 grid gap-1 text-[11px] text-gray-600 sm:grid-cols-2">
                  <div className="flex justify-between">
                    <dt>Clarity</dt>
                    <dd className="font-semibold">{score.breakdown.problemClarity}/10</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Market</dt>
                    <dd className="font-semibold">{score.breakdown.marketSize}/15</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Execution</dt>
                    <dd className="font-semibold">{score.breakdown.businessModel + score.breakdown.feasibility}/30</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Traction</dt>
                    <dd className="font-semibold">{score.breakdown.traction}/15</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Team</dt>
                    <dd className="font-semibold">{score.breakdown.teamStrength}/10</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Financials</dt>
                    <dd className="font-semibold">{score.breakdown.financialLogic}/10</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Investor readiness</dt>
                    <dd className="font-semibold">{score.breakdown.innovation}/10</dd>
                  </div>
                </dl>
              )}
              <button
                type="button"
                onClick={() => {
                  const token = getStoredToken();
                  if (!token || !currentProfile) return;
                  setScoreLoading(true);
                  api.startups
                    .recalcScore(currentProfile.id, token)
                    .then(setScore)
                    .catch(() => setScore(null))
                    .finally(() => setScoreLoading(false));
                }}
                className="mt-2 inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
              >
                Recalculate score
              </button>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch summary *</label>
            <textarea
              value={form.pitchSummary}
              onChange={(e) => setForm((f) => ({ ...f, pitchSummary: e.target.value }))}
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Brief pitch: problem, solution, market, team..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Traction metrics (optional)</label>
            <textarea
              value={form.tractionMetrics}
              onChange={(e) => setForm((f) => ({ ...f, tractionMetrics: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. MRR, users, growth rate..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Funding needed (USD) *</label>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.fundingNeeded || ''}
                onChange={(e) => setForm((f) => ({ ...f, fundingNeeded: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equity offer % (optional)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.equityOffer ?? ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    equityOffer: e.target.value === '' ? undefined : parseFloat(e.target.value),
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Use project stage</option>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={form.country || ''}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Nigeria"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live product URL</label>
              <input
                type="url"
                value={form.liveUrl || ''}
                onChange={(e) => setForm((f) => ({ ...f, liveUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repo URL</label>
              <input
                type="url"
                value={form.repoUrl || ''}
                onChange={(e) => setForm((f) => ({ ...f, repoUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://github.com/..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pitch deck URL</label>
              <input
                type="url"
                value={form.pitchDeckUrl || ''}
                onChange={(e) => setForm((f) => ({ ...f, pitchDeckUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Screenshot URLs</label>
            <input
              type="text"
              value={screenshotsInput}
              onChange={(e) => setScreenshotsInput(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="https://img1..., https://img2..."
            />
            <p className="mt-1 text-xs text-gray-500">Separate multiple screenshot links with commas.</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">AI Evaluation Fields (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Feasibility score (0-100)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={form.aiFeasibilityScore ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      aiFeasibilityScore: e.target.value === '' ? undefined : Number(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Risk level</label>
                <select
                  value={form.aiRiskLevel || ''}
                  onChange={(e) => setForm((f) => ({ ...f, aiRiskLevel: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {AI_RISK_LEVELS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Market potential</label>
                <select
                  value={form.aiMarketPotential || ''}
                  onChange={(e) => setForm((f) => ({ ...f, aiMarketPotential: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select</option>
                  {AI_MARKET_POTENTIALS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : currentProfile ? 'Update & resubmit' : 'Submit for approval'}
            </button>
          </div>
        </form>
      )}

      {myProfiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-secondary mb-3">Your startup profiles</h2>
          <ul className="space-y-2">
            {myProfiles.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm"
              >
                <span className="font-medium">
                  {(p as StartupProfile & { project?: { projectName?: string } }).project?.projectName ?? p.projectId}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.visibilityStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : p.visibilityStatus === 'pending_approval'
                        ? 'bg-amber-100 text-amber-800'
                        : p.visibilityStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {p.visibilityStatus.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
