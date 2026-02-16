'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type User } from '@/lib/api';
import type { SuperAdminOverview } from '@/lib/api';

interface ProjectSummary {
  id: string;
  projectName: string;
  stage: string;
  progressPercent: number;
  client?: { user?: { name: string } };
}

export default function SuperAdminDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    if (user?.role === 'super_admin') {
      api.superAdmin
        .overview(token)
        .then(setOverview)
        .catch(() => setOverview(null));
    }
    api.projects
      .list(token)
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">
        {isSuperAdmin ? 'Super Admin' : 'Admin'} Dashboard
      </h1>
      <p className="text-gray-600 mb-8">
        {isSuperAdmin
          ? 'Full platform visibility, metrics, and activity.'
          : 'Overview of projects and platform activity.'}
      </p>

      {isSuperAdmin && overview && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
            <MetricCard label="Total Users" value={overview.totalUsers} />
            <MetricCard label="Total Clients" value={overview.totalClients} />
            <MetricCard label="Total Investors" value={overview.totalInvestors} />
            <MetricCard label="Ideas Submitted" value={overview.ideasSubmitted} />
            <MetricCard label="Active Projects" value={overview.activeProjects} />
            <MetricCard label="Agreements Signed" value={overview.agreementsSigned} />
            <MetricCard label="Total Revenue (USD)" value={`$${overview.totalRevenueUsd.toFixed(2)}`} />
            <MetricCard label="Revenue (Month)" value={`$${overview.revenueMonthlyUsd.toFixed(2)}`} />
            <MetricCard label="Revenue (Year)" value={`$${overview.revenueYearlyUsd.toFixed(2)}`} />
            <MetricCard label="Setup Fees (USD)" value={`$${overview.setupFeesCollectedUsd.toFixed(2)}`} />
            <MetricCard label="Consultation (USD)" value={`$${overview.consultationPaymentsUsd.toFixed(2)}`} />
            <MetricCard label="Investor Fees (USD)" value={`$${overview.investorFeesUsd.toFixed(2)}`} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Pending manual payments" value={overview.pendingManualPayments} />
            <MetricCard label="Talents awaiting approval" value={overview.pendingTalents} />
            <MetricCard label="Startups pending review" value={overview.pendingStartups} />
            <MetricCard label="Early Founder users" value={overview.earlyFounderCount} />
          </div>
        </>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-secondary">All projects</h2>
          <Link
            href="/dashboard/admin/projects"
            className="text-sm text-primary font-medium hover:underline"
          >
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
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
                      <td className="px-4 py-3">
                        <span className="capitalize text-primary">{p.stage}</span>
                      </td>
                      <td className="px-4 py-3">{p.progressPercent}%</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/admin/projects/${p.id}`}
                          className="text-primary font-medium hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/dashboard/admin/leads"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Leads</h3>
          <p className="text-sm text-gray-500">Track and manage incoming leads</p>
        </Link>
        <Link
          href="/dashboard/admin/agreements"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Agreements</h3>
          <p className="text-sm text-gray-500">Manage and track signed agreements</p>
        </Link>
        <Link
          href="/dashboard/admin/users"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Users</h3>
          <p className="text-sm text-gray-500">Clients and team members</p>
        </Link>
        {isSuperAdmin && (
          <>
            <Link
              href="/dashboard/admin/payments"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">Payments Audit</h3>
              <p className="text-sm text-gray-500">All payments, filters, export</p>
            </Link>
            <Link
              href="/dashboard/admin/finance"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">Financial Dashboard</h3>
              <p className="text-sm text-gray-500">Revenue, tax export, analytics</p>
            </Link>
            <Link
              href="/dashboard/admin/system-health"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">System Health</h3>
              <p className="text-sm text-gray-500">Email, AI, payments, database</p>
            </Link>
            <Link
              href="/dashboard/admin/activity"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">User Activity</h3>
              <p className="text-sm text-gray-500">Logins, submissions, signings</p>
            </Link>
            <Link
              href="/dashboard/admin/audit-logs"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">Audit Logs</h3>
              <p className="text-sm text-gray-500">Platform audit trail</p>
            </Link>
            <Link
              href="/dashboard/admin/security"
              className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
            >
              <h3 className="font-semibold text-secondary mb-1">Security</h3>
              <p className="text-sm text-gray-500">Threats, blocked IPs, alerts</p>
            </Link>
          </>
        )}
        <Link
          href="/dashboard/admin/reports"
          className="rounded-xl border border-gray-200 bg-white p-6 hover:border-primary/30 transition"
        >
          <h3 className="font-semibold text-secondary mb-1">Reports</h3>
          <p className="text-sm text-gray-500">Revenue and activity</p>
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold text-secondary">{value}</p>
    </div>
  );
}
