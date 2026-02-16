'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';
import type { Project } from '@/lib/api';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-secondary mb-6">Project</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-secondary mb-2">Project</h1>
        <p className="text-gray-600 mb-6">You don’t have a project yet. Submit an idea to create your startup workspace.</p>
        <Link
          href="/submit-idea"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
        >
          Submit idea
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Project</h1>
      <p className="text-gray-600 mb-6">Each idea becomes a dedicated mini-company workspace. Open a workspace to develop your idea, collaborate with your team, and track progress.</p>
      <div className="space-y-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/dashboard/project/${project.id}`}
            className="block rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold text-secondary text-lg">{project.projectName}</h2>
                <p className="text-sm text-gray-500 mt-1">{project.description || 'No description'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary capitalize">
                    {project.stage}
                  </span>
                  <span className="text-sm text-gray-500">{project.progressPercent}% progress</span>
                </div>
              </div>
              <span className="text-primary font-medium text-sm">Open workspace →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
