'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  api,
  getStoredToken,
  getStoredRoleFromToken,
  type User,
  type SecurityOverview,
  type SecurityEventItem,
  type BlockedIpRow,
} from '@/lib/api';

export default function SecurityDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [overview, setOverview] = useState<SecurityOverview | null>(null);
  const [events, setEvents] = useState<SecurityEventItem[]>([]);
  const [blockedIps, setBlockedIps] = useState<BlockedIpRow[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenRole, setTokenRole] = useState<string | null>(null);
  const [riskActionMessage, setRiskActionMessage] = useState<string | null>(null);
  const [warningSendingKey, setWarningSendingKey] = useState<string | null>(null);
  const [activityTarget, setActivityTarget] = useState<{
    label: string;
    userId?: string;
    email?: string;
    ip?: string;
    reasons: string[];
    severity: 'low' | 'medium' | 'high';
  } | null>(null);

  useEffect(() => {
    setTokenRole(getStoredRoleFromToken());
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  // Poll security data every 15 seconds for a near real-time feel
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      const token = getStoredToken();
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const [ov, ev, blocked] = await Promise.all([
          api.superAdmin.security.overview(token).catch(() => null),
          api.superAdmin.security
            .events(token, {
              severity: severityFilter || undefined,
              limit: 100,
            })
            .catch(() => ({ items: [] as SecurityEventItem[] })),
          api.superAdmin.security.blockedIps(token).catch(() => ({ items: [] as BlockedIpRow[] })),
        ]);
        if (cancelled) return;
        setOverview(ov);
        setEvents(ev?.items ?? []);
        setBlockedIps(blocked?.items ?? []);
      } catch {
        if (!cancelled) setError('Unable to load security data right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAll();
    const id = setInterval(fetchAll, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [severityFilter]);

  const isSuperAdmin = (user?.role || tokenRole) === 'super_admin';

  const handleUnblock = async (id: string) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.superAdmin.security.unblockIp(id, token);
      setBlockedIps((rows) => rows.filter((r) => r.id !== id));
    } catch {
      // best-effort; keep UI unchanged on failure
    }
  };

  const criticalEvent = useMemo(
    () => events.find((e) => e.severity === 'critical' || (e.severity === 'high' && e.autoBlocked)),
    [events]
  );

  const aiRiskSessions = useMemo(() => {
    const grouped = new Map<
      string,
      {
        key: string;
        userLabel: string;
        userId?: string;
        email?: string;
        ip?: string;
        risk: 'low' | 'medium' | 'high';
        reasons: string[];
      }
    >();
    for (const e of events) {
      if (e.severity === 'low') continue;
      const key = e.user?.id || e.ip || e.id;
      const label = e.user?.email || e.user?.name || e.ip || 'Unknown';
      const existing = grouped.get(key) ?? {
        key,
        userLabel: label,
        userId: e.user?.id,
        email: e.user?.email,
        ip: e.ip || undefined,
        risk: 'medium',
        reasons: [],
      };
      const risk: 'low' | 'medium' | 'high' =
        e.severity === 'critical' || e.severity === 'high' ? 'high' : existing.risk;
      const reason =
        e.type === 'login_failed'
          ? 'Multiple failed logins'
          : e.type === 'rate_limit_exceeded'
          ? 'High request volume'
          : e.type === 'ip_blocked'
          ? 'IP auto-blocked by rules'
          : e.message;
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      existing.risk = risk;
      if (!existing.userId && e.user?.id) existing.userId = e.user.id;
      if (!existing.email && e.user?.email) existing.email = e.user.email;
      if (!existing.ip && e.ip) existing.ip = e.ip;
      grouped.set(key, existing);
    }
    return Array.from(grouped.values()).slice(0, 5);
  }, [events]);

  const activityEvents = useMemo(() => {
    if (!activityTarget) return [] as SecurityEventItem[];
    return events.filter((e) => {
      if (activityTarget.userId && e.user?.id === activityTarget.userId) return true;
      if (activityTarget.email && e.user?.email === activityTarget.email) return true;
      if (activityTarget.ip && e.ip === activityTarget.ip) return true;
      return false;
    });
  }, [activityTarget, events]);

  const handleSendWarning = async (session: {
    key: string;
    userId?: string;
    email?: string;
    ip?: string;
    risk: 'low' | 'medium' | 'high';
    reasons: string[];
  }) => {
    const token = getStoredToken();
    if (!token) return;
    setRiskActionMessage(null);
    setWarningSendingKey(session.key);
    try {
      const severity = session.risk === 'high' ? 'high' : session.risk === 'medium' ? 'medium' : 'low';
      const response = await api.superAdmin.security.sendWarning(
        {
          userId: session.userId,
          email: session.email,
          ip: session.ip,
          severity,
          reasons: session.reasons,
        },
        token
      );
      setRiskActionMessage(response.message || 'Warning sent successfully.');
    } catch (e) {
      setRiskActionMessage(e instanceof Error ? e.message : 'Failed to send warning.');
    } finally {
      setWarningSendingKey(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold text-secondary mb-4">Security</h1>
        <p className="text-gray-600">Only Super Admins can view the Security Command Center.</p>
      </div>
    );
  }

  const statusColor =
    overview?.systemStatus === 'under_attack'
      ? 'bg-red-500/20 text-red-300 border-red-500/60'
      : overview?.systemStatus === 'warning'
      ? 'bg-amber-500/20 text-amber-200 border-amber-500/60'
      : 'bg-emerald-500/20 text-emerald-200 border-emerald-500/60';

  return (
    <div className="max-w-6xl space-y-6">
      <div className="rounded-2xl bg-slate-950 text-slate-50 p-6 shadow-lg border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Security Command Center</h1>
            <p className="text-sm text-slate-400">
              Real-time view of threats, protections, and platform security health.
            </p>
          </div>
          {overview && (
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs border ${statusColor}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              <span className="uppercase tracking-wide font-semibold">System status</span>
              <span className="font-semibold">
                {overview.systemStatus === 'under_attack'
                  ? 'UNDER ATTACK'
                  : overview.systemStatus === 'warning'
                  ? 'WARNING'
                  : 'SECURE'}
              </span>
            </div>
          )}
        </div>

        {loading && (
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Loading security data…
          </div>
        )}
        {error && !loading && (
          <div className="mt-4 rounded-xl border border-red-500/40 bg-red-900/40 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        )}

        {overview && (
          <div className="mt-5 grid gap-4 md:grid-cols-3 lg:grid-cols-6 text-sm">
            <StatusCard
              label="Blocked attacks (today)"
              value={overview.blockedAttacksToday}
              tone={overview.blockedAttacksToday > 0 ? 'danger' : 'ok'}
            />
            <StatusCard
              label="Suspicious sessions"
              value={overview.suspiciousSessions}
              tone={overview.suspiciousSessions > 0 ? 'warn' : 'ok'}
            />
            <StatusCard label="Active users (last 30m)" value={overview.activeUsersEstimate} />
            <StatusCard label="Events (24h)" value={overview.eventsLast24h} />
            <StatusCard label="Blocked IPs" value={overview.blockedActive} />
            <StatusCard label="API req/min (est.)" value="—" />
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[2.2fr,1.4fr]">
        {/* Live Threat Monitor */}
        <section className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                Live threat monitor
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </h2>
              <p className="text-xs text-slate-500">
                Real-time feed of login abuse, rate limits and IP blocks.
              </p>
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
            >
              <option value="">All severities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="overflow-x-auto max-h-[320px]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Time</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">User / IP</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Threat</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Severity</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.length === 0 ? (
                  <tr>
                    <td className="px-3 py-6 text-center text-slate-500" colSpan={5}>
                      No recent security events.
                    </td>
                  </tr>
                ) : (
                  events.map((e) => {
                    const userLabel = e.user ? e.user.email || e.user.name || e.user.id : 'Anonymous';
                    const threatType =
                      e.type === 'login_failed'
                        ? 'Brute-force / invalid login'
                        : e.type === 'rate_limit_exceeded'
                        ? 'API abuse / flood'
                        : e.type === 'ip_blocked'
                        ? 'Auto-blocked IP'
                        : e.type;
                    const status =
                      e.type === 'ip_blocked' || e.autoBlocked
                        ? 'BLOCKED'
                        : e.severity === 'high' || e.severity === 'critical'
                        ? 'FLAGGED'
                        : 'LOGGED';
                    return (
                      <tr key={e.id} className="hover:bg-slate-50/80">
                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                          {new Date(e.createdAt).toLocaleTimeString(undefined, {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>
                        <td className="px-3 py-2 text-slate-800">
                          <div className="flex flex-col">
                            <span className="truncate max-w-[160px]">{userLabel}</span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px]">
                              {e.ip ?? 'IP unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-700 truncate max-w-[200px]">{threatType}</td>
                        <td className="px-3 py-2">
                          <SeverityPill severity={e.severity} />
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              status === 'BLOCKED'
                                ? 'bg-red-100 text-red-700'
                                : status === 'FLAGGED'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Incident alert & AI risk panel */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 text-slate-50 p-4 shadow">
            <h2 className="font-semibold text-sm mb-2 flex items-center gap-2">
              Incident alert center
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            </h2>
            {criticalEvent ? (
              <>
                <p className="text-xs text-slate-300 mb-3">
                  🚨 {criticalEvent.type === 'ip_blocked'
                    ? 'High-volume attack or repeated abuse detected. IP has been automatically blocked.'
                    : 'High-severity security event detected.'}
                </p>
                <p className="text-[11px] text-slate-400 mb-3">
                  {new Date(criticalEvent.createdAt).toLocaleString()} —{' '}
                  {criticalEvent.message || 'See security logs for full context.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    Activate emergency lockdown
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-500 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:border-slate-300"
                  >
                    Block IP range
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-500 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:border-slate-300"
                  >
                    Notify security team
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-slate-500 px-3 py-1 text-[11px] font-semibold text-slate-100 hover:border-slate-300"
                  >
                    Download incident report
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                No critical incidents detected. The system is monitoring for unusual spikes and abusive patterns.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <h2 className="font-semibold text-sm mb-1">AI risk detection</h2>
            <p className="text-xs text-slate-500 mb-3">
              Sessions with abnormal failed logins or request spikes, flagged for review.
            </p>
            {aiRiskSessions.length === 0 ? (
              <p className="text-xs text-slate-500">No sessions currently flagged as risky.</p>
            ) : (
              <div className="space-y-2">
                {riskActionMessage && (
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
                    {riskActionMessage}
                  </p>
                )}
                {aiRiskSessions.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate max-w-[160px]">
                        {s.userLabel}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {s.reasons.slice(0, 2).join(' · ')}
                        {s.reasons.length > 2 ? '…' : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SeverityPill
                        severity={s.risk === 'high' ? 'high' : s.risk === 'medium' ? 'medium' : 'low'}
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setActivityTarget({
                              label: s.userLabel,
                              userId: s.userId,
                              email: s.email,
                              ip: s.ip,
                              reasons: s.reasons,
                              severity: s.risk,
                            })
                          }
                          className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-700 hover:border-primary hover:text-primary"
                        >
                          View activity
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendWarning(s)}
                          disabled={warningSendingKey === s.key}
                          className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-700 hover:border-amber-500 hover:text-amber-700 disabled:opacity-60"
                        >
                          {warningSendingKey === s.key ? 'Sending…' : 'Send warning'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {activityTarget && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">Activity for {activityTarget.label}</h3>
                <button
                  type="button"
                  onClick={() => setActivityTarget(null)}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] text-slate-600 hover:border-slate-400"
                >
                  Close
                </button>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">Risk reasons: {activityTarget.reasons.join(' · ')}</p>
              {activityEvents.length === 0 ? (
                <p className="text-xs text-slate-500">No matching events in current feed.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {activityEvents.slice(0, 10).map((event) => (
                    <li key={event.id} className="rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800">{event.type}</span>
                        <SeverityPill severity={event.severity} />
                      </div>
                      <p className="text-[11px] text-slate-600">{event.message}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(event.createdAt).toLocaleString()} · {event.ip || 'IP unknown'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1.4fr]">
        {/* Account security & logs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-sm mb-2">Account security controls</h2>
          <p className="text-xs text-slate-500 mb-3">
            Quickly respond to suspicious behaviour: lock accounts, force logout, and review history.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <LinkCard
              title="Manage user accounts"
              description="Lock/unlock accounts, reset roles and review user details."
              href="/dashboard/admin/users"
            />
            <LinkCard
              title="Security & sessions"
              description="View login activity, revoke sessions and enforce 2FA."
              href="/dashboard/settings"
            />
            <LinkCard
              title="Audit logs vault"
              description="Full history of admin actions, important changes and sensitive flows."
              href="/dashboard/admin/audit-logs"
            />
            <LinkCard
              title="Activity timeline"
              description="End-to-end trail of logins, submissions and critical events."
              href="/dashboard/admin/activity"
            />
          </div>
        </section>

        {/* Automated defenses & status */}
        <section className="rounded-2xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-sm mb-2">Automated defenses</h2>
          <p className="text-xs text-slate-500 mb-3">
            Zero-trust protections active at the edge and at the application layer.
          </p>
          <div className="space-y-2 text-xs">
            <DefenseRow label="WAF protection" enabled={overview?.protections.waf ?? false} />
            <DefenseRow label="DDoS shield" enabled={overview?.protections.ddos ?? false} />
            <DefenseRow label="Rate limiting" enabled={overview?.protections.rateLimiting ?? true} />
            <DefenseRow label="AI / anomaly monitoring" enabled={overview?.protections.aiMonitoring ?? false} />
            <DefenseRow label="Database encryption (infra)" enabled={overview?.protections.dbEncryption ?? false} />
            <DefenseRow label="Encrypted backups" enabled={overview?.protections.backups ?? false} />
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Note: Some protections (WAF, DDoS, encryption) depend on your cloud provider configuration. Ensure they
            are enabled in production.
          </p>
        </section>
      </div>

      <section className="rounded-xl border border-blue-50 bg-blue-50/80 px-4 py-3 text-xs text-blue-900">
        <p className="font-semibold mb-1">User-facing safety messaging</p>
        <p>
          When suspicious behaviour is detected, end-users see a calm safety notice like:{' '}
          <span className="italic">
            &quot;Unusual activity has been detected from this session. If this is not you, please secure your
            account. Continued suspicious activity may result in access restrictions.&quot;
          </span>
        </p>
      </section>
    </div>
  );
}

function StatusCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: number | string;
  tone?: 'neutral' | 'ok' | 'warn' | 'danger';
}) {
  const color =
    tone === 'danger'
      ? 'text-red-300'
      : tone === 'warn'
      ? 'text-amber-200'
      : tone === 'ok'
      ? 'text-emerald-200'
      : 'text-slate-200';
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function SeverityPill({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const classes =
    severity === 'critical'
      ? 'bg-red-100 text-red-700'
      : severity === 'high'
      ? 'bg-orange-100 text-orange-700'
      : severity === 'medium'
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${classes}`}>
      {severity.toUpperCase()}
    </span>
  );
}

function LinkCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a
      href={href}
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 hover:border-primary/50 hover:bg-slate-100 transition"
    >
      <p className="text-xs font-semibold text-slate-900">{title}</p>
      <p className="text-[11px] text-slate-500">{description}</p>
    </a>
  );
}

function DefenseRow({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-slate-700">{label}</p>
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
          enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        {enabled ? 'ENABLED' : 'NOT CONFIGURED'}
      </span>
    </div>
  );
}

