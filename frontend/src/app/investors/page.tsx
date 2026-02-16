import Link from 'next/link';
import Image from 'next/image';
import { Nav, Section, Footer } from '@/components/landing';

export const metadata = {
  title: 'For Investors — RiseFlow Hub',
  description:
    'Discover high-potential startups before the market does. Structured, investment-ready deal flow with verified founders and transparent tracking.',
};

const PROBLEM_POINTS = [
  { title: 'Unverified founders', desc: 'No way to validate team or track record.' },
  { title: 'No traction data', desc: 'Ideas without metrics or proof of execution.' },
  { title: 'Poor execution', desc: 'Promises without built product or structure.' },
  { title: 'No transparency', desc: 'Black-box pitches with no visibility into progress.' },
];

const SOLUTION_ITEMS = [
  'Ideas evaluated with AI',
  'Products built by technical teams',
  'Business structure in place',
  'Progress tracked in dashboards',
  'Investor-ready documentation',
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Startups submit ideas', desc: 'Structured intake and AI evaluation.' },
  { step: 2, title: 'Platform builds MVP', desc: 'Technical teams deliver real products.' },
  { step: 3, title: 'Traction & metrics tracked', desc: 'Dashboards and milestones.' },
  { step: 4, title: 'Startups enter marketplace', desc: 'Vetted, investment-ready profiles.' },
  { step: 5, title: 'Investors fund or partner', desc: 'Express interest, commit, or partner.' },
];

const BENEFITS = [
  'Early access to innovation',
  'Reduced risk through structured execution',
  'Transparent project tracking',
  'Direct communication with founders',
];

const OPPORTUNITIES = [
  { title: 'Early-stage MVPs', desc: 'Pre-seed and seed with built product and early traction.' },
  { title: 'Growth-stage startups', desc: 'Scaling ventures with proven unit economics.' },
  { title: 'Tech-enabled SMEs', desc: 'Digitizing traditional businesses with clear upside.' },
  { title: 'Impact-driven ventures', desc: 'Measurable social and environmental impact.' },
];

const TRUST_ITEMS = [
  'Verified startups only',
  'Legal agreements',
  'Secure communication',
  'Admin approval before publishing',
];

export default function InvestorsPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:py-28 md:py-32">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'linear-gradient(165deg, #E8EEF7 0%, #E8F4EE 40%, #F7F9FB 100%)',
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl md:text-6xl">
            Discover High-Potential Startups{' '}
            <span className="text-secondary">Before the Market Does</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 sm:text-xl leading-relaxed">
            Our platform transforms raw ideas into structured, investment-ready startups — and gives you early access.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/dashboard/investor/marketplace"
              className="w-full sm:w-auto rounded-xl bg-secondary px-8 py-3.5 text-base font-semibold text-white shadow-lg hover:opacity-90 transition"
            >
              Explore Startups
            </Link>
            <Link
              href="/register/investor"
              className="w-full sm:w-auto rounded-xl border-2 border-secondary/40 bg-white px-8 py-3.5 text-base font-semibold text-secondary hover:bg-secondary/5 transition"
            >
              Become an Investor
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <Section id="problem" variant="muted">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            Too Many Ideas. Too Little Structure.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Investors face noise: unverified founders, no traction data, poor execution, and no transparency.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEM_POINTS.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-red-200/50"
            >
              <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Solution */}
      <Section id="solution">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            We Deliver Structured, Build-Backed Startups
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Not random pitches — vetted, built, and tracked on one platform.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SOLUTION_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/50 p-5 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="font-medium text-text-dark">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how-it-works" variant="muted">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            From idea to investment in five clear steps.
          </p>
        </div>
        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={i} className="relative">
              <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-secondary/20 hover:shadow-md">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10 text-lg font-bold text-secondary">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-text-dark">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
              {i < HOW_IT_WORKS.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-gray-300 lg:block">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* Investor benefits */}
      <Section id="benefits">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
              Investor Benefits
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Deal flow you can trust — structured, transparent, and execution-backed.
            </p>
          </div>
          <ul className="space-y-4">
            {BENEFITS.map((item, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/50 px-5 py-4 transition hover:border-primary/20 hover:bg-primary/5"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="font-medium text-text-dark">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* Types of opportunities */}
      <Section id="opportunities" variant="muted">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            Types of Opportunities
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Diversify across stages and sectors — all vetted and structured.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {OPPORTUNITIES.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-secondary/20 hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust & security */}
      <Section id="trust" variant="dark">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trust & Security
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/85">
            We don’t publish startups until they’re verified and approved.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-5 py-4 backdrop-blur-sm transition hover:bg-white/15"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </span>
              <span className="font-medium text-white">{item}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section id="cta">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl">
            Join the Investor Network
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Get early access to vetted, structured startups. No random pitches — only deal flow that’s built and tracked.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register/investor"
              className="w-full sm:w-auto rounded-xl bg-secondary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
            >
              Become an Investor
            </Link>
            <Link
              href="/dashboard/investor/marketplace"
              className="w-full sm:w-auto rounded-xl border-2 border-gray-300 bg-white px-8 py-3.5 text-base font-semibold text-gray-700 hover:border-secondary hover:bg-gray-50 transition"
            >
              Explore Marketplace
            </Link>
          </div>
        </div>
      </Section>

      {/* Investor page footer — Marketplace | About | Contact | Legal */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
              <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={28} height={28} className="h-7 w-auto object-contain" />
              <span>RiseFlow Hub</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              <Link href="/dashboard/investor/marketplace" className="text-sm font-medium text-gray-600 hover:text-primary transition">Marketplace</Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-primary transition">About</Link>
              <Link href="/#contact" className="text-sm font-medium text-gray-600 hover:text-primary transition">Contact</Link>
              <Link href="/#" className="text-sm font-medium text-gray-600 hover:text-primary transition">Legal</Link>
            </nav>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} RiseFlow Hub. For investors.
          </p>
        </div>
      </footer>
    </div>
  );
}
