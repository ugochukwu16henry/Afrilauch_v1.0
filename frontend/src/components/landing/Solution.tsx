import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

const COLUMN_ICONS = [
  <svg key="1" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
  </svg>,
  <svg key="2" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>,
  <svg key="3" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 011.414-2.17l2.307-2.307M2.25 18l-1.586-7.586a2.25 2.25 0 01.434-1.756L9 11.25l4.306 4.307M18 15l-1.5-1.5M18 15l-3-3m0 0l-3 3m3-3h6" />
  </svg>,
];

interface SolutionProps {
  content: HomePageContent['solution'];
}

export function Solution({ content }: SolutionProps) {
  return (
    <Section id="solution">
      <div className="text-center">
        {/* CMS-EDITABLE: solution.title, solution.subtext */}
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-4">
          <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <span className="text-sm font-semibold text-primary uppercase tracking-wide">Our Solution</span>
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-lg text-gray-600 leading-relaxed">
          {content.subtext}
        </p>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {content.columns.map((col, i) => (
          <div
            key={i}
            className="group relative rounded-3xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/50 p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-2"
          >
            {/* Accent corner */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-full" />
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-lg shadow-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/30">
                {COLUMN_ICONS[i] ?? COLUMN_ICONS[0]}
              </div>
              {/* CMS-EDITABLE: solution.columns[].title, solution.columns[].description */}
              <h3 className="mt-8 text-2xl font-bold text-text-dark group-hover:text-primary transition-colors">{col.title}</h3>
              <p className="mt-4 text-gray-600 leading-relaxed">{col.description}</p>
              {/* Hover indicator */}
              <div className="mt-6 flex items-center gap-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-sm font-semibold">Learn more</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
