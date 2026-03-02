'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type PricingConfig } from '@/lib/api';

const IDEA_STARTER_FEATURES = [
  'Idea evaluation',
  'Business structuring session',
  'Basic roadmap',
];

const PLANS = [
  {
    id: 'idea-starter' as const,
    name: 'Idea Starter',
    priceLabel: 'Setup Fee', // rendered with config amount
    priceNote: 'One-time',
    features: IDEA_STARTER_FEATURES,
    cta: 'Get started',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Startup Builder',
    price: 'Starting from $1,000',
    priceNote: 'Milestone-based',
    features: [
      'Website or MVP build',
      'Client dashboard',
      'Branding setup',
      'Marketing starter',
    ],
    cta: 'Get my proposal',
    href: '/register',
    highlighted: true,
  },
  {
    name: 'Growth Engine',
    price: 'Custom',
    priceNote: 'Tailored to your scope',
    features: [
      'Full app/software',
      'Marketing campaigns',
      'Analytics dashboard',
      'AI growth insights',
    ],
    cta: 'Get my proposal',
    href: '/register',
    highlighted: false,
  },
  {
    name: 'Venture Partner',
    price: 'Custom',
    priceNote: 'Equity-friendly options',
    features: [
      'Full build',
      'Growth marketing',
      'Investor readiness',
      'Ongoing support',
      'Possible equity model',
    ],
    cta: "Let's talk",
    href: '/register',
    highlighted: false,
  },
];

const SETUP_FEE_NOTE = 'This setup fee unlocks your startup journey and platform access.';
const ADVANCED_SERVICES_TOOLTIP = 'Advanced development and growth services are priced separately based on scope.';

export function PricingPlans() {
  const [config, setConfig] = useState<PricingConfig | null>(null);

  useEffect(() => {
    api.setupFee
      .config()
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const ideaStarterFeeUsd = config?.ideaStarterSetupFeeUsd ?? 7;

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {PLANS.map((plan, i) => {
        const isIdeaStarter = 'id' in plan && plan.id === 'idea-starter';
        const priceDisplay = isIdeaStarter
          ? `Setup Fee: $${ideaStarterFeeUsd}`
          : 'price' in plan
            ? plan.price
            : '';
        const priceNote = isIdeaStarter ? plan.priceNote : 'priceNote' in plan ? plan.priceNote : '';
        const features = isIdeaStarter ? plan.features : plan.features;

        return (
          <div
            key={i}
            className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md ${
              plan.highlighted
                ? 'border-primary ring-2 ring-primary/20'
                : 'border-gray-200/80 hover:border-primary/20'
            }`}
          >
            {plan.highlighted && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-white">
                Popular
              </span>
            )}
            <h3 className="text-lg font-bold text-text-dark">{plan.name}</h3>
            <div className="mt-2">
              <p className="text-2xl font-bold text-primary">
                {priceDisplay}
                {isIdeaStarter && (
                  <span
                    className="ml-1.5 inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-gray-400 text-gray-500 hover:border-primary hover:text-primary"
                    title={ADVANCED_SERVICES_TOOLTIP}
                    aria-label={ADVANCED_SERVICES_TOOLTIP}
                  >
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">{priceNote}</p>
              {isIdeaStarter && (
                <p className="mt-2 text-xs text-gray-600 leading-snug">{SETUP_FEE_NOTE}</p>
              )}
            </div>
            <ul className="mt-6 flex-1 space-y-3">
              {features.map((f, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-0.5 shrink-0 text-primary">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-semibold transition ${
                plan.highlighted
                  ? 'bg-primary text-white hover:opacity-90'
                  : 'border-2 border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
