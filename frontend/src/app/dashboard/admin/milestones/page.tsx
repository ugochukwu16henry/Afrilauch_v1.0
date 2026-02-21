'use client';

import Link from 'next/link';

export default function AdminMilestonesPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Milestones</h1>
      <p className="text-gray-600 mb-6">View and manage milestones by project.</p>
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center text-gray-500">
        <p className="mb-2">Milestones are managed per project.</p>
        <p className="mb-4 text-sm">Open a project and use the Roadmap &amp; Milestones section to assign milestones and set payment amount.</p>
        <Link href="/dashboard/admin/projects" className="text-primary font-medium hover:underline">
          Go to Projects →
        </Link>
      </div>
    </div>
  );
}
