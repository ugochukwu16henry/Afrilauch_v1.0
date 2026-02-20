'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, getStoredToken, type Project } from '@/lib/api';

type DraftForm = {
  title: string;
  description: string;
  problemStatement: string;
  targetMarket: string;
};

const EMPTY_FORM: DraftForm = {
  title: '',
  description: '',
  problemStatement: '',
  targetMarket: '',
};

function mapProjectToForm(project: Project): DraftForm {
  return {
    title: project.projectName || '',
    description: project.description || '',
    problemStatement: project.problemStatement || '',
    targetMarket: project.targetMarket || '',
  };
}

export default function ClientSubmitProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(searchParams.get('projectId'));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalSubmitting, setFinalSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState<DraftForm>(EMPTY_FORM);
  const autoSaveTimer = useRef<number | null>(null);

  const currentDraft = useMemo(() => projects.find((project) => project.id === currentProjectId) || null, [projects, currentProjectId]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api.projects
      .list(token)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);
        const fromQuery = searchParams.get('projectId');
        const initial = fromQuery ? list.find((project) => project.id === fromQuery) : undefined;
        if (initial) {
          setCurrentProjectId(initial.id);
          setForm(mapProjectToForm(initial));
        }
      })
      .catch(() => setError('Unable to load projects.'))
      .finally(() => setLoading(false));
  }, [searchParams]);

  useEffect(() => {
    if (!currentDraft) return;
    setForm(mapProjectToForm(currentDraft));
  }, [currentDraft?.id]);

  useEffect(() => {
    if (!currentProjectId || !currentDraft) return;
    if ((currentDraft.submissionStatus ?? 'draft') !== 'draft') return;
    if (form.title.trim() === (currentDraft.projectName || '') &&
      form.description.trim() === (currentDraft.description || '') &&
      form.problemStatement.trim() === (currentDraft.problemStatement || '') &&
      form.targetMarket.trim() === (currentDraft.targetMarket || '')) {
      return;
    }

    if (autoSaveTimer.current) {
      window.clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = window.setTimeout(async () => {
      const token = getStoredToken();
      if (!token) return;
      try {
        const updated = await api.projects.updateDraft(
          currentProjectId,
          {
            title: form.title.trim() || undefined,
            description: form.description.trim() || undefined,
            problemStatement: form.problemStatement.trim() || undefined,
            targetMarket: form.targetMarket.trim() || undefined,
          },
          token
        );
        setProjects((prev) => prev.map((project) => (project.id === updated.id ? { ...project, ...updated } : project)));
      } catch {
      }
    }, 1200);

    return () => {
      if (autoSaveTimer.current) {
        window.clearTimeout(autoSaveTimer.current);
      }
    };
  }, [form, currentProjectId, currentDraft]);

  async function handleSaveDraft() {
    const token = getStoredToken();
    if (!token) return;
    if (!form.title.trim()) {
      setError('Project title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (currentProjectId) {
        const updated = await api.projects.updateDraft(
          currentProjectId,
          {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            problemStatement: form.problemStatement.trim() || undefined,
            targetMarket: form.targetMarket.trim() || undefined,
          },
          token
        );
        setProjects((prev) => prev.map((project) => (project.id === updated.id ? { ...project, ...updated } : project)));
      } else {
        const created = await api.projects.createDraft(
          {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            problemStatement: form.problemStatement.trim() || undefined,
            targetMarket: form.targetMarket.trim() || undefined,
          },
          token
        );
        setProjects((prev) => [created, ...prev]);
        setCurrentProjectId(created.id);
        router.replace(`/dashboard/client/submit?projectId=${created.id}`);
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
    setError(null);
    setSuccess(null);

    if (!form.title.trim() || !form.description.trim()) {
      setError('Title and description are required before final submit.');
      return;
    }

    setFinalSubmitting(true);
    try {
      let projectId = currentProjectId;
      if (!projectId) {
        const created = await api.projects.createDraft(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            problemStatement: form.problemStatement.trim() || undefined,
            targetMarket: form.targetMarket.trim() || undefined,
          },
          token
        );
        projectId = created.id;
        setProjects((prev) => [created, ...prev]);
        setCurrentProjectId(created.id);
      } else {
        await api.projects.updateDraft(
          projectId,
          {
            title: form.title.trim(),
            description: form.description.trim(),
            problemStatement: form.problemStatement.trim() || undefined,
            targetMarket: form.targetMarket.trim() || undefined,
          },
          token
        );
      }

      const submitted = await api.projects.finalSubmit(projectId, token);
      setProjects((prev) => prev.map((project) => (project.id === submitted.id ? { ...project, ...submitted } : project)));
      setSuccess(submitted.message || 'Project submitted successfully.');
      router.replace('/dashboard/client');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project.');
    } finally {
      setFinalSubmitting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Submit New Project / Idea</h1>
          <p className="text-gray-600">Create a draft in your dashboard, then click Final Submit when ready.</p>
        </div>
        <Link href="/dashboard/client" className="text-sm font-medium text-primary hover:underline">
          Back to My Projects
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <div className="space-y-5">
          {error && <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
          {success && <div className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div>}

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-secondary">Project Basics</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Project Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Fintech platform for African SMEs"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Idea Description *</label>
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Describe your idea, who it serves, and why now."
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-secondary">Validation Details</h2>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Problem Statement</label>
                <textarea
                  rows={3}
                  value={form.problemStatement}
                  onChange={(e) => setForm((prev) => ({ ...prev, problemStatement: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="What core pain point are you solving?"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Target Market</label>
                <textarea
                  rows={3}
                  value={form.targetMarket}
                  onChange={(e) => setForm((prev) => ({ ...prev, targetMarket: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Who are your ideal users/customers?"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-lg font-semibold text-secondary">Submission</h2>
            <p className="mb-4 text-sm text-gray-600">
              Drafts are private to you. Final Submit makes the project visible to Super Admin for review.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={finalSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {finalSubmitting ? 'Submitting...' : 'Final Submit'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
