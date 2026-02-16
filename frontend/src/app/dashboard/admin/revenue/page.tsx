'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';
import { clearCMSCache } from '@/hooks/useCMS';

const VISIBILITY_KEYS = [
  { key: 'homepage', label: 'Show on Homepage' },
  { key: 'pricing', label: 'Show on Pricing Page' },
  { key: 'onboarding', label: 'Show in Onboarding' },
  { key: 'dashboard', label: 'Show in User Dashboard' },
  { key: 'deal_room', label: 'Show in Investor Deal Room' },
] as const;

type VisibilityState = Record<string, boolean>;

function defaultVisibility(): VisibilityState {
  return Object.fromEntries(VISIBILITY_KEYS.map(({ key }) => [key, true]));
}

const STAGE_TYPES = [
  { value: 'green', label: 'Idea / Entry Stage' },
  { value: 'yellow', label: 'Development Stage' },
  { value: 'blue', label: 'Live Product Stage' },
  { value: 'purple', label: 'Scale Stage' },
] as const;

type StepRecord = {
  stageLabel?: string;
  stageTitle?: string;
  payLabel?: string;
  payValue?: string | null;
  unlocks?: string[];
  tableRows?: Array<Record<string, string>>;
  options?: string[];
  purpose?: string;
  messageUser?: string;
  messageInvestor?: string;
  note?: string;
  color?: string;
};

