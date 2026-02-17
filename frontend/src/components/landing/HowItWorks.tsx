import { Section } from './Section';
import Link from 'next/link';
import type { HomePageContent } from '@/data/pageContent';

interface HowItWorksProps {
  content: HomePageContent['howItWorks'];
}

export function HowItWorks({ content }: HowItWorksProps) {
  return (
    <Section id="how-it-works" variant="muted">
      <div className="text-center">
        {/* CMS-EDITABLE: howItWorks.title, howItWorks.subtext */}
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 border border-secondary/20 px-4 py-2 mb-4">
          <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-secondary uppercase tracking-wide">Step by Step</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 leading-relaxed">
          {content.subtext}
        </p>
      </div>
      <div className="mt-16 relative">
        {/* Connection line for desktop */}
        <div className="hidden lg:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {content.steps.map((step, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-2"
            >
              {/* Gradient background on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative">
                {/* Step number with gradient */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-xl font-bold text-white shadow-lg shadow-primary/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/40">
                  {step.num}
                </div>
                {/* CMS-EDITABLE: howItWorks.steps[].title, howItWorks.steps[].desc */}
                <h3 className="mt-6 text-lg font-bold text-text-dark group-hover:text-primary transition-colors">{step.title}</h3>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
              
              {/* Arrow connector */}
              {i < content.steps.length - 1 && (
                <div className="absolute -right-4 top-10 hidden lg:block z-10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
        >
          {/* CMS-EDITABLE: howItWorks.ctaText */}
          <span>{content.ctaText}</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </Section>
  );
}
