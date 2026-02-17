import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

interface AIPowerProps {
  content: HomePageContent['aiPower'];
}

export function AIPower({ content }: AIPowerProps) {
  return (
    <Section id="ai-power" variant="dark">
      {/* Badge */}
      <div className="flex justify-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/20 border border-primary/30 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          AI-POWERED PLATFORM
        </span>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          {/* CMS-EDITABLE: aiPower.title, aiPower.body */}
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {content.title}
          </h2>
          <p className="mt-6 text-xl text-white/90 leading-relaxed">
            {content.body}
          </p>
        </div>
        <ul className="space-y-3">
          {content.features.map((item, i) => (
            <li key={i} className="group flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-4 text-white backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/15 hover:border-primary/40 hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-primary/30 transition-all duration-300">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {/* CMS-EDITABLE: aiPower.features[] */}
              <span className="font-semibold text-lg">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
