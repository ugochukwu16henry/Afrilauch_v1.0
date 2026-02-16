'use client';

import { useEffect, useRef, useState } from 'react';
import { useCMSPage } from '@/hooks/useCMS';
import { api, getStoredToken } from '@/lib/api';

export type RevenueModelSource = 'homepage' | 'pricing' | 'onboarding' | 'dashboard' | 'deal_room';

export interface RevenueModelSectionContent {
  title?: string;
  intro?: string;
  sections?: Array<{ title: string; body: string }>;
  summaryTitle?: string;
  summaryBullets?: string[];
  revenueStreams?: string[];
  marketPositioning?: string;
  strategicAdvantageTitle?: string;
  strategicAdvantage?: string[];
}

export interface RevenueModelContent {
  visible?: boolean;
  title?: string;
  intro?: string;
  sections?: Array<{ title: string; body: string }>;
  summaryBullets?: string[];
  revenueStreams?: string[];
  marketPositioning?: string;
  /** Landing page version (conversion-focused) */
  landing?: RevenueModelSectionContent;
  /** Investor version (professional + strategic) */
  investor?: RevenueModelSectionContent;
}

interface RevenueModelSectionProps {
  source: RevenueModelSource;
  /** Section heading when embedded (e.g. "How Our Pricing Works", "Platform Cost Structure") */
  sectionTitle?: string;
  /** Compact layout for panels / onboarding */
  variant?: 'full' | 'compact' | 'panel';
  className?: string;
}

const SECTION_ICONS_LANDING: Record<number, string> = {
  0: '🚀',
  1: '📈',
  2: '🌍',
};
const SECTION_ICONS_INVESTOR: Record<number, string> = {
  0: '▸',
  1: '▸',
  2: '▸',
  3: '▸',
  4: '▸',
};
const SECTION_ICONS_LEGACY: Record<number, string> = {
  0: '💰',
  1: '🚀',
  2: '📈',
  3: '🔄',
  4: '✓',
  5: '🎯',
};

