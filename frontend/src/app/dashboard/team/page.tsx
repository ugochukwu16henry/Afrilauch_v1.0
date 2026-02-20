'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type User } from '@/lib/api';

const ROLE_INFO: Record<string, { department: string; reportingLine: string; responsibilities: string[] }> = {
  super_admin: { department: 'Leadership', reportingLine: 'Founder', responsibilities: ['Full platform oversight', 'Team & roles', 'Audit & reports'] },
  cofounder: { department: 'Leadership', reportingLine: 'Super Admin', responsibilities: ['Startup performance', 'Team productivity', 'Pending approvals'] },
  project_manager: { department: 'Operations', reportingLine: 'Founder', responsibilities: ['Project delivery', 'Client & team coordination', 'Milestones & tasks'] },
  finance_admin: { department: 'Finance', reportingLine: 'Founder', responsibilities: ['Payments & revenue', 'Reports', 'Agreements'] },
  developer: { department: 'Product & Technology', reportingLine: 'Technical Lead', responsibilities: ['Development', 'Code quality', 'Delivery'] },
  designer: { department: 'Product & Technology', reportingLine: 'Technical Lead', responsibilities: ['UI/UX', 'Brand consistency', 'Design systems'] },
  marketer: { department: 'Marketing', reportingLine: 'Marketing Lead', responsibilities: ['Growth', 'Campaigns', 'Content'] },
  hr_manager: { department: 'Support', reportingLine: 'Super Admin', responsibilities: ['Talent operations', 'Hiring workflow', 'Compliance support'] },
  legal_team: { department: 'Support', reportingLine: 'Super Admin', responsibilities: ['Agreement governance', 'Legal review', 'Audit trail'] },
};

export default function TeamDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Array<{ id: string; projectName: string }>>([]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
    api.projects.list(token).then(setProjects).catch(() => []);
  }, []);

  const roleTitle = user?.customRole?.name ?? (user?.role ? user.role.replace(/_/g, ' ') : '');
  const roleInfo = user?.role ? ROLE_INFO[user.role] : null;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Team Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Your role, assigned work, messages, and resources.
      </p>

      {/* Your Role & Responsibilities */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">Your Role & Responsibilities</h2>
        <div className="space-y-2 text-gray-700">
          <p><strong>Role:</strong> {roleTitle}</p>
          {roleInfo && (
            <>
              <p><strong>Department:</strong> {roleInfo.department}</p>
              <p><strong>Reporting line:</strong> {roleInfo.reportingLine}</p>
              <ul className="list-disc pl-6 mt-2">
                {roleInfo.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
          {!roleInfo && user?.customRole && (
            <>
              {user.customRole.department && <p><strong>Department:</strong> {user.customRole.department}</p>}
              {user.customRole.level && <p><strong>Level:</strong> {user.customRole.level}</p>}
            </>
          )}
        </div>
      </section>

      {/* My Assigned Startups/Projects */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">My Assigned Startups / Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects assigned yet.</p>
        ) : (
          <ul className="space-y-2">
            {projects.slice(0, 10).map((p) => (
              <li key={p.id}>
                <Link href={`/dashboard/admin/projects/${p.id}`} className="text-primary font-medium hover:underline">
                  {p.projectName}
                </Link>
              </li>
            ))}
            {projects.length > 10 && <p className="text-sm text-gray-500">+ {projects.length - 10} more</p>}
          </ul>
        )}
        <Link href="/dashboard/admin/projects" className="mt-4 inline-block text-sm text-primary font-medium hover:underline">
          View all projects →
        </Link>
      </section>

      {/* Internal Messages */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">Internal Messages</h2>
        <p className="text-gray-500">Messages and team communication. (Coming soon.)</p>
        <Link href="/dashboard/messages" className="mt-4 inline-block text-sm text-primary font-medium hover:underline">
          Go to Messages →
        </Link>
      </section>

      {/* Documents & Resources */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">Documents & Resources</h2>
        <p className="text-gray-500">Shared docs and resources. (Coming soon.)</p>
        <Link href="/dashboard/files" className="mt-4 inline-block text-sm text-primary font-medium hover:underline">
          Go to Files →
        </Link>
      </section>

      {/* Task Board (future) */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-secondary mb-4">Task Board</h2>
        <p className="text-gray-500">Your tasks and board. (Future ready.)</p>
        <Link href="/dashboard/tasks" className="mt-4 inline-block text-sm text-primary font-medium hover:underline">
          Go to Tasks →
        </Link>
      </section>

      {/* Early Contributor Growth Structure */}
      <section className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6">
        <h2 className="text-lg font-semibold text-secondary mb-4">Early Contributor Growth Structure</h2>
        <div className="space-y-4 text-gray-700">
          <p>This platform grows through builders, not employees.</p>
          <p>Early team members may grow into:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Leadership roles</li>
            <li>Revenue share opportunities</li>
            <li>Equity participation (future stage)</li>
          </ul>
          <p>Contributions are tracked through:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Projects worked on</li>
            <li>Impact</li>
            <li>Leadership involvement</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
