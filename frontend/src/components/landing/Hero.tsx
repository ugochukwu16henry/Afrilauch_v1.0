import Link from 'next/link';
import Image from 'next/image';
import type { HomePageContent } from '@/data/pageContent';
import { ShareButtons } from '@/components/common/ShareButtons';

interface HeroProps {
  content: HomePageContent['hero'];
}

export function Hero({ content }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Background gradient + subtle grid */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'linear-gradient(165deg, #F7F9FB 0%, #E8F4EE 35%, #D6EBE3 70%, #E8EEF7 100%)',
        }}
      />
      <div
        className="absolute inset-0 -z-10 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230B3C5D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-4xl text-center">
        <Image
          src="/RiseFlowHub%20logo.png"
          alt="RiseFlow Hub"
          width={120}
          height={48}
          priority
          className="mx-auto mb-4 h-12 w-auto object-contain opacity-95"
        />
        {content.tagline && (
          <p className="text-sm font-medium text-primary tracking-wide mb-8">{content.tagline}</p>
        )}
        {/* CMS-EDITABLE: hero.headline, hero.headlineHighlight */}
        <h1 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl md:text-6xl">
          {content.headline}{' '}
          <span className="text-primary">{content.headlineHighlight}</span>
        </h1>
        {/* CMS-EDITABLE: hero.subtext */}
        <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl leading-relaxed">
          {content.subtext}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* CMS-EDITABLE: hero.ctaPrimary, hero.ctaSecondary */}
          <Link
            href="/submit-idea"
            className="w-full sm:w-auto rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            {content.ctaPrimary}
          </Link>
          <Link
            href="/dashboard/investor/marketplace"
            className="w-full sm:w-auto rounded-xl border-2 border-secondary/30 bg-white px-8 py-3.5 text-base font-semibold text-secondary hover:bg-secondary/5 transition focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2"
          >
            {content.ctaSecondary}
          </Link>
        </div>
        {content.trustLine && (
          <p className="mt-6 text-sm text-gray-500 max-w-xl mx-auto">{content.trustLine}</p>
        )}
        <div className="mt-6 flex justify-center">
          <ShareButtons title={content.headline} text={content.subtext} />
        </div>
      </div>
    </section>
  );
}
