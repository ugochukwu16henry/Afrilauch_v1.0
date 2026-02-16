'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Nav, Footer } from '@/components/landing';
import { getStoredToken, api } from '@/lib/api';
import type { StartupProfileDetail } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface Props {
  startupId: string;
}

export default function StartupProfilePageClient({ startupId }: Props) {
  const router = useRouter();
  const [startup, setStartup] = useState<StartupProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'express' | 'meeting' | 'commit' | null>(null);
  const [commitAmount, setCommitAmount] = useState('');
  const [commitEquity, setCommitEquity] = useState('');
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const token = getStoredToken();

  useEffect(() => {
    if (!startupId) return;
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE}/api/v1/startups/${startupId}`, { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Not found'))))
      .then(setStartup)
      .catch((e) => setError(e.message ?? 'Not found'))
      .finally(() => setLoading(false));
  }, [startupId, token]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const base = APP_URL || window.location.origin;
      const url = `${base}/startups/${startupId}?utm_source=share&utm_medium=social&utm_campaign=startup_profile`;
      setShareUrl(url);
    }
  }, [startupId]);

  async function handleExpressInterest(requestMeeting: boolean) {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent('/startups/' + startupId));
      return;
    }
    setError('');
    try {
      await api.investments.expressInterest({ startupId, requestMeeting }, token);
      setAction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCommit() {
    if (!token) {
      router.push('/login?redirect=' + encodeURIComponent('/startups/' + startupId));
      return;
    }
    setError('');
    try {
      await api.investments.commit(
        {
          startupId,
          amount: commitAmount ? parseFloat(commitAmount) : undefined,
          equityPercent: commitEquity ? parseFloat(commitEquity) : undefined,
        },
        token
      );
      setAction(null);
      setCommitAmount('');
      setCommitEquity('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <p className="text-gray-500">Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (error && !startup) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <main className="mx-auto max-w-4xl px-4 py-12">
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3">{error}</div>
          <Link href="/" className="mt-4 inline-block text-primary hover:underline">
            ← Back to home
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  if (!startup) return null;

  const project = startup.project;
  const fullView = startup.fullView === true;
  const name = project?.projectName ?? 'Startup';
  const industry = project?.client?.industry ?? '—';
  const country = startup.country ?? '—';

  const twitterShare =
    shareUrl &&
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
      `${name} — a startup on RiseFlow Hub`
    )}`;
  const linkedinShare =
    shareUrl &&
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
  const whatsappShare =
    shareUrl &&
    `https://wa.me/?text=${encodeURIComponent(`${name} on RiseFlow Hub: ${shareUrl}`)}`;

  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard/investor/marketplace" className="text-sm text-primary hover:underline">
            ← Marketplace
          </Link>
          <Link href="/investors" className="text-sm text-gray-500 hover:underline">
            Investors
          </Link>
        </div>

        {/* Header */}
        <header className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-4">
          <div className="flex justify-between gap-4 items-start">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-secondary">{name}</h1>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-gray-600 text-sm">
                <span>{industry}</span>
                <span>·</span>
                <span>{startup.stage}</span>
                <span>·</span>
                <span>Funding: {Number(startup.fundingNeeded).toLocaleString()}</span>
                <span>·</span>
                <span>{country}</span>
              </div>
              {project?.client?.businessName && (
                <p className="mt-2 text-gray-500 text-sm">{project.client.businessName}</p>
              )}
            </div>
            {shareUrl && (
              <div className="flex flex-col items-end gap-1 text-xs">
                <span className="text-gray-500">Share</span>
                <div className="flex gap-2">
                  {twitterShare && (
                    <a
                      href={twitterShare}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50 text-gray-700"
                    >
                      X
                    </a>
                  )}
                  {linkedinShare && (
                    <a
                      href={linkedinShare}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50 text-gray-700"
                    >
                      in
                    </a>
                  )}
                  {whatsappShare && (
                    <a
                      href={whatsappShare}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-gray-200 px-2 py-1 hover:bg-gray-50 text-gray-700"
                    >
                      WA
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {!fullView && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-4 py-3 mt-4">
              <p className="text-sm font-medium">Partial preview</p>
              <p className="text-sm mt-1">
                Sign in as a verified investor to see full details, traction, product links, AI evaluation, timeline,
                documents, and to express interest or commit.
              </p>
              <Link
                href="/login?redirect="
                className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          )}
        </header>

        {/* Pitch Summary */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-secondary mb-3">💡 Pitch Summary</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{startup.pitchSummary}</p>
        </section>

        {/* Traction (full only) */}
        {fullView && startup.tractionMetrics && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📊 Traction & Metrics</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{startup.tractionMetrics}</p>
          </section>
        )}

        {/* Product (full only) */}
        {fullView &&
          (startup.liveUrl || startup.repoUrl || (startup.screenshots && startup.screenshots.length > 0)) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
              <h2 className="text-lg font-semibold text-secondary mb-3">🚀 Product</h2>
              {startup.screenshots && startup.screenshots.length > 0 && (
                <div className="flex flex-wrap gap-3 mb-4">
                  {startup.screenshots.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-lg overflow-hidden border border-gray-200 w-48 h-28 bg-gray-100"
                    >
                      <img src={url} alt={`Screenshot ${i + 1}`} className="object-cover w-full h-full" />
                    </a>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-4">
                {startup.liveUrl && (
                  <a
                    href={startup.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    Live link →
                  </a>
                )}
                {startup.repoUrl && (
                  <a
                    href={startup.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium hover:underline"
                  >
                    Repo link →
                  </a>
                )}
              </div>
            </section>
          )}

        {/* AI Evaluation (full only) */}
        {fullView &&
          (startup.aiFeasibilityScore != null || startup.aiRiskLevel || startup.aiMarketPotential) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
              <h2 className="text-lg font-semibold text-secondary mb-3">🧠 AI Evaluation</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {startup.aiFeasibilityScore != null && (
                  <div>
                    <p className="text-sm text-gray-500">Feasibility score</p>
                    <p className="font-semibold text-secondary">{startup.aiFeasibilityScore}/100</p>
                  </div>
                )}
                {startup.aiRiskLevel && (
                  <div>
                    <p className="text-sm text-gray-500">Risk level</p>
                    <p className="font-semibold text-secondary">{startup.aiRiskLevel}</p>
                  </div>
                )}
                {startup.aiMarketPotential && (
                  <div>
                    <p className="text-sm text-gray-500">Market potential</p>
                    <p className="font-semibold text-secondary">{startup.aiMarketPotential}</p>
                  </div>
                )}
              </div>
            </section>
          )}

        {/* Investment Info */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
          <h2 className="text-lg font-semibold text-secondary mb-3">💰 Investment Info</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Funding needed</p>
              <p className="font-semibold text-secondary">
                {Number(startup.fundingNeeded).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Equity offered</p>
              <p className="font-semibold text-secondary">
                {startup.equityOffer != null ? `${startup.equityOffer}%` : '—'}
              </p>
            </div>
          </div>
        </section>

        {/* Timeline (full only) */}
        {fullView && project?.milestones && project.milestones.length > 0 && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📅 Timeline</h2>
            <ul className="space-y-2">
              {project.milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3 text-sm">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      m.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {m.status}
                  </span>
                  <span className="font-medium text-gray-800">{m.title}</span>
                  {m.dueDate && (
                    <span className="text-gray-500">
                      {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Documents (full only) */}
        {fullView && startup.pitchDeckUrl && (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 mb-6">
            <h2 className="text-lg font-semibold text-secondary mb-3">📄 Documents</h2>
            <a
              href={startup.pitchDeckUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              Pitch deck →
            </a>
          </section>
        )}

        {/* CTAs */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-secondary mb-3">Take action</h2>
          {!token ? (
            <p className="text-gray-600 text-sm mb-4">
              Sign in or register as an investor to express interest, request a meeting, or commit.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setAction('express')}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Express interest
            </button>
            <button
              type="button"
              onClick={() => setAction('meeting')}
              className="rounded-lg border border-primary/60 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/5"
            >
              Request meeting
            </button>
            <button
              type="button"
              onClick={() => setAction('commit')}
              className="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
            >
              Commit amount
            </button>
          </div>

          {action && (
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3 text-sm">
              {action === 'express' && (
                <>
                  <p className="font-medium text-secondary">Express interest</p>
                  <p className="text-gray-600">
                    Let the founders know you&apos;d like to explore this opportunity.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExpressInterest(false)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Send interest
                  </button>
                </>
              )}
              {action === 'meeting' && (
                <>
                  <p className="font-medium text-secondary">Request a meeting</p>
                  <p className="text-gray-600">
                    We&apos;ll notify the founders and facilitate scheduling.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExpressInterest(true)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Request meeting
                  </button>
                </>
              )}
              {action === 'commit' && (
                <>
                  <p className="font-medium text-secondary">Soft commitment</p>
                  <p className="text-gray-600">
                    Indicate how much you&apos;d tentatively like to invest and the equity you&apos;re targeting.
                  </p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Amount (e.g. 10000)
                      </label>
                      <input
                        type="number"
                        value={commitAmount}
                        onChange={(e) => setCommitAmount(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Equity (%) (optional)
                      </label>
                      <input
                        type="number"
                        value={commitEquity}
                        onChange={(e) => setCommitEquity(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={handleCommit}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Submit commitment
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAction(null);
                        setCommitAmount('');
                        setCommitEquity('');
                      }}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600">
              {error}
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

