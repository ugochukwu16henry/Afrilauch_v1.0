'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, getStoredToken, type Project, type StartupProfile } from '@/lib/api';

export default function AdminProjectDetailsPage() {
  const params = useParams<{ id: string }>();
  const projectId = useMemo(() => (typeof params?.id === 'string' ? params.id : ''), [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [project, setProject] = useState<Project | null>(null);
  const [startupProfile, setStartupProfile] = useState<StartupProfile | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token || !projectId) {
      setLoading(false);
      setError('Missing authentication or project id.');
      return;
    }

    Promise.all([
      api.projects.get(projectId, token),
      api.startups.list(token).catch(() => [] as StartupProfile[]),
    ])
      .then(([projectData, startups]) => {
        setProject(projectData);
        const match = (startups || []).find((s) => s.projectId === projectId) || null;
        setStartupProfile(match);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load project details.');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return <div className="max-w-5xl text-gray-500">Loading project details...</div>;
  }

  if (error || !project) {
    return (
      <div className="max-w-5xl">
        <div className="mb-4">
          <Link href="/dashboard/admin/projects" className="text-sm text-primary font-medium hover:underline">
            ← Back to projects
          </Link>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error || 'Project not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/dashboard/admin/projects" className="text-sm text-primary font-medium hover:underline">
          ← Back to projects
        </Link>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-bold text-secondary mb-2">{project.projectName}</h1>
        <p className="text-sm text-gray-600">Full project details for Super Admin follow-up and marketplace review.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Project Details</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <DetailRow label="Client" value={project.client?.user?.name || '—'} />
          <DetailRow label="Client Email" value={project.client?.user?.email || '—'} />
          <DetailRow label="Stage" value={project.stage || '—'} />
          <DetailRow label="Status" value={project.status || '—'} />
          <DetailRow label="Submission Status" value={project.submissionStatus || '—'} />
          <DetailRow label="Progress" value={`${project.progressPercent ?? 0}%`} />
          <DetailRow label="Budget" value={project.budget != null ? String(project.budget) : '—'} />
          <DetailRow label="Start Date" value={project.startDate || '—'} />
          <DetailRow label="Deadline" value={project.deadline || '—'} />
        </div>

        <div className="mt-4 space-y-3 text-sm">
          <TextBlock title="Description" text={project.description} />
          <TextBlock title="Problem Statement" text={project.problemStatement || null} />
          <TextBlock title="Target Market" text={project.targetMarket || null} />
          <TextBlock title="Repository URL" text={project.repoUrl || null} isLink />
          <TextBlock title="Live URL" text={project.liveUrl || null} isLink />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Marketplace Profile</h2>
        {!startupProfile ? (
          <p className="text-sm text-gray-500">No startup marketplace profile linked to this project yet.</p>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <DetailRow label="Marketplace Visibility" value={startupProfile.visibilityStatus} />
              <DetailRow label="Startup Stage" value={startupProfile.stage} />
              <DetailRow label="Funding Needed" value={String(startupProfile.fundingNeeded)} />
              <DetailRow label="Equity Offer" value={startupProfile.equityOffer != null ? `${startupProfile.equityOffer}%` : '—'} />
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <TextBlock title="Pitch Summary" text={startupProfile.pitchSummary} />
              <TextBlock title="Traction Metrics" text={startupProfile.tractionMetrics} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-800 break-all">{value || '—'}</p>
    </div>
  );
}

function TextBlock({
  title,
  text,
  isLink,
}: {
  title: string;
  text: string | null | undefined;
  isLink?: boolean;
}) {
  const value = text?.trim();
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{title}</p>
      {!value ? (
        <p className="text-gray-500">—</p>
      ) : isLink ? (
        <a href={value} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
          {value}
        </a>
      ) : (
        <p className="text-gray-800 whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}