function JourneyTab({
  pricingJourney,
  setPricingJourney,
}: {
  pricingJourney: Record<string, unknown>;
  setPricingJourney: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const steps = (Array.isArray(pricingJourney.steps) ? pricingJourney.steps : []) as StepRecord[];

  const updateSteps = (next: StepRecord[]) => {
    setPricingJourney((p) => ({ ...p, steps: next }));
  };

  const addStep = () => {
    updateSteps([...steps, { stageLabel: 'New Step', stageTitle: 'Title', color: 'green' }]);
  };

  const removeStep = (idx: number) => {
    updateSteps(steps.filter((_, i) => i !== idx));
  };

  const moveStep = (idx: number, dir: 'up' | 'down') => {
    const next = [...steps];
    const j = dir === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    updateSteps(next);
  };

  const updateStep = (idx: number, field: keyof StepRecord, value: unknown) => {
    const next = [...steps];
    next[idx] = { ...next[idx], [field]: value };
    updateSteps(next);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-secondary">Pricing Journey Builder</h2>
      <p className="text-sm text-gray-600">Add, edit, reorder steps. Each step appears as a card in the visual flow.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Journey headline</label>
        <input
          type="text"
          value={(pricingJourney.headline as string) ?? ''}
          onChange={(e) => setPricingJourney((p) => ({ ...p, headline: e.target.value }))}
          placeholder="Your Platform Pricing Journey"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline</label>
        <input
          type="text"
          value={(pricingJourney.subheadline as string) ?? ''}
          onChange={(e) => setPricingJourney((p) => ({ ...p, subheadline: e.target.value }))}
          placeholder="Think of it like a startup growth staircase..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Steps</label>
          <button type="button" onClick={addStep} className="text-sm font-medium text-primary hover:underline">
            ➕ Add Step
          </button>
        </div>
        <div className="space-y-4">
          {steps.map((step, idx) => (
            <div key={idx} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Step {idx + 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="rounded px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50">↕ Up</button>
                  <button type="button" onClick={() => moveStep(idx, 'down')} disabled={idx === steps.length - 1} className="rounded px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50">↕ Down</button>
                  <button type="button" onClick={() => removeStep(idx)} className="rounded px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200">🗑 Delete</button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Stage label (e.g. STEP 1 — ENTRY STAGE)</label>
                <input
                  type="text"
                  value={step.stageLabel ?? ''}
                  onChange={(e) => updateStep(idx, 'stageLabel', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Step title</label>
                <input
                  type="text"
                  value={step.stageTitle ?? ''}
                  onChange={(e) => updateStep(idx, 'stageTitle', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Stage type</label>
                <select
                  value={step.color ?? 'green'}
                  onChange={(e) => updateStep(idx, 'color', e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  {STAGE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">What they pay / description (optional)</label>
                <input
                  type="text"
                  value={step.payValue ?? ''}
                  onChange={(e) => updateStep(idx, 'payValue', e.target.value || null)}
                  placeholder="e.g. One-time setup fee"
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Unlocks or options (one per line, optional)</label>
                <textarea
                  value={(Array.isArray(step.unlocks) ? step.unlocks : step.options ?? []).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter(Boolean);
                    const arr = lines.length ? lines : undefined;
                    const next = [...steps];
                    next[idx] = { ...next[idx], unlocks: arr, options: arr };
                    updateSteps(next);
                  }}
                  rows={2}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">Purpose or note (optional)</label>
                <input
                  type="text"
                  value={step.purpose ?? step.note ?? ''}
                  onChange={(e) => { updateStep(idx, 'purpose', e.target.value); updateStep(idx, 'note', e.target.value); }}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevenueTableTab({
  pricingJourney,
  setPricingJourney,
}: {
  pricingJourney: Record<string, unknown>;
  setPricingJourney: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const rows = (Array.isArray(pricingJourney.revenueTable) ? pricingJourney.revenueTable : []) as Array<{ revenueType?: string; whenItHappens?: string }>;

  const updateRows = (next: Array<{ revenueType?: string; whenItHappens?: string }>) => {
    setPricingJourney((p) => ({ ...p, revenueTable: next }));
  };

  const addRow = () => {
    updateRows([...rows, { revenueType: '', whenItHappens: '' }]);
  };

  const removeRow = (idx: number) => {
    updateRows(rows.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: 'revenueType' | 'whenItHappens', value: string) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r));
    updateRows(next);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-secondary">Revenue Table Manager</h2>
      <p className="text-sm text-gray-600">Stage name and when it happens. Shown as &quot;How Your Company Earns&quot;.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Flow label (optional)</label>
        <input
          type="text"
          value={(pricingJourney.revenueFlowLabel as string) ?? ''}
          onChange={(e) => setPricingJourney((p) => ({ ...p, revenueFlowLabel: e.target.value }))}
          placeholder="Entry → Progress → Launch → Scale"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Rows</label>
          <button type="button" onClick={addRow} className="text-sm font-medium text-primary hover:underline">➕ Add row</button>
        </div>
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="text"
                value={row.revenueType ?? ''}
                onChange={(e) => updateRow(idx, 'revenueType', e.target.value)}
                placeholder="Stage / Revenue type"
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <input
                type="text"
                value={row.whenItHappens ?? ''}
                onChange={(e) => updateRow(idx, 'whenItHappens', e.target.value)}
                placeholder="When it happens"
                className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
              <button type="button" onClick={() => removeRow(idx)} className="rounded px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200">Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DiagramTab({
  pricingJourney,
  setPricingJourney,
}: {
  pricingJourney: Record<string, unknown>;
  setPricingJourney: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}) {
  const steps = (Array.isArray(pricingJourney.diagramSteps) ? pricingJourney.diagramSteps : []) as string[];
  const labels = (Array.isArray(pricingJourney.diagramLabels) ? pricingJourney.diagramLabels : []) as string[];

  const updateDiagram = (newSteps: string[], newLabels: string[]) => {
    setPricingJourney((p) => ({ ...p, diagramSteps: newSteps, diagramLabels: newLabels }));
  };

  const addBlock = () => {
    updateDiagram([...steps, 'New step'], [...labels, 'Label']);
  };

  const removeBlock = (idx: number) => {
    updateDiagram(steps.filter((_, i) => i !== idx), labels.filter((_, i) => i !== idx));
  };

  const moveBlock = (idx: number, dir: 'up' | 'down') => {
    const j = dir === 'up' ? idx - 1 : idx + 1;
    if (j < 0 || j >= steps.length) return;
    const s = [...steps];
    const l = [...labels];
    [s[idx], s[j]] = [s[j], s[idx]];
    [l[idx], l[j]] = [l[j], l[idx]];
    updateDiagram(s, l);
  };

  const setBlock = (idx: number, step: string, label: string) => {
    const s = [...steps];
    const l = [...labels];
    while (l.length < s.length) l.push('');
    s[idx] = step;
    l[idx] = label;
    updateDiagram(s, l);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-secondary">Diagram Flow Builder</h2>
      <p className="text-sm text-gray-600">Flow blocks shown as: Idea → Structuring → Build → Launch → Maintenance. Rename blocks below.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Diagram headline (optional)</label>
        <input
          type="text"
          value={(pricingJourney.diagramHeadline as string) ?? ''}
          onChange={(e) => setPricingJourney((p) => ({ ...p, diagramHeadline: e.target.value }))}
          placeholder="Simple view:"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Flow blocks</label>
          <button type="button" onClick={addBlock} className="text-sm font-medium text-primary hover:underline">➕ Add block</button>
        </div>
        <div className="space-y-2">
          {steps.length === 0 ? (
            <p className="text-sm text-gray-500">No blocks yet. Click &quot;➕ Add block&quot; to add flow steps.</p>
          ) : (
            steps.map((step, idx) => (
              <div key={idx} className="flex gap-2 items-center flex-wrap">
                <input
                  type="text"
                  value={step}
                  onChange={(e) => setBlock(idx, e.target.value, labels[idx] ?? '')}
                  placeholder="Block label"
                  className="flex-1 min-w-[140px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <input
                  type="text"
                  value={labels[idx] ?? ''}
                  onChange={(e) => setBlock(idx, step, e.target.value)}
                  placeholder="Sublabel (e.g. One-Time Fee)"
                  className="flex-1 min-w-[120px] rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveBlock(idx, 'up')} disabled={idx === 0} className="rounded px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50">↕</button>
                  <button type="button" onClick={() => moveBlock(idx, 'down')} disabled={idx === steps.length - 1} className="rounded px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 disabled:opacity-50">↕</button>
                  <button type="button" onClick={() => removeBlock(idx)} className="rounded px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200">Remove</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function RevenueSystemPage() {
  const token = getStoredToken();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [visibility, setVisibility] = useState<VisibilityState>(defaultVisibility);
  const [revenueModel, setRevenueModel] = useState<Record<string, unknown>>({});
  const [pricingJourney, setPricingJourney] = useState<Record<string, unknown>>({});
  const [versionHistory, setVersionHistory] = useState<Array<{ id: string; versionType: string; editedAt: string; editedBy: string }>>([]);
  const [activeTab, setActiveTab] = useState<'visibility' | 'landing' | 'investor' | 'journey' | 'table' | 'diagram' | 'history'>('visibility');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.cms.revenueSystem.get(token);
      const draft = data.draft as { visibility?: VisibilityState; revenueModel?: Record<string, unknown>; pricingJourney?: Record<string, unknown> } | null;
      const live = data.live;
      if (draft?.visibility) setVisibility({ ...defaultVisibility(), ...draft.visibility });
      else if ((live.revenueModel as Record<string, unknown>)?.visibility) setVisibility({ ...defaultVisibility(), ...(live.revenueModel as Record<string, unknown>).visibility as VisibilityState });
      if (draft?.revenueModel) setRevenueModel(draft.revenueModel as Record<string, unknown>);
      else if (live.revenueModel) setRevenueModel(live.revenueModel as Record<string, unknown>);
      if (draft?.pricingJourney) setPricingJourney(draft.pricingJourney as Record<string, unknown>);
      else if (live.pricingJourney) setPricingJourney(live.pricingJourney as Record<string, unknown>);
      setVersionHistory(data.versionHistory ?? []);
    } catch (e) {
      setError((e as Error).message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveDraft() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        visibility,
        revenueModel: { ...revenueModel, visibility },
        pricingJourney,
      };
      await api.cms.revenueSystem.saveDraft(payload, token);
      clearCMSCache();
      setMessage('Draft saved.');
      load();
    } catch (e) {
      setError((e as Error).message ?? 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!token) return;
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await api.cms.revenueSystem.saveDraft({ visibility, revenueModel: { ...revenueModel, visibility }, pricingJourney }, token);
      await api.cms.revenueSystem.publish(token);
      clearCMSCache();
      setMessage('Published to live.');
      load();
    } catch (e) {
      setError((e as Error).message ?? 'Failed to publish');
    } finally {
      setPublishing(false);
    }
  }

  async function handleRestore(versionId: string) {
    if (!token) return;
    try {
      await api.cms.revenueSystem.restore(versionId, token);
      setMessage('Draft restored from version.');
      load();
    } catch (e) {
      setError((e as Error).message ?? 'Failed to restore');
    }
  }

  if (!token) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Please log in to access Revenue System.</p>
        <Link href="/login" className="mt-4 inline-block text-primary hover:underline">Log in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-600">Loading Revenue System...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'visibility' as const, label: 'Revenue Visibility' },
    { id: 'landing' as const, label: 'Landing Version' },
    { id: 'investor' as const, label: 'Investor Version' },
    { id: 'journey' as const, label: 'Pricing Journey' },
    { id: 'table' as const, label: 'Revenue Table' },
    { id: 'diagram' as const, label: 'Diagram Flow' },
    { id: 'history' as const, label: 'Version History' },
  ];

  const landing = (revenueModel.landing as Record<string, unknown>) ?? {};
  const investor = (revenueModel.investor as Record<string, unknown>) ?? {};

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Revenue System</h1>
          <p className="text-gray-600 text-sm mt-1">
            Control how your revenue model and pricing journey appear across the app. Only Super Admin and Cofounder can edit.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {saving ? 'Saving…' : '💾 Save Draft'}
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {publishing ? 'Publishing…' : '🚀 Publish Live'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-secondary">Revenue Model Display</h2>
              <p className="text-sm text-gray-600">Choose where the Revenue Model section appears.</p>
              <div className="space-y-3">
                {VISIBILITY_KEYS.map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibility[key] ?? true}
                      onChange={(e) => setVisibility((v) => ({ ...v, [key]: e.target.checked }))}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'landing' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-secondary">Entrepreneur (Landing) Version</h2>
              <p className="text-sm text-gray-600">What founders see on homepage, pricing, onboarding.</p>
              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                  <input
                    type="text"
                    value={(landing.title as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, landing: { ...(r.landing as Record<string, unknown>), title: e.target.value } }))}
                    placeholder="e.g. Built for Founders — Not Subscriptions"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subheadline / Intro</label>
                  <textarea
                    value={(landing.intro as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, landing: { ...(r.landing as Record<string, unknown>), intro: e.target.value } }))}
                    placeholder="Short intro for conversion..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary title (e.g. Why Founders Love This)</label>
                  <input
                    type="text"
                    value={(landing.summaryTitle as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, landing: { ...(r.landing as Record<string, unknown>), summaryTitle: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Summary bullets (one per line)</label>
                  <textarea
                    value={Array.isArray(landing.summaryBullets) ? (landing.summaryBullets as string[]).join('\n') : ''}
                    onChange={(e) =>
                      setRevenueModel((r) => ({
                        ...r,
                        landing: { ...(r.landing as Record<string, unknown>), summaryBullets: e.target.value.split('\n').filter(Boolean) },
                      }))
                    }
                    placeholder="No early subscription stress\nPayments tied to real progress"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-500">Sections (title + body) are edited in the raw CMS for now. Use CMS → revenue-model for full JSON.</p>
              </div>
            </div>
          )}

          {activeTab === 'investor' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-secondary">Investor Version</h2>
              <p className="text-sm text-gray-600">What investors see in Deal Room.</p>
              <div className="grid gap-4 sm:grid-cols-1">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={(investor.title as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, investor: { ...(r.investor as Record<string, unknown>), title: e.target.value } }))}
                    placeholder="e.g. Revenue Model Strategy"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intro / Revenue philosophy</label>
                  <textarea
                    value={(investor.intro as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, investor: { ...(r.investor as Record<string, unknown>), intro: e.target.value } }))}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strategic Advantage title</label>
                  <input
                    type="text"
                    value={(investor.strategicAdvantageTitle as string) ?? ''}
                    onChange={(e) => setRevenueModel((r) => ({ ...r, investor: { ...(r.investor as Record<string, unknown>), strategicAdvantageTitle: e.target.value } }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Strategic Advantage bullets (one per line)</label>
                  <textarea
                    value={Array.isArray(investor.strategicAdvantage) ? (investor.strategicAdvantage as string[]).join('\n') : ''}
                    onChange={(e) =>
                      setRevenueModel((r) => ({
                        ...r,
                        investor: { ...(r.investor as Record<string, unknown>), strategicAdvantage: e.target.value.split('\n').filter(Boolean) },
                      }))
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'journey' && (
            <JourneyTab pricingJourney={pricingJourney} setPricingJourney={setPricingJourney} />
          )}

          {activeTab === 'table' && (
            <RevenueTableTab pricingJourney={pricingJourney} setPricingJourney={setPricingJourney} />
          )}

          {activeTab === 'diagram' && (
            <DiagramTab pricingJourney={pricingJourney} setPricingJourney={setPricingJourney} />
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-secondary">Version History</h2>
              <p className="text-sm text-gray-600">Restore a previous draft or published version as your current draft.</p>
              {versionHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No version history yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 font-medium text-gray-600">Date</th>
                        <th className="text-left py-2 font-medium text-gray-600">Edited by</th>
                        <th className="text-left py-2 font-medium text-gray-600">Type</th>
                        <th className="text-left py-2 font-medium text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {versionHistory.map((v) => (
                        <tr key={v.id} className="border-b border-gray-100">
                          <td className="py-2 text-gray-700">{new Date(v.editedAt).toLocaleString()}</td>
                          <td className="py-2 text-gray-700">{v.editedBy}</td>
                          <td className="py-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${v.versionType === 'published' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                              {v.versionType}
                            </span>
                          </td>
                          <td className="py-2">
                            <button
                              type="button"
                              onClick={() => handleRestore(v.id)}
                              className="text-primary hover:underline text-sm"
                            >
                              Restore as draft
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <span className="font-medium text-secondary">Preview:</span>
        <a href="/#how-pricing-works" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
          👁 Homepage (Landing)
        </a>
        <a href="/pricing#how-pricing-works" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
          👁 Pricing page
        </a>
        <a href="/dashboard/investor/deal-room" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
          👁 Deal Room (Investor)
        </a>
      </div>
    </div>
  );
}
