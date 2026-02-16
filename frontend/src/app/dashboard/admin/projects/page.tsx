'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/lib/api';

interface ProjectRow {
  id: string;
  projectName: string;
  stage: string;
  progressPercent: number;
  client?: { user?: { name: string } };
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }
    fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.ok ? res.json() : [])
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-6">All projects</h1>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Project</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Stage</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No projects yet
                  </td>
                </tr>
              ) : (
                projects.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-text-dark">{p.projectName}</td>
                    <td className="px-4 py-3 text-gray-600">{p.client?.user?.name ?? '—'}</td>
                    <td className="px-4 py-3 capitalize text-primary">{p.stage}</td>
                    <td className="px-4 py-3">{p.progressPercent}%</td>
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/project/${p.id}`} className="text-primary font-medium hover:underline">
                        Workspace
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
