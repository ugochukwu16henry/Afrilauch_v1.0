'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, getStoredToken, type Project, type ProjectSubmissionStatus } from '@/lib/api';

const STATUS_ORDER: ProjectSubmissionStatus[] = ['draft', 'submitted', 'in_review', 'approved', 'rejected'];

const STATUS_STYLES: Record<ProjectSubmissionStatus, string> = {
  draft: 'bg-amber-100 text-amber-800',
  submitted: 'bg-blue-100 text-blue-800',
  in_review: 'bg-indigo-100 text-indigo-800',
  approved: 'bg-emerald-100 text-emerald-800',
  rejected: 'bg-rose-100 text-rose-800',
};

function prettyStatus(status: ProjectSubmissionStatus): string {
  if (status === 'in_review') return 'In Review';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getSubmissionStatus(project: Project): ProjectSubmissionStatus {
  return project.submissionStatus ?? 'draft';
}

export default function ClientProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function loadProjects() {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await api.projects.list(token);
      setProjects(Array.isArray(data) ? data : []);
      setError(null);
    } catch {
      setError('Unable to load your projects right now.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<ProjectSubmissionStatus, Project[]> = {
      draft: [],
      submitted: [],
      in_review: [],
      approved: [],
      rejected: [],
    };
    for (const project of projects) {
      map[getSubmissionStatus(project)].push(project);
    }
    return map;
  }, [projects]);

  async function handleFinalSubmit(projectId: string) {
    const token = getStoredToken();
    if (!token) return;
    setSubmittingId(projectId);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.projects.finalSubmit(projectId, token);
      setProjects((prev) => prev.map((project) => (project.id === projectId ? { ...project, ...updated } : project)));
      setSuccess(updated.message || 'Project submitted successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit project.');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary">My Projects</h1>
          <p className="text-gray-600">Manage draft ideas and submit only when you are ready.</p>
        </div>
        <Link
          href="/dashboard/client/submit"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Submit New Project / Idea
        </Link>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{success}</div>}

      {loading ? (
        <p className="text-gray-500">Loading projects...</p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">You have not created any projects yet.</p>
          <Link
            href="/dashboard/client/submit"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            Submit New Project / Idea
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            return (
              <section key={status} className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-600">
                  {prettyStatus(status)} Ideas ({items.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {items.map((project) => (
                    <article key={project.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-secondary">{project.projectName}</h3>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[getSubmissionStatus(project)]}`}>
                          {prettyStatus(getSubmissionStatus(project))}
                        </span>
                      </div>
                      <p className="mb-4 text-sm text-gray-600 line-clamp-3">{project.description || 'No description yet.'}</p>
                      <div className="flex flex-wrap gap-2">
                        {getSubmissionStatus(project) === 'draft' && (
                          <Link
                            href={`/dashboard/client/submit?projectId=${project.id}`}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Edit
                          </Link>
                        )}
                        <Link
                          href={`/dashboard/project/${project.id}`}
                          className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5"
                        >
                          View
                        </Link>
                        {getSubmissionStatus(project) === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handleFinalSubmit(project.id)}
                            disabled={submittingId === project.id}
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-60"
                          >
                            {submittingId === project.id ? 'Submitting...' : 'Final Submit'}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
