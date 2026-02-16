'use client';

import { useState, useEffect } from 'react';
import {
  getStoredToken,
  api,
  type AIStartupCofounderResponse,
  type AIBusinessPlanResponse,
  type AIMarketAnalysisResponse,
  type AIRiskAnalysisResponse,
  type AIIdeaChatResponse,
  type AISmartMilestonesResponse,
} from '@/lib/api';

type Tab = 'chat' | 'ai-cofounder' | 'cofounder' | 'business-plan' | 'market' | 'risk' | 'milestones';

const TABS: { id: Tab; label: string }[] = [
  { id: 'chat', label: 'Idea validation' },
  { id: 'ai-cofounder', label: 'AI Co-Founder' },
  { id: 'cofounder', label: 'Cofounder fit' },
  { id: 'business-plan', label: 'Business plan' },
  { id: 'market', label: 'Market insights' },
  { id: 'risk', label: 'Risk & investor readiness' },
  { id: 'milestones', label: 'Smart milestones' },
];

export default function MentorPage() {
  const [tab, setTab] = useState<Tab>('chat');
  const [error, setError] = useState<string | null>(null);

  // Idea validation chat
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Cofounder
  const [cofounderIdea, setCofounderIdea] = useState('');
  const [cofounderRole, setCofounderRole] = useState('founder');
  const [cofounderResult, setCofounderResult] = useState<AIStartupCofounderResponse | null>(null);
  const [cofounderLoading, setCofounderLoading] = useState(false);

  // Business plan
  const [bpIdea, setBpIdea] = useState('');
  const [bpIndustry, setBpIndustry] = useState('');
  const [bpTargetMarket, setBpTargetMarket] = useState('');
  const [bpResult, setBpResult] = useState<AIBusinessPlanResponse | null>(null);
  const [bpLoading, setBpLoading] = useState(false);

  // Market analysis
  const [marketIdea, setMarketIdea] = useState('');
  const [marketRegion, setMarketRegion] = useState('Global');
  const [marketIndustry, setMarketIndustry] = useState('');
  const [marketResult, setMarketResult] = useState<AIMarketAnalysisResponse | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Risk & investor readiness
  const [riskIdea, setRiskIdea] = useState('');
  const [riskStage, setRiskStage] = useState('idea');
  const [riskResult, setRiskResult] = useState<AIRiskAnalysisResponse | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);

  // Smart milestones
  const [msIdea, setMsIdea] = useState('');
  const [msWeeks, setMsWeeks] = useState(24);
  const [msResult, setMsResult] = useState<AISmartMilestonesResponse | null>(null);
  const [msLoading, setMsLoading] = useState(false);

  // AI Co-Founder tab
  const [cfIdea, setCfIdea] = useState('');
  const [cfIndustry, setCfIndustry] = useState('');
  const [cfCountry, setCfCountry] = useState('');
  const [cfOutput, setCfOutput] = useState<Record<string, unknown> | null>(null);
  const [cfLoading, setCfLoading] = useState(false);
  const [cfModule, setCfModule] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  // Load persistent chat on mount
  useEffect(() => {
    if (!token || tab !== 'chat') return;
    api.ai.conversations(token).then((r) => {
      setChatMessages(
        (r.messages || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.message }))
      );
    }).catch(() => {});
  }, [token, tab]);

  function handleSendChat() {
    if (!chatInput.trim() || !token) return;
    const userMsg = { role: 'user' as const, content: chatInput.trim() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setError(null);
    api.ai
      .sendConversation({ message: userMsg.content }, token)
      .then((res) => {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
      })
      .catch((e) => setError(e?.message ?? 'Chat failed'))
      .finally(() => setChatLoading(false));
  }

  function handleCofounder() {
    if (!cofounderIdea.trim() || !token) return;
    setCofounderLoading(true);
    setError(null);
    api.ai
      .startupCofounder({ idea: cofounderIdea.trim(), currentRole: cofounderRole }, token)
      .then(setCofounderResult)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setCofounderLoading(false));
  }

  function handleBusinessPlan() {
    if (!bpIdea.trim() || !token) return;
    setBpLoading(true);
    setError(null);
    api.ai
      .businessPlan({
        idea: bpIdea.trim(),
        industry: bpIndustry || undefined,
        targetMarket: bpTargetMarket || undefined,
      }, token)
      .then(setBpResult)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setBpLoading(false));
  }

  function handleMarket() {
    if (!marketIdea.trim() || !token) return;
    setMarketLoading(true);
    setError(null);
    api.ai
      .marketAnalysis({
        idea: marketIdea.trim(),
        region: marketRegion || undefined,
        industry: marketIndustry || undefined,
      }, token)
      .then(setMarketResult)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setMarketLoading(false));
  }

  function handleRisk() {
    if (!riskIdea.trim() || !token) return;
    setRiskLoading(true);
    setError(null);
    api.ai
      .riskAnalysis({ idea: riskIdea.trim(), stage: riskStage }, token)
      .then(setRiskResult)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setRiskLoading(false));
  }

  function handleMilestones() {
    if (!token) return;
    setMsLoading(true);
    setError(null);
    api.ai
      .smartMilestones({ ideaSummary: msIdea.trim() || undefined, horizonWeeks: msWeeks }, token)
      .then(setMsResult)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setMsLoading(false));
  }

  const cfBody = () => ({ idea: cfIdea.trim(), industry: cfIndustry || undefined, country: cfCountry || undefined });
  function runCofounderModule(
    name: string,
    fn: () => Promise<Record<string, unknown>>
  ) {
    if (!cfIdea.trim() || !token) return;
    setCfLoading(true);
    setError(null);
    setCfModule(name);
    fn()
      .then(setCfOutput)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setCfLoading(false));
  }
  function handleFullBusinessPlan() {
    if (!cfIdea.trim() || !token) return;
    setCfLoading(true);
    setError(null);
    setCfModule('full-business-plan');
    api.ai
      .fullBusinessPlan(cfBody(), token)
      .then(setCfOutput)
      .catch((e) => setError(e?.message ?? 'Request failed'))
      .finally(() => setCfLoading(false));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Startup Mentor</h1>
        <p className="text-gray-600 mt-1">Idea validation, business plans, market insights, and investor readiness.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      {/* Idea validation chat */}
      {tab === 'chat' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Idea validation chat</h2>
          <p className="text-sm text-gray-600 mb-4">Describe your idea and get focused feedback.</p>
          <div className="border border-gray-200 rounded-lg min-h-[200px] max-h-[320px] overflow-y-auto p-3 space-y-3 mb-4 bg-gray-50/50">
            {chatMessages.length === 0 && (
              <p className="text-gray-500 text-sm">Send a message to start. Ask about market, investors, or next steps.</p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <span
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <span className="rounded-lg px-3 py-2 text-sm bg-white border border-gray-200 text-gray-500">
                  Thinking…
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
              placeholder="Your idea or question…"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <button
              type="button"
              onClick={handleSendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* AI Co-Founder: modules + full business plan */}
      {tab === 'ai-cofounder' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Co-Founder</h2>
            <p className="text-sm text-gray-600 mt-1">Turn your idea into a structured plan. Free: Idea Clarifier, Business Model, Roadmap. Paid: Pricing, Marketing, Pitch, Risk.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your idea</label>
              <textarea
                value={cfIdea}
                onChange={(e) => setCfIdea(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Describe your startup idea…"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Context (optional)</label>
              <input
                type="text"
                value={cfIndustry}
                onChange={(e) => setCfIndustry(e.target.value)}
                placeholder="Industry"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={cfCountry}
                onChange={(e) => setCfCountry(e.target.value)}
                placeholder="Country / region"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Generate section</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => runCofounderModule('idea_clarified', () => api.ai.ideaClarify(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50">Idea Clarifier</button>
              <button type="button" onClick={() => runCofounderModule('business_model', () => api.ai.businessModel(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50">Business Model</button>
              <button type="button" onClick={() => runCofounderModule('roadmap', () => api.ai.roadmap(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 disabled:opacity-50">Roadmap</button>
              <button type="button" onClick={() => runCofounderModule('pricing', () => api.ai.cofounderPricing(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50" title="Paid">Pricing <span className="text-xs">🔒</span></button>
              <button type="button" onClick={() => runCofounderModule('marketing', () => api.ai.cofounderMarketing(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50" title="Paid">Marketing <span className="text-xs">🔒</span></button>
              <button type="button" onClick={() => runCofounderModule('pitch', () => api.ai.cofounderPitch(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50" title="Paid">Pitch <span className="text-xs">🔒</span></button>
              <button type="button" onClick={() => runCofounderModule('risk_analysis', () => api.ai.cofounderRiskAnalysis(cfBody(), token!))} disabled={cfLoading || !cfIdea.trim()} className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50" title="Paid">Risk <span className="text-xs">🔒</span></button>
            </div>
            <button type="button" onClick={handleFullBusinessPlan} disabled={cfLoading || !cfIdea.trim()} className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">Generate full business plan</button>
          </div>
          {cfOutput && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">{cfModule === 'full-business-plan' ? 'Full plan' : cfModule}</p>
              <pre className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm overflow-auto max-h-[400px] whitespace-pre-wrap">
                {JSON.stringify(cfOutput, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Cofounder fit */}
      {tab === 'cofounder' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Startup cofounder fit</h2>
          <p className="text-sm text-gray-600 mb-4">Get suggestions on the ideal cofounder profile and role fit.</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your idea</label>
              <textarea
                value={cofounderIdea}
                onChange={(e) => setCofounderIdea(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Brief description of your startup idea…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your role</label>
              <input
                type="text"
                value={cofounderRole}
                onChange={(e) => setCofounderRole(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. founder, technical founder"
              />
            </div>
            <button
              type="button"
              onClick={handleCofounder}
              disabled={cofounderLoading || !cofounderIdea.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {cofounderLoading ? 'Analyzing…' : 'Get cofounder advice'}
            </button>
          </div>
          {cofounderResult && (
            <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
              <p className="font-medium text-gray-900">Ideal cofounder profile</p>
              <ul className="list-disc list-inside text-gray-700">{cofounderResult.idealCofounderProfile.map((r, i) => <li key={i}>{r}</li>)}</ul>
              <p className="font-medium text-gray-900">Role fit</p>
              <p className="text-gray-700">You: {cofounderResult.roleFit.yourRole} → Complement: {cofounderResult.roleFit.suggestedComplement}</p>
              <p className="font-medium text-gray-900">Traits to look for</p>
              <ul className="list-disc list-inside text-gray-700">{cofounderResult.traitsToLookFor.map((t, i) => <li key={i}>{t}</li>)}</ul>
              <p className="font-medium text-gray-900">Red flags</p>
              <ul className="list-disc list-inside text-gray-700">{cofounderResult.redFlags.map((r, i) => <li key={i}>{r}</li>)}</ul>
              <p className="text-gray-600 italic">{cofounderResult.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Business plan */}
      {tab === 'business-plan' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Business plan generation</h2>
          <p className="text-sm text-gray-600 mb-4">Generate a structured business plan outline.</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idea</label>
              <textarea
                value={bpIdea}
                onChange={(e) => setBpIdea(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="What problem are you solving?"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={bpIndustry}
                  onChange={(e) => setBpIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Technology"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target market</label>
                <input
                  type="text"
                  value={bpTargetMarket}
                  onChange={(e) => setBpTargetMarket(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. SMBs"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleBusinessPlan}
              disabled={bpLoading || !bpIdea.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {bpLoading ? 'Generating…' : 'Generate business plan'}
            </button>
          </div>
          {bpResult && (
            <div className="border-t border-gray-200 pt-4 space-y-4 text-sm">
              <Section title="Executive summary" content={bpResult.executiveSummary} />
              <Section title="Problem" content={bpResult.problemStatement} />
              <Section title="Solution" content={bpResult.solution} />
              <div>
                <p className="font-medium text-gray-900 mb-1">Market opportunity</p>
                <p className="text-gray-700">{bpResult.marketOpportunity.size}</p>
                <ul className="list-disc list-inside text-gray-700 mt-1">{bpResult.marketOpportunity.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Business model</p>
                <p className="text-gray-700">Revenue: {bpResult.businessModel.revenue}. Pricing: {bpResult.businessModel.pricing}. Unit economics: {bpResult.businessModel.unitEconomics}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Go to market</p>
                <ul className="list-disc list-inside text-gray-700">{bpResult.goToMarket.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </div>
              <p className="text-gray-600 italic">{bpResult.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Market insights */}
      {tab === 'market' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Market analysis</h2>
          <p className="text-sm text-gray-600 mb-4">Get market size, trends, competitors, and opportunities.</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idea</label>
              <textarea
                value={marketIdea}
                onChange={(e) => setMarketIdea(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Your product or service…"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  type="text"
                  value={marketRegion}
                  onChange={(e) => setMarketRegion(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Global"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={marketIndustry}
                  onChange={(e) => setMarketIndustry(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Fintech"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleMarket}
              disabled={marketLoading || !marketIdea.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {marketLoading ? 'Analyzing…' : 'Get market insights'}
            </button>
          </div>
          {marketResult && (
            <div className="border-t border-gray-200 pt-4 space-y-4 text-sm">
              <div>
                <p className="font-medium text-gray-900 mb-1">Market size</p>
                <p className="text-gray-700">TAM: {marketResult.marketSize.tam}. SAM: {marketResult.marketSize.sam}. SOM: {marketResult.marketSize.som}</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Trends</p>
                <ul className="list-disc list-inside text-gray-700">{marketResult.trends.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Competitors</p>
                <ul className="list-disc list-inside text-gray-700">{marketResult.competitors.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Opportunities</p>
                <ul className="list-disc list-inside text-gray-700">{marketResult.opportunities.map((o, i) => <li key={i}>{o}</li>)}</ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Threats</p>
                <ul className="list-disc list-inside text-gray-700">{marketResult.threats.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </div>
              <p className="text-gray-600 italic">{marketResult.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Risk & investor readiness */}
      {tab === 'risk' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Risk analysis & investor readiness</h2>
          <p className="text-sm text-gray-600 mb-4">Get risks, mitigations, and an investor readiness score.</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idea or venture summary</label>
              <textarea
                value={riskIdea}
                onChange={(e) => setRiskIdea(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Brief description…"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={riskStage}
                onChange={(e) => setRiskStage(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="idea">Idea</option>
                <option value="mvp">MVP</option>
                <option value="traction">Traction</option>
                <option value="growth">Growth</option>
              </select>
            </div>
            <button
              type="button"
              onClick={handleRisk}
              disabled={riskLoading || !riskIdea.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {riskLoading ? 'Analyzing…' : 'Get risk & readiness'}
            </button>
          </div>
          {riskResult && (
            <div className="border-t border-gray-200 pt-4 space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-primary/10 text-primary font-bold text-2xl w-16 h-16 flex items-center justify-center">
                  {riskResult.investorReadinessScore}
                </div>
                <div>
                  <p className="font-medium text-gray-900">Investor readiness score</p>
                  <p className="text-gray-600">Out of 100</p>
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Score breakdown</p>
                <ul className="space-y-1 text-gray-700">
                  {Object.entries(riskResult.scoreBreakdown).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="capitalize">{k}</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-2">Risks & mitigations</p>
                <ul className="space-y-2">
                  {riskResult.risks.map((r, i) => (
                    <li key={i} className="border-l-2 border-gray-200 pl-3">
                      <span className="font-medium">{r.area}</span> ({r.level}): {r.description} Mitigation: {r.mitigation}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Next steps</p>
                <ul className="list-disc list-inside text-gray-700">{riskResult.nextSteps.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
              <p className="text-gray-600 italic">{riskResult.summary}</p>
            </div>
          )}
        </div>
      )}

      {/* Smart milestones */}
      {tab === 'milestones' && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Smart milestone planning</h2>
          <p className="text-sm text-gray-600 mb-4">Get a suggested milestone roadmap.</p>
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idea summary (optional)</label>
              <textarea
                value={msIdea}
                onChange={(e) => setMsIdea(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Leave blank for a generic plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horizon (weeks)</label>
              <input
                type="number"
                min={4}
                max={52}
                value={msWeeks}
                onChange={(e) => setMsWeeks(Number(e.target.value) || 24)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm max-w-[120px]"
              />
            </div>
            <button
              type="button"
              onClick={handleMilestones}
              disabled={msLoading}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {msLoading ? 'Generating…' : 'Get smart milestones'}
            </button>
          </div>
          {msResult && (
            <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
              <p className="text-gray-600 italic mb-3">{msResult.summary}</p>
              <ul className="space-y-2">
                {msResult.milestones.map((m, i) => (
                  <li key={i} className="flex gap-3 items-start border border-gray-100 rounded-lg p-3">
                    <span className="font-mono text-primary font-medium w-6">{m.order}</span>
                    <div>
                      <p className="font-medium text-gray-900">{m.title}</p>
                      <p className="text-gray-500 text-xs">Phase: {m.phase} · ~{m.suggestedWeeks} weeks · Due by week {m.dueOffsetWeeks}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="font-medium text-gray-900 mb-1">{title}</p>
      <p className="text-gray-700">{content}</p>
    </div>
  );
}
