import { Section } from './Section';
import Link from 'next/link';
import type { HomePageContent } from '@/data/pageContent';

interface ForInvestorsProps {
  content: HomePageContent['forInvestors'];
}

export function ForInvestors({ content }: ForInvestorsProps) {
  return (
    <Section id="investors">
      {/* Badge */}
      <div className="flex justify-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/20 px-4 py-2 text-sm font-semibold text-secondary uppercase tracking-wide">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          FOR INVESTORS
        </span>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          {/* CMS-EDITABLE: forInvestors.title, forInvestors.body */}
          <h2 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-6 text-xl text-gray-600 leading-relaxed">
            {content.body}
          </p>
          <Link
            href="/dashboard/investor/marketplace"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-secondary to-secondary/90 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-secondary/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-secondary/40"
          >
            {/* CMS-EDITABLE: forInvestors.ctaText */}
            {content.ctaText}
            <svg className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
        <div className="relative rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 p-10 shadow-xl">
          {/* Decorative accent */}
          <div className="absolute -top-4 -right-4 h-24 w-24 bg-gradient-to-br from-secondary/10 to-transparent rounded-full" />
          <ul className="space-y-5 text-gray-700 relative">
            {content.bullets.map((bullet, i) => (
              <li key={i} className="flex items-center gap-4 group">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 text-secondary shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {/* CMS-EDITABLE: forInvestors.bullets[] */}
                <span className="text-lg font-medium">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
