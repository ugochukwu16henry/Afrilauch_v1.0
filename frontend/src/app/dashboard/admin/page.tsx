'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, getStoredRoleFromToken, api, type User } from '@/lib/api';
import { StatsCard, QuickActionCard } from '@/components/dashboard/ModernCard';
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
  const [tokenRole, setTokenRole] = useState<string | null>(null);

  useEffect(() => {
    setTokenRole(getStoredRoleFromToken());
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    const role = user?.role || tokenRole;
    if (role === 'super_admin') {
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
  }, [user?.role, tokenRole]);

  const isSuperAdmin = (user?.role || tokenRole) === 'super_admin';

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
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatsCard
              icon={<span className="text-2xl">👥</span>}
              label="Total Users"
              value={overview.totalUsers}
              trend={{ value: 5, isPositive: true, label: 'vs last period' }}
            />
            <StatsCard
              icon={<span className="text-2xl">📊</span>}
              label="Projects"
              value={overview.activeProjects}
            />
            <StatsCard
              icon={<span className="text-2xl">💰</span>}
              label="Revenue"
              value={`$${overview.totalRevenueUsd.toFixed(0)}`}
              trend={{ value: 12, isPositive: true, label: 'vs last period' }}
            />
            <StatsCard
              icon={<span className="text-2xl">💡</span>}
              label="Ideas"
              value={overview.ideasSubmitted}
            />
            <StatsCard
              icon={<span className="text-2xl">✅</span>}
              label="Agreements"
              value={overview.agreementsSigned}
            />
          </div>

          {/* Revenue Breakdown */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Revenue Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Setup Fees</p>
                <p className="text-2xl font-bold text-primary">${overview.setupFeesCollectedUsd.toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-accent/5 to-accent/10 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Consultations</p>
                <p className="text-2xl font-bold text-accent">${overview.consultationPaymentsUsd.toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-secondary/5 to-secondary/10 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Investor Fees</p>
                <p className="text-2xl font-bold text-secondary">${overview.investorFeesUsd.toFixed(0)}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-primary">${overview.revenueMonthlyUsd.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Action Items */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Action Items</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`rounded-xl border p-4 ${
                overview.pendingManualPayments > 0
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <p className="text-xs font-medium text-gray-600 mb-1">Pending Payments</p>
                <p className={`text-2xl font-bold ${
                  overview.pendingManualPayments > 0 ? 'text-amber-600' : 'text-gray-900'
                }`}>{overview.pendingManualPayments}</p>
              </div>
              <div className={`rounded-xl border p-4 ${
                overview.pendingTalents > 0
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <p className="text-xs font-medium text-gray-600 mb-1">Talents Awaiting</p>
                <p className={`text-2xl font-bold ${
                  overview.pendingTalents > 0 ? 'text-blue-600' : 'text-gray-900'
                }`}>{overview.pendingTalents}</p>
              </div>
              <div className={`rounded-xl border p-4 ${
                overview.pendingStartups > 0
                  ? 'border-purple-200 bg-purple-50'
                  : 'border-gray-200 bg-white'
              }`}>
                <p className="text-xs font-medium text-gray-600 mb-1">Startups Pending</p>
                <p className={`text-2xl font-bold ${
                  overview.pendingStartups > 0 ? 'text-purple-600' : 'text-gray-900'
                }`}>{overview.pendingStartups}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Early Founders</p>
                <p className="text-2xl font-bold text-gray-900">{overview.earlyFounderCount}</p>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-between">
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
                <tr className="border-b border-gray-100 bg-gradient-to-r from-primary/5 to-transparent">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Project</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Client</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Stage</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Progress</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Actions</th>
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
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 max-w-[100px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                              style={{ width: `${p.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-600">{p.progressPercent}%</span>
                        </div>
                      </td>
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

      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={<span className="text-2xl">📋</span>}
            title="Leads"
            description="Track and manage incoming leads"
            href="/dashboard/admin/leads"
          />
          <QuickActionCard
            icon={<span className="text-2xl">📝</span>}
            title="Agreements"
            description="Manage and track signed agreements"
            href="/dashboard/admin/agreements"
          />
          <QuickActionCard
            icon={<span className="text-2xl">👥</span>}
            title="Users"
            description="Clients and team members"
            href="/dashboard/admin/users"
          />
          {isSuperAdmin && (
            <>
              <QuickActionCard
                icon={<span className="text-2xl">💳</span>}
                title="Payments Audit"
                description="All payments, filters, export"
                href="/dashboard/admin/payments"
              />
              <QuickActionCard
                icon={<span className="text-2xl">📊</span>}
                title="Financial Dashboard"
                description="Revenue, tax export, analytics"
                href="/dashboard/admin/finance"
              />
              <QuickActionCard
                icon={<span className="text-2xl">❤️</span>}
                title="System Health"
                description="Email, AI, payments, database"
                href="/dashboard/admin/system-health"
              />
              <QuickActionCard
                icon={<span className="text-2xl">📈</span>}
                title="User Activity"
                description="Logins, submissions, signings"
                href="/dashboard/admin/activity"
              />
              <QuickActionCard
                icon={<span className="text-2xl">📋</span>}
                title="Audit Logs"
                description="Platform audit trail"
                href="/dashboard/admin/audit-logs"
              />
              <QuickActionCard
                icon={<span className="text-2xl">🎟️</span>}
                title="Share Early Founder Link"
                description="Share the scholarship link for the first 300 founders"
                href="/invite/founder-early-access"
              />
              <QuickActionCard
                icon={<span className="text-2xl">🔒</span>}
                title="Security"
                description="Threats, blocked IPs, alerts"
                href="/dashboard/admin/security"
              />
              <QuickActionCard
                icon={<span className="text-2xl">📄</span>}
                title="Corporate Identity"
                description="Letterhead, NDA, contract, email signature templates"
                href="/dashboard/admin/corporate-identity"
              />
            </>
          )}
          <QuickActionCard
            icon={<span className="text-2xl">📑</span>}
            title="Reports"
            description="Revenue and activity"
            href="/dashboard/admin/reports"
          />
        </div>
      </div>
    </div>
  );
}
