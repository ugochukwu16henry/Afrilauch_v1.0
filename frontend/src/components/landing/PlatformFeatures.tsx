import { Section } from './Section';
import type { HomePageContent } from '@/data/pageContent';

interface PlatformFeaturesProps {
  content: HomePageContent['platformFeatures'];
}

export function PlatformFeatures({ content }: PlatformFeaturesProps) {
  return (
    <Section id="features" variant="muted">
      {/* Badge */}
      <div className="flex justify-center mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 text-sm font-semibold text-primary uppercase tracking-wide">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          PLATFORM FEATURES
        </span>
      </div>

      <div className="text-center">
        {/* CMS-EDITABLE: platformFeatures.title, platformFeatures.subtext */}
        <h2 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl">
          {content.title}
        </h2>
        <p className="mx-auto mt-6 max-w-3xl text-xl text-gray-600 leading-relaxed">
          {content.subtext}
        </p>
      </div>
      <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.features.map((item, i) => (
          <div
            key={i}
            className="group flex items-center gap-4 rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white to-gray-50/30 p-6 shadow-md transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:-translate-y-1"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-md group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            {/* CMS-EDITABLE: platformFeatures.features[] */}
            <span className="font-semibold text-text-dark text-lg">{item}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}
