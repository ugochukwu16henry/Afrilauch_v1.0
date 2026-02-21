'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getStoredToken, type IdeaSubmissionBody, type Project } from '@/lib/api';

const STEPS = [
  { id: 1, title: 'Basic info' },
  { id: 2, title: 'Idea details' },
  { id: 3, title: 'Stage' },
  { id: 4, title: 'Goals' },
  { id: 5, title: 'Budget' },
  { id: 6, title: 'Submit' },
];

const STAGE_OPTIONS = [
  { value: 'just_idea', label: 'Just idea' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'existing_business', label: 'Existing business' },
];

const GOAL_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'App' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'funding', label: 'Funding' },
];

const BUDGET_OPTIONS = [
  { value: 'Under $1,000', label: 'Under $1,000' },
  { value: '$1,000 - $5,000', label: '$1,000 - $5,000' },
  { value: '$5,000 - $15,000', label: '$5,000 - $15,000' },
  { value: '$15,000 - $50,000', label: '$15,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
  { value: 'Not sure yet', label: 'Not sure yet' },
];

const defaultForm: IdeaSubmissionBody = {
  name: '',
  email: '',
  password: '',
  country: '',
  ideaDescription: '',
  problemItSolves: '',
  targetUsers: '',
  industry: '',
  stage: 'just_idea',
  goals: [],
  budgetRange: '',
};

function mapProjectToForm(project: Project): IdeaSubmissionBody {
  return {
    ...defaultForm,
    ideaDescription: project.description || '',
    problemItSolves: project.problemStatement || '',
    targetUsers: project.targetMarket || '',
  };
}

export default function ClientSubmitProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(searchParams.get('projectId'));
  const [form, setForm] = useState<IdeaSubmissionBody>(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([api.projects.list(token), api.auth.me(token)])
      .then(([projectList, me]) => {
        if (me?.role === 'super_admin') {
          router.replace('/dashboard/admin/projects');
          return;
        }
        const list = Array.isArray(projectList) ? projectList : [];
        setProjects(list);
        setForm((prev) => ({
          ...prev,
          name: me?.name || prev.name,
          email: me?.email || prev.email,
        }));

        const fromQuery = searchParams.get('projectId');
        const selected = fromQuery ? list.find((item) => item.id === fromQuery) : undefined;
        if (selected) {
          setCurrentProjectId(selected.id);
          setForm((prev) => ({ ...prev, ...mapProjectToForm(selected), name: prev.name, email: prev.email }));
        }
      })
      .catch(() => setError('Unable to load your submit flow.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  function update<K extends keyof IdeaSubmissionBody>(key: K, value: IdeaSubmissionBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  }

  function toggleGoal(value: string) {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((g) => g !== value) : [...prev.goals, value],
    }));
    setError(null);
    setSuccess(null);
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.name.trim() && !!form.email.trim();
    if (step === 2) return !!form.ideaDescription.trim();
    if (step === 3) return !!form.stage;
    if (step === 4) return form.goals.length > 0;
    if (step === 5) return !!form.budgetRange;
    return true;
  }

  function buildDraftPayload() {
    const combinedDescription = [
      form.ideaDescription.trim(),
      form.problemItSolves.trim() && `Problem: ${form.problemItSolves.trim()}`,
      form.targetUsers.trim() && `Target users: ${form.targetUsers.trim()}`,
      form.industry.trim() && `Industry: ${form.industry.trim()}`,
      form.goals.length > 0 && `Goals: ${form.goals.join(', ')}`,
      form.budgetRange.trim() && `Budget: ${form.budgetRange.trim()}`,
      form.stage && `Stage: ${form.stage}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      title: (form.ideaDescription.trim().slice(0, 100) || 'My Startup').trim(),
      description: combinedDescription,
      problemStatement: form.problemItSolves.trim() || undefined,
      targetMarket: form.targetUsers.trim() || undefined,
    };
  }

  async function saveDraftOnly() {
    const token = getStoredToken();
    if (!token) return;
    const draftPayload = buildDraftPayload();
    if (!draftPayload.description.trim()) {
      setError('Please complete your idea details before saving.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      let draftProjectId = currentProjectId;
      if (!draftProjectId) {
        const created = await api.projects.createDraft(draftPayload, token);
        setProjects((prev) => [created, ...prev]);
        draftProjectId = created.id;
        setCurrentProjectId(created.id);
        router.replace(`/dashboard/client/submit?projectId=${created.id}`);
      } else {
        const updated = await api.projects.updateDraft(draftProjectId, draftPayload, token);
        setProjects((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)));
      }
      setSuccess('Draft saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  }

  async function handleFinalSubmit() {
    const token = getStoredToken();
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const draftPayload = buildDraftPayload();
      if (!draftPayload.description.trim()) {
        setError('Please complete your idea details before final submit.');
        return;
      }

      let draftProjectId = currentProjectId;
      if (!draftProjectId) {
        const created = await api.projects.createDraft(draftPayload, token);
        setProjects((prev) => [created, ...prev]);
        draftProjectId = created.id;
        setCurrentProjectId(created.id);
      } else {
        await api.projects.updateDraft(draftProjectId, draftPayload, token);
      }

      const submittedProject = await api.projects.finalSubmit(draftProjectId, token);
      setProjects((prev) => prev.map((item) => (item.id === submittedProject.id ? { ...item, ...submittedProject } : item)));
      setSuccess(submittedProject.message || 'Project submitted successfully.');
      router.replace('/dashboard/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">Submit your idea</h1>
          <p className="mt-2 text-gray-600">We&apos;ll evaluate it and prepare your startup proposal.</p>
        </div>
        <Link href="/dashboard/client" className="text-sm font-medium text-primary hover:underline">
          Back
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {STEPS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStep(item.id)}
                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  step === item.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {item.id}. {item.title}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            {error && <div className="mb-6 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
            {success && <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div>}

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-dark">Basic info</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => update('country', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. Nigeria, Kenya"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 6 characters)</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-dark">Idea details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idea description *</label>
                  <textarea
                    value={form.ideaDescription}
                    onChange={(e) => update('ideaDescription', e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Describe your startup idea in a few sentences..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Problem it solves</label>
                  <textarea
                    value={form.problemItSolves}
                    onChange={(e) => update('problemItSolves', e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="What problem does your idea address?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target users</label>
                  <input
                    type="text"
                    value={form.targetUsers}
                    onChange={(e) => update('targetUsers', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Who will use this? (e.g. small businesses, students)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => update('industry', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. Fintech, EdTech, Health"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-dark">Stage</h2>
                <p className="text-sm text-gray-600">Where are you with this idea?</p>
                <div className="space-y-2">
                  {STAGE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                        form.stage === option.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="stage"
                        value={option.value}
                        checked={form.stage === option.value}
                        onChange={() => update('stage', option.value as IdeaSubmissionBody['stage'])}
                        className="text-primary"
                      />
                      <span className="font-medium text-text-dark">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-dark">Goals</h2>
                <p className="text-sm text-gray-600">What do you want to achieve? (Select all that apply)</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {GOAL_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                        form.goals.includes(option.value) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={form.goals.includes(option.value)}
                        onChange={() => toggleGoal(option.value)}
                        className="rounded text-primary"
                      />
                      <span className="font-medium text-text-dark">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-text-dark">Budget</h2>
                <p className="text-sm text-gray-600">Rough budget for this project (helps us tailor the proposal)</p>
                <div className="space-y-2">
                  {BUDGET_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                        form.budgetRange === option.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="budget"
                        value={option.value}
                        checked={form.budgetRange === option.value}
                        onChange={() => update('budgetRange', option.value)}
                        className="text-primary"
                      />
                      <span className="font-medium text-text-dark">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-text-dark">Submit</h2>
                <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                  <p><strong>Name:</strong> {form.name || '—'}</p>
                  <p><strong>Email:</strong> {form.email || '—'}</p>
                  <p><strong>Country:</strong> {form.country || '—'}</p>
                  <p><strong>Idea:</strong> {form.ideaDescription ? form.ideaDescription.slice(0, 120) + (form.ideaDescription.length > 120 ? '...' : '') : '—'}</p>
                  <p><strong>Stage:</strong> {STAGE_OPTIONS.find((item) => item.value === form.stage)?.label ?? '—'}</p>
                  <p><strong>Goals:</strong> {form.goals.length ? form.goals.map((goal) => GOAL_OPTIONS.find((item) => item.value === goal)?.label ?? goal).join(', ') : '—'}</p>
                  <p><strong>Budget:</strong> {form.budgetRange || '—'}</p>
                </div>
                <p className="text-sm text-gray-600">Save as draft first, then click Final Submit when you are ready for admin review.</p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep((value) => Math.max(1, value - 1))}
                disabled={step === 1}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>

              {step < 6 ? (
                <button
                  type="button"
                  onClick={() => setStep((value) => value + 1)}
                  disabled={!canProceed()}
                  className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveDraftOnly}
                    disabled={saving}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Draft'}
                  </button>
                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Final Submit'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
