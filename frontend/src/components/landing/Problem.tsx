import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

const PROBLEM_ICONS = [
  <svg key="1" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>,
  <svg key="2" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
  </svg>,
  <svg key="3" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 011.414-2.17l2.307-2.307M2.25 18l-1.586-7.586a2.25 2.25 0 01.434-1.756L9 11.25l4.306 4.307M18 15l-1.5-1.5M18 15l-3-3m0 0l-3 3m3-3h6" />
  </svg>,
];

interface ProblemProps {
  content: HomePageContent['problem'];
}

export function Problem({ content }: ProblemProps) {
  return (
    <Section id="problem" variant="muted">
      <div className="text-center">
        {/* CMS-EDITABLE: problem.title */}
        <div className="inline-flex items-center gap-2 rounded-full bg-red-50 border border-red-100 px-4 py-2 mb-4">
          <span className="text-sm font-semibold text-red-600 uppercase tracking-wide">The Challenge</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
          {content.title}
        </h2>
        {/* CMS-EDITABLE: problem.subtext */}
        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 leading-relaxed">
          {content.subtext}
        </p>
      </div>
      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {content.items.map((item, i) => (
          <div
            key={i}
            className="group relative rounded-2xl border border-gray-200/80 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-primary/30 hover:-translate-y-1"
          >
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:from-primary/20 group-hover:to-primary/10">
                {PROBLEM_ICONS[i] ?? PROBLEM_ICONS[0]}
              </div>
              {/* CMS-EDITABLE: problem.items[].title, problem.items[].description */}
              <h3 className="mt-6 text-xl font-semibold text-text-dark group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="mt-3 text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
