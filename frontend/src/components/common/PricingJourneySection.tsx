'use client';

import { useCMSPage } from '@/hooks/useCMS';

export interface PricingJourneyStep {
  stageLabel: string;
  stageTitle: string;
  payLabel: string;
  payValue?: string | null;
  unlocks?: string[];
  tableRows?: Array<{ growthAction?: string; paymentType?: string; whatItCovers?: string; whyNeeded?: string }>;
  options?: string[];
  purpose?: string;
  messageUser?: string;
  messageInvestor?: string;
  note?: string;
  color?: string;
}

export interface PricingJourneyContent {
  visible?: boolean;
  headline?: string;
  subheadline?: string;
  steps?: PricingJourneyStep[];
  revenueTable?: Array<{ revenueType: string; whenItHappens: string }>;
  revenueFlowLabel?: string;
  whyHeadline?: string;
  whyMostSay?: string;
  whyYouSay?: string;
  whyPartnerLabel?: string;
  whyBillLabel?: string;
  diagramHeadline?: string;
  diagramSteps?: string[];
  diagramLabels?: string[];
}

const STEP_COLORS: Record<string, { bg: string; border: string; badge: string }> = {
  green: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-600' },
  yellow: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-500' },
  blue: { bg: 'bg-sky-50', border: 'border-sky-200', badge: 'bg-sky-600' },
  purple: { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-600' },
};

function CheckIcon() {
  return (
    <svg className="h-4 w-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export function PricingJourneySection({
  className = '',
  source,
}: {
  className?: string;
  /** When set, visibility is checked for this place (e.g. homepage, pricing). */
  source?: 'homepage' | 'pricing';
}) {
  const { contents, loading, error } = useCMSPage('revenue_model');
  const data = contents?.pricing_journey as PricingJourneyContent & { visibility?: Record<string, boolean> } | undefined;
  const visibilityByPlace = data?.visibility;
  const visibleBySource = source && visibilityByPlace && source in visibilityByPlace ? visibilityByPlace[source] : undefined;
  const visible = visibleBySource !== undefined ? visibleBySource : (data?.visible === true);
  const headline = data?.headline ?? 'Your Platform Pricing Journey';
  const subheadline = data?.subheadline ?? 'Think of it like a startup growth staircase, not a payment wall.';
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  const revenueTable = Array.isArray(data?.revenueTable) ? data.revenueTable : [];
  const revenueFlowLabel = data?.revenueFlowLabel ?? 'Entry → Progress → Launch → Scale';
  const whyHeadline = data?.whyHeadline ?? 'Why This Model Is Powerful';
  const whyMostSay = data?.whyMostSay ?? 'Pay us every month or lose access.';
  const whyYouSay = data?.whyYouSay ?? 'Grow your business. Pay when there is real value.';
  const whyPartnerLabel = data?.whyPartnerLabel ?? 'A partner';
  const whyBillLabel = data?.whyBillLabel ?? 'Not a bill';
  const diagramHeadline = data?.diagramHeadline ?? 'Simple view:';
  const diagramSteps = Array.isArray(data?.diagramSteps) ? data.diagramSteps : ['Join Platform', 'Build Your Startup', 'Launch Your Product', 'Scale Your Business'];
  const diagramLabels = Array.isArray(data?.diagramLabels) ? data.diagramLabels : ['One-Time Fee', 'Milestone Payments', 'Maintenance', 'Growth Tools'];

  if (loading || error || !visible) return null;

  return (
    <div className={className}>
      <div className="text-center mb-10">
        <h2 className="text-xl font-bold text-secondary sm:text-2xl mb-2">{headline}</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">{subheadline}</p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {steps.map((step, idx) => {
          const colors = STEP_COLORS[step.color ?? 'green'] ?? STEP_COLORS.green;
          const hasTable = step.tableRows && step.tableRows.length > 0;
          const hasUnlocks = step.unlocks && step.unlocks.length > 0;
          const hasOptions = step.options && step.options.length > 0;
          const isStep2 = hasTable && step.tableRows?.some((r) => 'growthAction' in r && r.growthAction);
          const isStep3 = hasTable && step.tableRows?.some((r) => 'whatItCovers' in r && r.whatItCovers);

          return (
            <div
              key={idx}
              className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-5 sm:p-6 overflow-hidden`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white ${colors.badge}`}>
                  {step.stageLabel}
                </span>
                <h3 className="text-lg font-bold text-secondary">{step.stageTitle}</h3>
              </div>

              {step.payLabel && (
                <p className="text-sm font-medium text-gray-700 mb-1">{step.payLabel}</p>
              )}
              {step.payValue && (
                <p className="text-primary font-semibold mb-3">🔹 {step.payValue}</p>
              )}

              {hasUnlocks && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">What they unlock:</p>
                  <ul className="grid gap-1 sm:grid-cols-2">
                    {step.unlocks!.map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckIcon />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {hasTable && (
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden bg-white">
                    <thead>
                      <tr className="bg-gray-100">
                        {isStep2 && (
                          <>
                            <th className="text-left py-2 px-3 font-semibold text-secondary">Growth Action</th>
                            <th className="text-left py-2 px-3 font-semibold text-secondary">Payment Type</th>
                          </>
                        )}
                        {isStep3 && (
                          <>
                            <th className="text-left py-2 px-3 font-semibold text-secondary">What It Covers</th>
                            <th className="text-left py-2 px-3 font-semibold text-secondary">Why It&apos;s Needed</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {step.tableRows!.map((row, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          {isStep2 && (
                            <>
                              <td className="py-2 px-3 text-gray-700">{(row as { growthAction?: string }).growthAction}</td>
                              <td className="py-2 px-3 text-gray-700">{(row as { paymentType?: string }).paymentType}</td>
                            </>
                          )}
                          {isStep3 && (
                            <>
                              <td className="py-2 px-3 text-gray-700">{(row as { whatItCovers?: string }).whatItCovers}</td>
                              <td className="py-2 px-3 text-gray-700">{(row as { whyNeeded?: string }).whyNeeded}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {hasOptions && (
                <ul className="flex flex-wrap gap-2 mb-3">
                  {step.options!.map((opt, i) => (
                    <li key={i} className="inline-flex items-center rounded-full bg-white/80 border border-gray-200 px-3 py-1 text-sm text-gray-700">
                      {opt}
                    </li>
                  ))}
                </ul>
              )}

              {step.messageUser && (
                <p className="text-sm text-gray-700 italic mb-1">💡 Message to users: &ldquo;{step.messageUser}&rdquo;</p>
              )}
              {step.messageInvestor && (
                <p className="text-sm text-gray-600 italic">💡 Message to investors: {step.messageInvestor}</p>
              )}

              {step.purpose && (
                <p className="text-sm text-gray-600 mt-2"><strong>Purpose:</strong> {step.purpose}</p>
              )}
              {step.note && (
                <p className="text-sm text-gray-600 mt-2 italic">{step.note}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* How your company earns */}
      {revenueTable.length > 0 && (
        <div className="mt-10 max-w-2xl mx-auto rounded-xl border-2 border-primary/20 bg-primary/5 p-5 sm:p-6">
          <h3 className="font-bold text-secondary mb-2">💰 How Your Company Earns</h3>
          <p className="text-sm text-gray-600 mb-4">{revenueFlowLabel}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-primary/20">
                  <th className="text-left py-2 font-semibold text-secondary">Revenue Type</th>
                  <th className="text-left py-2 font-semibold text-secondary">When It Happens</th>
                </tr>
              </thead>
              <tbody>
                {revenueTable.map((row, i) => (
                  <tr key={i} className="border-b border-primary/10">
                    <td className="py-2 text-gray-700">{row.revenueType}</td>
                    <td className="py-2 text-gray-700">{row.whenItHappens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Why this model is powerful */}
      <div className="mt-10 max-w-2xl mx-auto rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
        <h3 className="font-bold text-secondary mb-3">🧠 {whyHeadline}</h3>
        <p className="text-sm text-gray-600 mb-2">Most platforms say: &ldquo;{whyMostSay}&rdquo;</p>
        <p className="text-sm font-medium text-gray-800 mb-3">You say: &ldquo;{whyYouSay}&rdquo;</p>
        <p className="text-sm text-gray-700">That positioning makes your platform feel like:</p>
        <ul className="mt-1 space-y-1 text-sm">
          <li className="flex items-center gap-2 text-emerald-700">✅ {whyPartnerLabel}</li>
          <li className="flex items-center gap-2 text-gray-600">❌ {whyBillLabel}</li>
        </ul>
      </div>

      {/* Simple diagram */}
      {diagramSteps.length > 0 && (
        <div className="mt-10 max-w-4xl mx-auto">
          <h3 className="font-bold text-secondary mb-4 text-center">🎯 {diagramHeadline}</h3>
          <div className="flex flex-wrap justify-center items-start gap-1 sm:gap-2">
            {diagramSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-1 sm:gap-2">
                <div className="flex flex-col items-center">
                  <span className="text-center text-sm font-medium text-secondary whitespace-nowrap">{step}</span>
                  {diagramLabels[i] && (
                    <span className="text-xs text-gray-500 mt-0.5">({diagramLabels[i]})</span>
                  )}
                </div>
                {i < diagramSteps.length - 1 && (
                  <span className="text-gray-400 flex-shrink-0" aria-hidden>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
