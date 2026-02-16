'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getStoredToken, clearStoredToken, api, type User, type NotificationItem } from '@/lib/api';
import { SocialLinksBar } from '@/components/common/SocialLinksBar';
import { SetupModal } from '@/components/dashboard/SetupModal';

const clientNav = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/project', label: 'Project' },
  { href: '/dashboard/startup', label: 'Publish to Marketplace' },
  { href: '/dashboard/business', label: 'Business OS (beta)' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/reports', label: 'Reports' },
  { href: '/dashboard/community', label: 'Community' },
];

const adminNav = [
  { href: '/dashboard/admin', label: 'Dashboard' },
  { href: '/dashboard/admin/revenue', label: 'Revenue System' },
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/admin/leads', label: 'Leads' },
  { href: '/dashboard/admin/projects', label: 'Projects' },
  { href: '/dashboard/marketing', label: 'Marketing' },
  { href: '/dashboard/admin/tenants', label: 'Tenants' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/deal-tracking', label: 'Deal Tracking' },
  { href: '/dashboard/admin/startups', label: 'Startup approvals' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

const superAdminNav = [
  { href: '/dashboard/admin', label: 'Dashboard Overview' },
  { href: '/dashboard/admin/cms', label: 'CMS Manager' },
  { href: '/dashboard/admin/revenue', label: 'Revenue System' },
  { href: '/dashboard/admin/knowledge', label: 'Internal Knowledge Center' },
  { href: '/dashboard/admin/hr', label: 'Hiring / Talent' },
  { href: '/dashboard/admin/skills', label: 'Skill Management' },
  { href: '/dashboard/legal', label: 'Legal Agreements' },
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/admin/users', label: 'Users' },
  { href: '/dashboard/admin/leads', label: 'Leads' },
  { href: '/dashboard/admin/projects', label: 'Ideas & Projects' },
  { href: '/dashboard/admin/milestones', label: 'Milestones' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/admin/investors', label: 'Investors' },
  { href: '/dashboard/admin/deal-tracking', label: 'Deal Tracking' },
  { href: '/dashboard/admin/startups', label: 'Startup Marketplace' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
  { href: '/dashboard/admin/payments', label: 'Payments' },
  { href: '/dashboard/admin/subscriptions', label: 'Subscriptions' },
  { href: '/dashboard/admin/consultations', label: 'Consultations' },
  { href: '/dashboard/notifications', label: 'Notifications' },
  { href: '/dashboard/mentor', label: 'AI Evaluations' },
  { href: '/dashboard/marketing', label: 'Marketing Campaigns' },
  { href: '/dashboard/admin/analytics', label: 'Analytics' },
  { href: '/dashboard/admin/audit-logs', label: 'Audit Logs' },
  { href: '/dashboard/admin/email-logs', label: 'Email Logs' },
  { href: '/dashboard/admin/equity', label: 'Equity / Cap tables' },
  { href: '/dashboard/admin/team', label: 'Team Management' },
  { href: '/dashboard/admin/reports', label: 'Reports' },
  { href: '/dashboard/admin/settings', label: 'Settings' },
];

const teamMemberNav = [
  { href: '/dashboard/team', label: 'Team Dashboard' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/tasks', label: 'Tasks' },
  { href: '/dashboard/files', label: 'Files' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/notifications', label: 'Notifications' },
];

const investorNav = [
  { href: '/dashboard/investor', label: 'Dashboard' },
  { href: '/dashboard/investor/deal-room', label: 'Deal Room' },
  { href: '/dashboard/investor/marketplace', label: 'Marketplace' },
  { href: '/dashboard/investor/investments', label: 'My investments' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
  { href: '/dashboard/community', label: 'Community' },
];

const talentNav = [
  { href: '/dashboard/talent', label: 'Dashboard' },
  { href: '/dashboard/talent/profile', label: 'Profile' },
  { href: '/dashboard/talent/hires', label: 'My hires' },
  { href: '/dashboard/talent/agreements', label: 'Agreements' },
  { href: '/dashboard/mentor', label: 'AI Mentor' },
];

const hirerNav = [
  { href: '/dashboard/hirer', label: 'Dashboard' },
  { href: '/talent-marketplace', label: 'Browse talents' },
  { href: '/dashboard/hirer/hires', label: 'My hires' },
  { href: '/dashboard/hirer/agreements', label: 'Agreements' },
  { href: '/dashboard/hirer/payments', label: 'Payments' },
];

const hrManagerNav = [
  { href: '/dashboard/admin/hr', label: 'HR Dashboard' },
  { href: '/dashboard/admin/hr/talents', label: 'Review talents' },
  { href: '/dashboard/admin/hr/hirers', label: 'Hirers' },
  { href: '/dashboard/admin/hr/hires', label: 'Hires' },
  { href: '/dashboard/admin/agreements', label: 'Agreements' },
];

const legalNav = [
  { href: '/dashboard/legal', label: 'Agreements' },
  { href: '/dashboard/legal/audit', label: 'Audit trail' },
];

function isAdmin(role: string) {
  return ['super_admin', 'cofounder', 'project_manager', 'finance_admin'].includes(role);
}

function isTeamMember(role: string) {
  return ['super_admin', 'project_manager', 'finance_admin', 'developer', 'designer', 'marketer'].includes(role);
}

function isInvestor(role: string) {
  return role === 'investor';
}

function isTalent(role: string) {
  return role === 'talent';
}

function isHirer(role: string) {
  return role === 'hirer' || role === 'hiring_company';
}

function isHrManager(role: string) {
  return role === 'hr_manager';
}

function isLegalTeam(role: string) {
  return role === 'legal_team';
}

function needsSetupModal(user: User): boolean {
  if (user.setupPaid) return false;
  if (user.role !== 'client' && user.role !== 'investor') return false;
  return !user.setupReason;
}

function DashboardLayoutSkeleton() {
  return (
    <div className="min-h-screen flex bg-background text-text-dark">
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white min-h-screen animate-pulse-subtle" />
      <main className="flex-1 flex items-center justify-center p-6">
        <p className="text-secondary text-sm">Loading...</p>
      </main>
    </div>
  );
}

function DashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [helpQuestion, setHelpQuestion] = useState('');
  const [helpAnswer, setHelpAnswer] = useState<string | null>(null);
  const [helpLoading, setHelpLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.notifications
      .list(token, { limit: 50 })
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {});
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    if (notifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [notifOpen]);

  async function markOneRead(id: string) {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.notifications.markRead(id, token);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.notifications.markAllRead(token);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      router.replace('/login');
      return;
    }
    api.auth.me(token)
      .then((userData) => {
        setUser(userData);
        setLoading(false);
      })
      .catch(() => {
        clearStoredToken();
        setLoading(false);
        router.replace('/login');
      });
  }, [router]);

  // After payment redirect: verify and refresh user
  useEffect(() => {
    const token = getStoredToken();
    const ref = searchParams.get('ref');
    const success = searchParams.get('setup_success');
    const marketplaceSuccess = searchParams.get('marketplace_fee_success');
    if (!token || !ref) return;
    if (success === '1') {
      api.setupFee.verify({ reference: ref }, token)
        .then((r) => { if (r.setupPaid) api.auth.me(token!).then(setUser); })
        .catch(() => {})
        .finally(() => router.replace(pathname?.split('?')[0] || '/dashboard'));
      return;
    }
    if (marketplaceSuccess === '1') {
      api.marketplaceFee.verify({ reference: ref }, token)
        .then(() => api.auth.me(token!).then(setUser))
        .catch(() => {})
        .finally(() => router.replace(pathname?.split('?')[0] || '/dashboard'));
    }
  }, [searchParams, pathname, router]);

  function handleLogout() {
    const token = getStoredToken();
    if (token) api.auth.logout(token).catch(() => {});
    clearStoredToken();
    window.location.href = '/login';
  }

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background text-text-dark">
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white min-h-screen animate-pulse-subtle" />
        <main className="flex-1 flex items-center justify-center p-6">
          <p className="text-secondary text-sm">Loading...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex bg-background text-text-dark items-center justify-center">
        <p className="text-secondary text-sm">Redirecting to login...</p>
      </div>
    );
  }

  const nav =
    user.role === 'super_admin'
      ? superAdminNav
      : isAdmin(user.role)
        ? adminNav
        : isTeamMember(user.role)
          ? teamMemberNav
          : isInvestor(user.role)
            ? investorNav
            : isTalent(user.role)
              ? talentNav
              : isHirer(user.role)
                ? hirerNav
                : isHrManager(user.role)
                  ? hrManagerNav
                  : isLegalTeam(user.role)
                    ? legalNav
                    : clientNav;
  const base =
    user.role === 'super_admin'
      ? '/dashboard/admin'
      : isAdmin(user.role)
        ? '/dashboard/admin'
        : isTeamMember(user.role)
          ? '/dashboard/team'
          : isInvestor(user.role)
            ? '/dashboard/investor'
            : isTalent(user.role)
              ? '/dashboard/talent'
              : isHirer(user.role)
                ? '/dashboard/hirer'
                : isHrManager(user.role)
                  ? '/dashboard/admin/hr'
                  : isLegalTeam(user.role)
                    ? '/dashboard/legal'
                    : '/dashboard';
  const primaryColor = user.tenant?.primaryColor || '#0FA958';
  // Brand: env override > normalized tenant name (legacy "AfriLaunch Hub" → "RiseFlow Hub") > fallback
  const rawBrand = user.tenant?.orgName || 'RiseFlow Hub';
  const normalizedBrand =
    typeof rawBrand === 'string' &&
    (rawBrand === 'AfriLaunch Hub' || rawBrand === 'AfriLaunch' || rawBrand.toLowerCase() === 'afrilaunch hub' || rawBrand.toLowerCase() === 'afrilaunch')
      ? 'RiseFlow Hub'
      : rawBrand;
  const envName =
    typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_APP_NAME : undefined;
  const brandName =
    (typeof envName === 'string' && envName.trim() ? envName.trim() : null) ||
    normalizedBrand;
  const logoUrl = user.tenant?.logo || '/RiseFlowHub%20logo.png';
  const showSetupModal = needsSetupModal(user);
  const showWelcomePanel = isTeamMember(user.role) && user.welcomePanelSeen === false;

  function handleSetupComplete(updated: User) {
    setUser(updated);
  }

  async function dismissWelcomePanel() {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.users.updateMe({ welcomePanelSeen: true }, token);
      setUser((u) => (u ? { ...u, welcomePanelSeen: true } : u));
    } catch {
      // ignore
    }
  }

  return (
    <div
      className="min-h-screen flex bg-background text-text-dark"
      style={{ ['--tenant-primary' as string]: primaryColor }}
    >
      <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <Link href={base} className="flex items-center gap-2 text-lg font-bold" style={{ color: primaryColor }}>
            <Image src={logoUrl} alt={brandName} width={32} height={32} className="h-8 w-auto object-contain" unoptimized={logoUrl.startsWith('http')} />
            <span>{brandName}</span>
          </Link>
        </div>
        <nav className="p-2 space-y-0.5 flex-1">
          {nav.map((item) => {
            const showLocked = !user.setupPaid && (user.role === 'client' || user.role === 'investor');
            const locked = showLocked && isLockedNavItem(item.href, user.role);
            return (
              <span key={item.href} className="relative block group">
                {locked ? (
                  <span
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                    title="Unlock by completing setup payment"
                  >
                    {item.label}
                    <span className="ml-1.5 inline-block text-amber-500" title="Unlock by completing setup payment">🔒</span>
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                      pathname === item.href
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={pathname === item.href ? { backgroundColor: `${primaryColor}20`, color: primaryColor } : undefined}
                  >
                    {item.label}
                  </Link>
                )}
                {locked && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-1 px-2 py-1.5 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10 whitespace-nowrap">
                    Unlock by completing setup payment
                  </div>
                )}
              </span>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <p className="text-xs text-gray-500 truncate">{user.email}</p>
          <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-2 text-sm text-gray-500 hover:underline"
            style={{ color: primaryColor }}
          >
            Log out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-h-0">
        <header className="flex-shrink-0 flex items-center justify-between gap-2 h-12 px-4 border-b border-gray-200 bg-white">
          <div className="hidden sm:block">
            <SocialLinksBar variant="light" size="sm" align="left" />
          </div>
          <div className="flex-1" />
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setNotifOpen((o) => !o)}
              className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Notifications"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50 max-h-[min(24rem,70vh)] flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                  <span className="font-semibold text-secondary">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => { markAllRead(); setNotifOpen(false); }}
                      className="text-xs font-medium hover:underline"
                      style={{ color: primaryColor }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>
                <ul className="overflow-auto flex-1">
                  {notifications.length === 0 ? (
                    <li className="px-3 py-4 text-center text-sm text-gray-500">No notifications</li>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <li key={n.id} className={`border-b border-gray-50 last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                        <Link
                          href={n.link || '/dashboard/notifications'}
                          onClick={() => { if (!n.read) markOneRead(n.id); setNotifOpen(false); }}
                          className="block px-3 py-2.5 hover:bg-gray-50"
                        >
                          <p className="font-medium text-sm text-secondary">{n.title}</p>
                          {n.message && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{n.message}</p>}
                          <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
                <div className="border-t border-gray-100 px-3 py-2">
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-sm font-medium block text-center py-1 hover:underline"
                    style={{ color: primaryColor }}
                  >
                    View all
                  </Link>
                </div>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 relative">{children}</main>
      </div>
      {showSetupModal && (
        <SetupModal
          user={user}
          onComplete={(updated) => {
            api.auth.me(getStoredToken()!).then(setUser);
          }}
          primaryColor={primaryColor}
        />
      )}
      {showWelcomePanel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Welcome">
          <div className="max-w-lg rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
            <h2 className="text-xl font-bold text-secondary mb-4">Welcome to the Venture Builder Platform</h2>
            <p className="text-gray-700 leading-relaxed mb-6">
              You are not just joining a team — you are helping build startups, systems, and opportunities from the ground up. Early contributors grow into leadership roles as the platform scales.
            </p>
            <button
              type="button"
              onClick={dismissWelcomePanel}
              className="w-full rounded-xl py-3 px-4 font-semibold text-white hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              Get started
            </button>
          </div>
        </div>
      )}
      {/* Floating Help AI button */}
      <button
        type="button"
        onClick={() => setHelpOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-40 rounded-full bg-primary text-white w-11 h-11 flex items-center justify-center shadow-lg hover:opacity-90"
        aria-label="Help and tutorials"
      >
        ?
      </button>
      {helpOpen && (
        <div className="fixed bottom-20 right-5 z-40 w-80 max-w-[90vw] rounded-2xl border border-gray-200 bg-white shadow-xl flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-secondary">Need help?</p>
              <p className="text-xs text-gray-500">Ask how to use the platform.</p>
            </div>
            <button
              type="button"
              onClick={() => setHelpOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
          <div className="px-4 py-3 space-y-2 text-xs text-gray-700 max-h-64 overflow-y-auto">
            <p>
              Try questions like:
              <br />
              “How do I submit my idea?”
              <br />
              “How do I find investors?”
              <br />
              “What does this page mean?”
            </p>
            {helpAnswer && (
              <div className="mt-1 rounded-lg bg-gray-50 border border-gray-100 p-2 text-xs text-gray-800 whitespace-pre-line">
                {helpAnswer}
              </div>
            )}
          </div>
          <form
            className="px-3 pb-3 pt-1 border-t border-gray-100 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!helpQuestion.trim()) return;
              const token = getStoredToken();
              if (!token) return;
              setHelpLoading(true);
              setHelpAnswer(null);
              try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
                const helpUrl = apiBase ? `${apiBase.replace(/\/+$/, '')}/api/v1/help-ai/ask` : '/api/v1/help-ai/ask';
                const res = await fetch(helpUrl, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ question: helpQuestion.trim(), pagePath: pathname }),
                });
                if (!res.ok) throw new Error('Failed to get answer');
                const data = (await res.json()) as { answer: string };
                setHelpAnswer(data.answer);
              } catch (err) {
                setHelpAnswer(
                  err instanceof Error ? err.message : 'Sorry, something went wrong. Please try again.'
                );
              } finally {
                setHelpLoading(false);
              }
            }}
          >
            <input
              type="text"
              value={helpQuestion}
              onChange={(e) => setHelpQuestion(e.target.value)}
              placeholder="Ask a how-to question..."
              className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-xs"
            />
            <button
              type="submit"
              disabled={helpLoading}
              className="rounded-lg bg-primary text-white px-3 py-1 text-xs font-medium hover:opacity-90 disabled:opacity-50"
            >
              {helpLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<DashboardLayoutSkeleton />}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}

function isLockedNavItem(href: string, role: string): boolean {
  const clientLocked = ['/dashboard/mentor', '/dashboard/startup', '/dashboard/marketing'];
  const investorLocked = ['/dashboard/mentor', '/dashboard/investor/marketplace'];
  if (role === 'client') return clientLocked.some((p) => href === p || href.startsWith(p + '/'));
  if (role === 'investor') return investorLocked.some((p) => href === p || href.startsWith(p + '/'));
  return false;
}
