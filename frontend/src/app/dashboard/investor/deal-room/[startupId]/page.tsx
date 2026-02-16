'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken, api } from '@/lib/api';
import { RevenueModelSection } from '@/components/common/RevenueModelSection';
import type {
  DealRoomStartupDetail,
  DealRoomMessage,
  InvestmentListItem,
  StartupScoreResponse,
  FounderReputationBreakdown,
} from '@/lib/api';

export default function DealRoomStartupProfilePage() {
  const params = useParams();
  const router = useRouter();
  const startupId = params?.startupId as string | undefined;
  const token = getStoredToken();
  const [startup, setStartup] = useState<DealRoomStartupDetail | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [myInvestments, setMyInvestments] = useState<InvestmentListItem[]>([]);
  const [messages, setMessages] = useState<DealRoomMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [action, setAction] = useState<'express' | 'meeting' | 'commit' | null>(null);
  const [commitAmount, setCommitAmount] = useState('');
  const [commitEquity, setCommitEquity] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [accessStatus, setAccessStatus] = useState<'none' | 'requested' | 'approved' | 'rejected'>('approved');
  const [score, setScore] = useState<StartupScoreResponse | null>(null);
  const [founderRep, setFounderRep] = useState<FounderReputationBreakdown | null>(null);
  const [revenueModelOpen, setRevenueModelOpen] = useState(false);

  const investment = startupId ? myInvestments.find((i) => i.startupId === startupId) : null;

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (!startupId) return;
    api.dealRoom
      .getStartup(startupId, token)
      .then(async (s) => {
        setStartup(s);
        setAccessStatus('approved');
        try {
          const sc = await api.startups.getScore(startupId, token);
          setScore(sc);
        } catch {
          setScore(null);
        }
        const founderId = s.project?.client?.userId;
        if (founderId) {
          try {
            const rep = await api.founders.getReputation(founderId, token);
            setFounderRep(rep);
          } catch {
            setFounderRep(null);
          }
        }
      })
      .catch((e) => {
        // If access denied, try to fetch access status
        if (e instanceof Error && e.message.includes('Deal Room access required')) {
          api.dealRoom
            .accessStatus(startupId, token)
            .then((r) => setAccessStatus(r.status))
            .catch(() => setAccessStatus('none'));
          setStartup(null);
        } else {
          setError(e instanceof Error ? e.message : 'Not found');
        }
      })
      .finally(() => setLoading(false));
  }, [startupId, token, router]);

  useEffect(() => {
    if (!token) return;
    api.dealRoom.listSaved(token).then((ids) => setSavedIds(new Set(ids))).catch(() => {});
    api.investments.list(token).then(setMyInvestments).catch(() => setMyInvestments([]));
  }, [token]);

  useEffect(() => {
    if (!token || !investment?.id) return;
    api.dealRoom.listMessages(investment.id, token).then(setMessages).catch(() => setMessages([]));
  }, [token, investment?.id]);

  async function handleExpressInterest(requestMeeting: boolean) {
    if (!token || !startupId) return;
    setError('');
    try {
      await api.investments.expressInterest({ startupId, requestMeeting }, token);
      setAction(null);
      const list = await api.investments.list(token);
      setMyInvestments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleCommit() {
    if (!token || !startupId) return;
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
      const list = await api.investments.list(token);
      setMyInvestments(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function toggleSave() {
    if (!token || !startupId) return;
    const isSaved = savedIds.has(startupId);
    try {
      if (isSaved) {
        await api.dealRoom.unsave(startupId, token);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(startupId);
          return next;
        });
      } else {
        await api.dealRoom.save(startupId, token);
        setSavedIds((prev) => new Set(prev).add(startupId));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    }
  }

  async function sendMessage() {
    if (!token || !investment?.id || !newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const created = await api.dealRoom.sendMessage(investment.id, newMessage.trim(), token);
      setMessages((prev) => [...prev, created]);
      setNewMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSendingMessage(false);
    }
  }

  if (!token) return null;
  if (loading) {
    return (
      <div className="max-w-4xl">
        {loading ? <p className="text-gray-500">Loading...</p> : error ? (
          <div className="rounded-lg bg-red-50 text-red-700 p-4">
            <p>{error}</p>
            <Link href="/dashboard/investor/deal-room" className="mt-2 inline-block text-primary hover:underline">
              ← Back to Deal Room
            </Link>
          </div>
        ) : accessStatus !== 'approved' ? (
          <div className="rounded-lg bg-amber-50 text-amber-800 p-4 space-y-3">
            <p className="font-medium">
              Deal Room access is {accessStatus === 'none' ? 'not granted yet.' : accessStatus === 'requested' ? 'pending founder approval.' : 'rejected.'}
            </p>
            {(accessStatus === 'none' || accessStatus === 'rejected') && (
              <button
                type="button"
                onClick={async () => {
                  if (!token || !startupId) return;
                  try {
                    const r = await api.dealRoom.requestAccess(startupId, token);
                    setAccessStatus(r.status);
                  } catch {
                    setError('Failed to request access');
                  }
                }}
                className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90"
              >
                Request access
              </button>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard/investor/deal-room" className="text-sm text-primary hover:underline mb-4 inline-block">
          ← Back to Deal Room
        </Link>
        <div className="rounded-lg bg-red-50 text-red-700 p-4">
          <p>{error || 'Startup not found or access not granted.'}</p>
        </div>
      </div>
    );
  }

  const project = startup.project;
  const businessModel = project?.businessModel;
  const milestones = project?.milestones ?? [];
  const files = project?.files ?? [];
  const isSaved = savedIds.has(startup.id);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard/investor/deal-room" className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to Deal Room
      </Link>

      {error && (
        <div className="rounded-lg bg-amber-50 text-amber-800 px-4 py-3 mb-4 flex justify-between items-center">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="text-amber-600 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Platform revenue model — investor-grade transparency */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setRevenueModelOpen((o) => !o)}
          className="flex items-center justify-between w-full rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-left hover:bg-primary/10 transition"
        >
          <span className="font-semibold text-secondary">How our pricing works (platform revenue model)</span>
          <svg
            className={`h-5 w-5 text-gray-500 transition-transform ${revenueModelOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {revenueModelOpen && (
          <div className="mt-2 rounded-xl border border-gray-200 bg-white p-4">
            <RevenueModelSection source="deal_room" sectionTitle="Our Fair Growth-Based Pricing Model" variant="panel" />
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">{project?.projectName ?? 'Startup'}</h1>
          <p className="text-gray-600">
            {project?.client?.businessName} · {project?.client?.industry ?? '—'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {startup.investorReady && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Investor ready
              </span>
            )}
            {founderRep && (
              <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700">
                Founder: {founderRep.level} ({founderRep.total}/100)
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSave}
          className={`rounded-lg border px-4 py-2 text-sm font-medium ${isSaved ? 'border-primary bg-primary/10 text-primary' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
        >
          {isSaved ? 'Saved ★' : 'Save startup ☆'}
        </button>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-secondary mb-2">Pitch summary</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{startup.pitchSummary}</p>
        </section>

        {score && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Startup success score</h2>
            <p className="text-sm text-gray-600 mb-3">
              Overall rating across **Clarity, Market, Execution, Traction, Team, Financials, Investor Readiness**.
            </p>
            <p className="text-3xl font-bold text-primary mb-3">{score.scoreTotal}/100</p>
            {score.breakdown && (
              <dl className="grid gap-2 text-xs text-gray-700 sm:grid-cols-2">
                <div className="flex justify-between">
                  <dt>Clarity</dt>
                  <dd className="font-semibold">{score.breakdown.problemClarity}/10</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Market</dt>
                  <dd className="font-semibold">{score.breakdown.marketSize}/15</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Execution</dt>
                  <dd className="font-semibold">{score.breakdown.businessModel + score.breakdown.feasibility}/30</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Traction</dt>
                  <dd className="font-semibold">{score.breakdown.traction}/15</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Team</dt>
                  <dd className="font-semibold">{score.breakdown.teamStrength}/10</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Financials</dt>
                  <dd className="font-semibold">{score.breakdown.financialLogic}/10</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Investor Readiness</dt>
                  <dd className="font-semibold">{score.breakdown.innovation}/10</dd>
                </div>
              </dl>
            )}
            {score.suggestions && score.suggestions.length > 0 && (
              <ul className="mt-3 list-disc list-inside text-sm text-gray-700">
                {score.suggestions.slice(0, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            )}
          </section>
        )}

        {project?.problemStatement && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Problem</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.problemStatement}</p>
          </section>
        )}

        {businessModel?.valueProposition && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Solution / Value proposition</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{businessModel.valueProposition}</p>
          </section>
        )}

        {(project?.targetMarket || businessModel?.customerSegments) && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Market</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {project?.targetMarket || businessModel?.customerSegments || '—'}
            </p>
          </section>
        )}

        {businessModel?.revenueStreams && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Revenue model</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{businessModel.revenueStreams}</p>
          </section>
        )}

        {startup.tractionMetrics && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Traction</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{startup.tractionMetrics}</p>
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-secondary mb-2">Key metrics</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Funding needed</p>
              <p className="font-semibold text-secondary">{Number(startup.fundingNeeded).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Stage</p>
              <p className="font-medium capitalize">{startup.stage}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Equity offer</p>
              <p className="font-medium">{startup.equityOffer != null ? `${Number(startup.equityOffer)}%` : '—'}</p>
            </div>
          </div>
        </section>

        {milestones.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Milestones</h2>
            <ul className="space-y-2">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-2 text-sm">
                  <span className={`capitalize px-2 py-0.5 rounded text-xs ${m.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {m.status}
                  </span>
                  {m.title}
                  {m.dueDate && <span className="text-gray-500 ml-auto">{new Date(m.dueDate).toLocaleDateString()}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {files.length > 0 && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-2">Documents (read-only)</h2>
            <ul className="space-y-2">
              {files.map((f) => (
                <li key={f.id}>
                  <a href={f.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {f.category || 'File'} →
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-secondary mb-4">Investor actions</h2>
          <div className="flex flex-wrap gap-3">
            {!investment ? (
              <>
                <button
                  type="button"
                  onClick={() => handleExpressInterest(false)}
                  className="rounded-lg bg-primary px-4 py-2 text-white font-medium hover:opacity-90"
                >
                  Express interest
                </button>
                <button
                  type="button"
                  onClick={() => handleExpressInterest(true)}
                  className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
                >
                  Request meeting
                </button>
              </>
            ) : (
              <>
                <span className="rounded-lg bg-green-100 text-green-800 px-4 py-2 text-sm font-medium capitalize">
                  {investment.status.replace('_', ' ')}
                </span>
                {investment.status === 'expressed' && (
                  <button
                    type="button"
                    onClick={() => handleExpressInterest(true)}
                    className="rounded-lg border border-primary px-4 py-2 text-primary font-medium hover:bg-primary/5"
                  >
                    Request meeting
                  </button>
                )}
                {['expressed', 'meeting_requested'].includes(investment.status) && (
                  <button
                    type="button"
                    onClick={() => setAction('commit')}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Commit (amount / equity)
                  </button>
                )}
              </>
            )}
          </div>
          {action === 'commit' && (
            <div className="mt-4 p-4 rounded-lg border border-gray-200 bg-gray-50 space-y-3">
              <input
                type="number"
                placeholder="Amount"
                value={commitAmount}
                onChange={(e) => setCommitAmount(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 w-40"
              />
              <input
                type="number"
                placeholder="Equity %"
                value={commitEquity}
                onChange={(e) => setCommitEquity(e.target.value)}
                className="rounded border border-gray-300 px-3 py-2 w-32"
              />
              <div className="flex gap-2">
                <button type="button" onClick={handleCommit} className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90">
                  Submit
                </button>
                <button type="button" onClick={() => setAction(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>

        {investment && (
          <section className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-secondary mb-4">Ask questions (Investor ↔ Founder)</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500">No messages yet. Start the conversation.</p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.senderId ? '' : ''}`}>
                    <div className="rounded-lg px-3 py-2 bg-gray-100 max-w-[80%]">
                      <p className="text-xs text-gray-500 font-medium">{m.sender?.name ?? 'User'}</p>
                      <p className="text-gray-800 text-sm whitespace-pre-wrap">{m.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={sendMessage}
                disabled={!newMessage.trim() || sendingMessage}
                className="rounded-lg bg-primary px-4 py-2 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {sendingMessage ? 'Sending...' : 'Send'}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
