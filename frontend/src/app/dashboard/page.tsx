'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type UserFeatureState } from '@/lib/api';
import { RevenueModelSection } from '@/components/common/RevenueModelSection';
import type {
  Project,
  AssignedToMe,
  ProjectStatus,
  UserBadge,
  FounderReputationBreakdown,
} from '@/lib/api';

const PROJECT_STATUS_FLOW: { value: ProjectStatus; label: string }[] = [
  { value: 'IdeaSubmitted', label: 'Idea Submitted' },
  { value: 'ReviewValidation', label: 'Review & Validation' },
  { value: 'ProposalSent', label: 'Proposal Sent' },
  { value: 'Development', label: 'Development' },
  { value: 'Testing', label: 'Testing' },
  { value: 'Live', label: 'Live' },
  { value: 'Maintenance', label: 'Maintenance' },
];

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [agreements, setAgreements] = useState<AssignedToMe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [signModal, setSignModal] = useState<AssignedToMe | null>(null);
  const [signSuccess, setSignSuccess] = useState(false);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [reputation, setReputation] = useState<FounderReputationBreakdown | null>(null);
  const [features, setFeatures] = useState<UserFeatureState | null>(null);
  const [costStructureOpen, setCostStructureOpen] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      fetch('/api/v1/projects', { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
        .then(setProjects)
        .catch(() => setError('Could not load projects')),
      api.agreements
        .listAssignedToMe(token)
        .then(setAgreements)
        .catch(() => setAgreements([])),
      api.badges
        .list(token)
        .then((res) => setBadges(res.items))
        .catch(() => setBadges([])),
      api.founders
        .meReputation(token)
        .then(setReputation)
        .catch(() => setReputation(null)),
      api.users
        .meFeatures(token)
        .then(setFeatures)
        .catch(() => setFeatures(null)),
    ]).finally(() => setLoading(false));
  }, []);

  const project = projects[0];
  const tasks = project?.tasks ?? [];
  const milestones = project?.milestones ?? [];
  const nextTask = tasks.find((t) => t.status !== 'Done') ?? null;
  const doneCount = tasks.filter((t) => t.status === 'Done').length;
  const progress = tasks.length ? Math.round((doneCount / tasks.length) * 100) : project?.progressPercent ?? 0;
  const currentStatusIndex = project?.status
    ? PROJECT_STATUS_FLOW.findIndex((s) => s.value === project.status)
    : 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Welcome back</h1>
      <p className="text-gray-600 mb-8">
        Here’s an overview of your project and next steps.
      </p>

      {/* Smart feature access grid */}
      {features && (
        <div className="mb-6 space-y-3">
          {features.hasPendingManualPayment && features.pendingManualPayment && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
              We’ve received your bank transfer of{' '}
              <span className="font-semibold">
                {Number(features.pendingManualPayment.amount).toLocaleString()}{' '}
                {features.pendingManualPayment.currency}
              </span>
              . It is currently <span className="font-semibold">pending verification</span>. You’ll get a notification
              once it is confirmed and your features are unlocked.
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Idea workspace / dashboard */}
            <FeatureCard
              title="Idea workspace"
              description="Plan, validate, and manage your startup in one place."
              href="/dashboard/project"
              unlocked={features.hasSetupAccess}
              primaryCtaLabel={features.hasSetupAccess ? 'Open workspace' : 'Unlock with setup fee'}
              lockedHint="Pay or claim your Early Founder scholarship to unlock your idea dashboard and workspace."
            />

            {/* AI Co‑Founder */}
            <FeatureCard
              title="AI Co‑Founder"
              description="Ask questions and get structured guidance for your idea."
              href="/dashboard/ai"
              unlocked={features.unlockedFeatures.includes('ai_guidance')}
              primaryCtaLabel={features.unlockedFeatures.includes('ai_guidance') ? 'Chat with AI' : 'Unlock AI guidance'}
              lockedHint="Unlock your setup to access AI Co‑Founder guidance for validation, strategy, and planning."
            />

            {/* Consultation booking */}
            <FeatureCard
              title="1:1 Consultation"
              description="Book a session to review your idea, pricing, or roadmap."
              href="/dashboard/consultation"
              unlocked={features.unlockedFeatures.includes('consultations')}
              primaryCtaLabel={features.unlockedFeatures.includes('consultations') ? 'Book consultation' : 'Unlock consultation'}
              lockedHint="Once your setup is active, you can book a founder consultation."
            />

            {/* Marketplace access */}
            <FeatureCard
              title="Marketplace access"
              description="Hire vetted talent or showcase your skills for paid projects."
              href="/dashboard/marketplace"
              unlocked={features.hasMarketplaceAccess}
              primaryCtaLabel={features.hasMarketplaceAccess ? 'Go to marketplace' : 'Unlock marketplace'}
              lockedHint="Pay the small marketplace fee or complete required steps to unlock hiring and talent opportunities."
            />

            {/* Donor / supporter */}
            <FeatureCard
              title="Donor & supporter badge"
              description="Support the platform and display your donor badge on your profile."
              href="/dashboard/payments"
              unlocked={features.hasDonorBadge}
              primaryCtaLabel={features.hasDonorBadge ? 'View payments' : 'Donate or support'}
              lockedHint="Send a voluntary donation to unlock your donor badge and help other founders get started."
            />

            {/* Early Founder program */}
            <FeatureCard
              title="Early Founder program"
              description="Limited scholarship seats with sponsored starter access."
              href="/invite/founder-early-access"
              unlocked={features.isEarlyFounder}
              primaryCtaLabel={features.isEarlyFounder ? 'View my benefits' : 'Check availability'}
              lockedHint="If seats are still open, you can join via the Early Founder invite link and unlock sponsored starter access."
            />
          </div>
        </div>
      )}

      {/* Platform Cost Structure — Revenue Model transparency */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setCostStructureOpen((o) => !o)}
          className="flex items-center justify-between w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-left hover:bg-gray-50 transition"
        >
          <span className="font-semibold text-secondary">Platform Cost Structure</span>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${costStructureOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {costStructureOpen && (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
            <RevenueModelSection source="dashboard" sectionTitle="Platform Cost Structure" variant="panel" />
          </div>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}
      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-6">{error}</div>
      )}

      {!loading && !project && !error && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600 mb-4">You don’t have a project yet.</p>
          <Link
            href="/dashboard/project"
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
          >
            View project
          </Link>
        </div>
      )}

      {/* Project timeline — always visible so E2E can assert timeline or no-project message */}
      {!loading && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 mt-6" aria-labelledby="project-timeline-heading">
          <h2 id="project-timeline-heading" className="text-lg font-semibold text-secondary mb-3">
            Project timeline
          </h2>
          {project ? (
            <div className="flex flex-wrap gap-2">
              {PROJECT_STATUS_FLOW.map((s, i) => (
                <span
                  key={s.value}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                    i <= currentStatusIndex ? 'bg-primary/15 text-primary' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No active project yet</p>
          )}
        </section>
      )}

      {/* Agreements to Sign — always visible for client; API filters by logged-in user */}
      {!loading && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 mt-6" aria-labelledby="agreements-to-sign-heading">
          <h2 id="agreements-to-sign-heading" className="text-lg font-semibold text-secondary mb-3">
            Agreements to Sign
          </h2>
          {agreements.length === 0 ? (
            <p className="text-gray-500 text-sm">No agreements assigned to you</p>
          ) : (
            <ul className="space-y-2">
              {agreements.map((a) => (
                <li key={a.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-text-dark">{a.agreement.title}</p>
                    <p className="text-sm text-gray-500">{a.agreement.type}</p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      a.status === 'Signed' ? 'bg-green-100 text-green-800' : a.status === 'Overdue' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {a.status}
                  </span>
                  {a.status !== 'Signed' && (
                    <button
                      type="button"
                      onClick={() => setSignModal(a)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-sm text-white hover:opacity-90"
                    >
                      Read & Sign
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!loading && project && (
        <>
          {/* Overview — progress bar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Project</p>
              <p className="font-semibold text-secondary">{project.projectName}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Status</p>
              <p className="font-semibold text-primary capitalize">
                {project.status ? PROJECT_STATUS_FLOW.find((s) => s.value === project.status)?.label ?? project.status : project.stage}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Progress</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-sm text-gray-500 mb-1">Next milestone</p>
              <p className="font-semibold text-text-dark truncate">
                {nextTask ? nextTask.title : milestones[0]?.title ?? '—'}
              </p>
            </div>
          </div>

          {/* Founder reputation (timeline is in always-visible section above) */}
          <div className="grid gap-4 lg:grid-cols-3 mb-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-secondary mb-3">Project status</h2>
              <p className="text-sm text-gray-600">
                Current stage: {project.status ? PROJECT_STATUS_FLOW.find((s) => s.value === project.status)?.label ?? project.status : project.stage}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-sm font-semibold text-secondary mb-1">Founder reputation</h2>
              {reputation ? (
                <>
                  <p className="text-xs text-gray-600 mb-2">
                    Your trust & professionalism score based on profile, progress, investor activity, and milestones.
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700">
                      {reputation.level}
                    </span>
                    <span className="text-sm font-semibold text-secondary">{reputation.total}/100</span>
                  </div>
                  <dl className="space-y-1 text-[11px] text-gray-600">
                    <div className="flex justify-between">
                      <dt>Profile</dt>
                      <dd>{reputation.profileCompleteness}/10</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Idea clarity</dt>
                      <dd>{reputation.ideaClarity}/10</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Progress</dt>
                      <dd>{reputation.projectProgress}/20</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Investor feedback</dt>
                      <dd>{reputation.investorFeedback}/15</dd>
                    </div>
                  </dl>
                </>
              ) : (
                <p className="text-xs text-gray-500">
                  Your founder reputation will appear here once your profile, projects, and milestones are more active.
                </p>
              )}
            </div>
          </div>

          {/* Documents & Repo */}
          {(project.repoUrl || project.liveUrl) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
              <h2 className="text-lg font-semibold text-secondary mb-3">Documents & Repo</h2>
              <div className="flex flex-wrap gap-3">
                {project.repoUrl && (
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Repository (GitHub/GitLab)
                  </a>
                )}
                {project.liveUrl && (
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Live site
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Achievements & referrals */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Your achievements</h2>
            {badges.length === 0 ? (
              <p className="text-gray-500 text-sm">Complete actions like submitting ideas, refining with AI, and logging revenue to unlock badges.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {badges.map((b) => (
                  <span
                    key={`${b.badgeName}-${b.dateAwarded}`}
                    className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                  >
                    {b.badgeName
                      .split('_')
                      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                      .join(' ')}
                  </span>
                ))}
              </div>
            )}
            {badges.some((b) => b.badgeName === 'early_founder') && (
              <p className="mt-3 text-xs text-gray-600">
                You joined as an <span className="font-semibold text-secondary">Early Founder</span>. Your starter access was sponsored by the scholarship program. To keep unlocking advanced features, continue progressing through your roadmap and later choose a growth plan.
              </p>
            )}
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-sm font-medium text-secondary mb-1">Invite a founder friend</p>
              <p className="text-xs text-gray-500 mb-2">
                Share your personal link. When they submit an idea and launch, you both unlock extra perks in RiseFlow Hub.
              </p>
              <ReferralShare />
            </div>
          </div>

          {/* Milestones & Tasks */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Milestones & Tasks</h2>
            {milestones.length > 0 ? (
              <ul className="space-y-3">
                {milestones.map((m) => (
                  <li key={m.id} className="border-l-2 border-primary/30 pl-4">
                    <p className="font-medium text-text-dark">{m.title}</p>
                    <p className="text-sm text-gray-500 capitalize">{m.status}</p>
                    {m.tasks && m.tasks.length > 0 && (
                      <ul className="mt-2 ml-2 text-sm text-gray-600">
                        {m.tasks.map((t) => (
                          <li key={t.id}>• {t.title} — {t.status}</li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No milestones yet. Tasks:</p>
            )}
            {tasks.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm">
                {tasks.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex justify-between">
                    <span>{t.title}</span>
                    <span className="capitalize text-gray-500">{t.status}</span>
                  </li>
                ))}
                {tasks.length > 5 && <li className="text-gray-500">+{tasks.length - 5} more</li>}
              </ul>
            )}
            {tasks.length === 0 && milestones.length === 0 && <p className="text-gray-500 text-sm">No tasks yet.</p>}
            <Link href="/dashboard/tasks" className="mt-3 inline-block text-sm text-primary hover:underline">View all tasks →</Link>
          </div>

          {/* Payments & Billing placeholder */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Payments & Billing</h2>
            <p className="text-gray-500 text-sm">View invoices and payment history in the Payments section.</p>
            <Link href="/dashboard/payments" className="mt-2 inline-block text-sm text-primary hover:underline">Go to Payments →</Link>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">Team assigned</h2>
            <p className="text-gray-600 text-sm">
              {project.client?.user?.name
                ? `Contact: ${project.client.user.name} (${project.client.user.email})`
                : 'Your team will be shown here once assigned.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard/project"
              className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
            >
              Project details
            </Link>
            <Link
              href="/dashboard/tasks"
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              View tasks
            </Link>
          </div>
        </>
      )}

      {/* Sign agreement modal */}
      {signModal && (
        <SignAgreementModal
          assignment={signModal}
          onClose={() => setSignModal(null)}
          onSigned={() => {
            setSignSuccess(true);
            setAgreements((prev) => prev.map((a) => (a.id === signModal.id ? { ...a, status: 'Signed' as const } : a)));
          }}
        />
      )}
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  unlocked,
  primaryCtaLabel,
  lockedHint,
}: {
  title: string;
  description: string;
  href: string;
  unlocked: boolean;
  primaryCtaLabel: string;
  lockedHint: string;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 text-sm ${
        unlocked
          ? 'border-emerald-200 bg-white'
          : 'border-dashed border-gray-200 bg-gray-50 text-gray-500'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-secondary mb-1">{title}</p>
      <p className="text-xs mb-3">{description}</p>
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href}
          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium ${
            unlocked
              ? 'bg-primary text-white hover:opacity-90'
              : 'bg-white text-primary border border-primary/30 hover:bg-primary/5'
          }`}
        >
          {primaryCtaLabel}
        </Link>
        <span className="text-[10px] text-gray-500 max-w-[55%]">{lockedHint}</span>
      </div>
    </div>
  );
}

function SignAgreementModal({
  assignment,
  onClose,
  onSigned,
}: {
  assignment: AssignedToMe;
  onClose: () => void;
  onSigned: () => void;
}) {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [contentHtml, setContentHtml] = useState<string | null>(null);
  const token = getStoredToken();

  // Log "viewed" and load content when modal opens (audit trail)
  useEffect(() => {
    if (token && assignment?.agreement?.id) {
      api.agreements
        .view(assignment.agreement.id, token)
        .then((data) => setContentHtml(data.contentHtml ?? null))
        .catch(() => {});
    } else {
      setContentHtml(null);
    }
  }, [token, assignment?.agreement?.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !signature.trim() || !token) {
      setError('Please confirm you have read and agree, and enter your full name as signature.');
      return;
    }
    setError('');
    setLoading(true);
    const deviceInfo = typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : undefined;
    api.agreements
      .sign(assignment.agreement.id, { signatureText: signature.trim(), deviceInfo }, token)
      .then(() => {
        onSigned();
        onClose();
      })
      .catch((err) => setError(err.message || 'Failed to sign'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg max-h-[90vh] overflow-auto">
        <h2 className="text-lg font-semibold text-secondary mb-2">Read & Sign: {assignment.agreement.title}</h2>
        <p className="text-sm text-gray-600 mb-4">Type: {assignment.agreement.type}</p>
        {contentHtml ? (
          <div className="mb-4 max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
        ) : assignment.agreement.templateUrl ? (
          <p className="text-sm text-gray-600 mb-4">
            <a href={assignment.agreement.templateUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">
              Open agreement document (PDF/link)
            </a>
          </p>
        ) : (
          <p className="text-sm text-gray-500 mb-4 italic">No document content. Please confirm you have read the agreement.</p>
        )}
        <form onSubmit={handleSubmit}>
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="rounded border-gray-300" />
            <span className="text-sm">I have read and agree to this agreement.</span>
          </label>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full name (signature)</label>
          <input
            type="text"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Type your full name"
            className="mb-4 w-full rounded-lg border border-gray-200 px-3 py-2"
            required
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !agreed || !signature.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit signature'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ReferralShare() {
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState('');

  useEffect(() => {
    const token = getStoredToken();
    if (typeof window === 'undefined' || !token) return;
    // We only need the raw token payload's userId, which is already encoded into signup ref query on backend
    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = JSON.parse(atob(payloadBase64));
      const userId = payloadJson.userId as string | undefined;
      if (!userId) return;
      const origin = window.location.origin;
      setLink(`${origin}/signup?ref=${encodeURIComponent(userId)}`);
    } catch {
      // ignore
    }
  }, []);

  function handleCopy() {
    if (!link) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(
        () => setCopied(true),
        () => setCopied(false)
      );
    }
  }

  if (!link) {
    return <p className="text-xs text-gray-400">Sign in to see your referral link.</p>;
  }

  const shareText = encodeURIComponent(
    'I’m building my startup on RiseFlow Hub. Use my link to submit your idea and unlock founder tools:'
  );
  const encodedUrl = encodeURIComponent(link);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          readOnly
          value={link}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 bg-gray-50"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <a
          href={`https://wa.me/?text=${shareText}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-green-50 px-3 py-1 text-green-700 hover:bg-green-100"
        >
          Share on WhatsApp
        </a>
        <a
          href={`https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-sky-50 px-3 py-1 text-sky-700 hover:bg-sky-100"
        >
          Share on X
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-100"
        >
          Share on LinkedIn
        </a>
      </div>
    </div>
  );
}