function CheckIcon() {
  return (
    <svg className="h-5 w-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

export function RevenueModelSection({
  source,
  sectionTitle,
  variant = 'full',
  className = '',
}: RevenueModelSectionProps) {
  const { contents, loading, error } = useCMSPage('revenue_model');
  const tracked = useRef(false);
  const [expandedId, setExpandedId] = useState<number | null>(variant === 'panel' || variant === 'compact' ? null : 0);

  const data = contents?.revenue_model as RevenueModelContent & { visibility?: Record<string, boolean> } | undefined;
  const visibilityByPlace = data?.visibility;
  const visibleBySource = visibilityByPlace && source in visibilityByPlace ? visibilityByPlace[source] : undefined;
  const visible = visibleBySource !== undefined ? visibleBySource : (data?.visible === true);

  // Pick content: deal_room → investor; else → landing; fallback → legacy top-level
  const isInvestorSource = source === 'deal_room';
  const resolved: RevenueModelSectionContent = isInvestorSource && data?.investor
    ? data.investor
    : data?.landing
      ? data.landing
      : {
          title: data?.title,
          intro: data?.intro,
          sections: data?.sections,
          summaryBullets: data?.summaryBullets,
          revenueStreams: data?.revenueStreams,
          marketPositioning: data?.marketPositioning,
        };

  const title = resolved?.title ?? data?.title ?? 'Our Fair Growth-Based Pricing Model';
  const intro = resolved?.intro ?? data?.intro ?? '';
  const sections = Array.isArray(resolved?.sections) ? resolved.sections : Array.isArray(data?.sections) ? data.sections : [];
  const summaryTitle = resolved?.summaryTitle ?? (isInvestorSource ? 'Strategic Advantage' : 'Fairness & trust');
  const summaryBullets = Array.isArray(resolved?.summaryBullets) ? resolved.summaryBullets : Array.isArray(data?.summaryBullets) ? data.summaryBullets : [];
  const revenueStreams = Array.isArray(resolved?.revenueStreams) ? resolved.revenueStreams : Array.isArray(data?.revenueStreams) ? data.revenueStreams : [];
  const marketPositioning = resolved?.marketPositioning ?? data?.marketPositioning ?? '';
  const strategicAdvantage = Array.isArray((resolved as RevenueModelSectionContent & { strategicAdvantage?: string[] })?.strategicAdvantage)
    ? (resolved as RevenueModelSectionContent & { strategicAdvantage?: string[] }).strategicAdvantage
    : [];
  const strategicAdvantageTitle = (resolved as RevenueModelSectionContent & { strategicAdvantageTitle?: string })?.strategicAdvantageTitle ?? 'Strategic Advantage';

  const iconMap = data?.investor && isInvestorSource ? SECTION_ICONS_INVESTOR : data?.landing && !isInvestorSource ? SECTION_ICONS_LANDING : SECTION_ICONS_LEGACY;

  useEffect(() => {
    if (!visible || tracked.current) return;
    tracked.current = true;
    const token = getStoredToken();
    api.cms.trackRevenueModelView(source, token).catch(() => {});
  }, [source, visible]);

  if (loading || error || !visible) return null;

  const heading = sectionTitle ?? title;
  const isCompact = variant === 'compact' || variant === 'panel';
  const isPanel = variant === 'panel';
  const showStrategicBox = isInvestorSource && (strategicAdvantage?.length ?? 0) > 0;
  const showSummaryBox = summaryBullets.length > 0 && !showStrategicBox;
  const showSummaryBoxInvestor = showStrategicBox;

  return (
    <div className={className}>
      <div className={isPanel ? 'rounded-xl border border-gray-200 bg-white p-5' : ''}>
        <h2 className="text-xl font-bold text-secondary mb-2 sm:text-2xl">
          {heading}
        </h2>
        {intro && (
          <p className="text-gray-600 mb-6 max-w-3xl whitespace-pre-wrap">
            {intro}
          </p>
        )}

        {sections.length > 0 && (
          <div className="space-y-3">
            {sections.map((section, idx) => {
              const id = idx;
              const isExpanded = expandedId === id;
              const icon = iconMap[idx] ?? '•';
              return (
                <div
                  key={id}
                  className="rounded-xl border border-gray-200/80 bg-gray-50/50 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-100/70 transition sm:py-4"
                    aria-expanded={isExpanded}
                    title="Learn more"
                  >
                    <span className="text-xl flex-shrink-0 w-8 text-left" aria-hidden>{icon}</span>
                    <span className="font-semibold text-secondary flex-1">{section.title}</span>
                    <span className="text-gray-400 flex-shrink-0">
                      <svg
                        className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                    aria-hidden={!isExpanded}
                  >
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-gray-700 text-sm sm:text-base pl-9 whitespace-pre-wrap">
                        {section.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showSummaryBox && (
          <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/60 p-4 sm:p-5">
            <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
              <CheckIcon />
              {resolved?.summaryTitle ?? summaryTitle}
            </h3>
            <ul className="space-y-2">
              {summaryBullets.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
                  <CheckIcon />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {showStrategicBox && (
          <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
            <h3 className="font-semibold text-secondary mb-3">{strategicAdvantageTitle}</h3>
            <p className="text-sm text-gray-600 mb-3">This structure:</p>
            <ul className="space-y-2">
              {(strategicAdvantage ?? []).map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                  <CheckIcon />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {revenueStreams.length > 0 && !isInvestorSource && (
          <div className="mt-6 rounded-xl border-2 border-primary/20 bg-primary/5 p-4 sm:p-5">
            <h3 className="font-semibold text-secondary mb-3">We earn through</h3>
            <ul className="space-y-2">
              {revenueStreams.map((stream, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700 text-sm sm:text-base">
                  <CheckIcon />
                  <span>{stream}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {marketPositioning && !isCompact && (
          <p className="mt-6 text-gray-600 text-sm sm:text-base italic border-l-4 border-primary/40 pl-4">
            {marketPositioning}
          </p>
        )}
      </div>
    </div>
  );
}
