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
      {/* Animated gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-secondary/10 via-transparent to-transparent" />
      </div>
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 -z-10 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230B3C5D' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="mx-auto max-w-5xl text-center relative z-10">
        {/* Logo with subtle glow */}
        <div className="inline-flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <Image
            src="/RiseFlowHub%20logo.png"
            alt="RiseFlow Hub"
            width={140}
            height={56}
            priority
            className="relative h-14 w-auto object-contain"
          />
        </div>
        {content.tagline && (
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <p className="text-sm font-semibold text-primary tracking-wide">{content.tagline}</p>
          </div>
        )}
        {/* CMS-EDITABLE: hero.headline, hero.headlineHighlight */}
        <h1 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl md:text-6xl lg:text-7xl">
          {content.headline}{' '}
          <span className="bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent">{content.headlineHighlight}</span>
        </h1>
        {/* CMS-EDITABLE: hero.subtext */}
        <p className="mt-8 max-w-3xl mx-auto text-lg text-gray-600 sm:text-xl leading-relaxed">
          {content.subtext}
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* CMS-EDITABLE: hero.ctaPrimary, hero.ctaSecondary */}
          <Link
            href="/submit-idea"
            className="group w-full sm:w-auto rounded-xl bg-gradient-to-r from-primary to-primary/90 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <span>{content.ctaPrimary}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <Link
            href="/dashboard/investor/marketplace"
            className="group w-full sm:w-auto rounded-xl border-2 border-secondary/30 bg-white/80 backdrop-blur-sm px-8 py-4 text-base font-semibold text-secondary hover:bg-white hover:border-secondary/50 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            <span>{content.ctaSecondary}</span>
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
        </div>
        {content.trustLine && (
          <div className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-500 max-w-xl mx-auto">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p>{content.trustLine}</p>
          </div>
        )}
        <div className="mt-8 flex justify-center">
          <ShareButtons title={content.headline} text={content.subtext} />
        </div>
        
        {/* Floating stats badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 shadow-sm">
            <span className="text-2xl">🚀</span>
            <span className="font-semibold text-gray-700">Fast Setup</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 shadow-sm">
            <span className="text-2xl">🤖</span>
            <span className="font-semibold text-gray-700">AI Powered</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 px-4 py-2 shadow-sm">
            <span className="text-2xl">💰</span>
            <span className="font-semibold text-gray-700">Investor Ready</span>
          </div>
        </div>
      </div>
    </section>
  );
}
