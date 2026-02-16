import Link from 'next/link';
import { Nav, Section, Footer } from '@/components/landing';

export const metadata = {
  title: 'Team — RiseFlow Hub',
  description:
    'Meet the venture-building team: leadership, product & tech, startup development, investment, AI & data, and support.',
};

function AvatarPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary ${className}`}
      aria-hidden
    >
      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    </div>
  );
}

const FOUNDER = {
  name: 'Henry Ugochukwu',
  title: 'Founder / Venture Builder',
  description: 'Vision, tech oversight, partnerships, startup platform architecture',
};

const LEVEL_1 = [
  { title: 'Technical Lead / Full-Stack Developer', summary: 'Platform engineering, architecture, and delivery.' },
  { title: 'Startup Consultant / Business Strategist', summary: 'Strategy, business models, and founder advisory.' },
  { title: 'Operations & Admin Lead', summary: 'Operations, admin, and process.' },
  { title: 'Marketing Lead', summary: 'Brand, growth, and go-to-market.' },
];

const LEVEL_2 = [
  'Frontend Developer',
  'Backend Developer',
  'Mobile App Developer',
  'UI/UX Designer',
  'QA Tester',
  'DevOps / Cloud Engineer',
];

const LEVEL_3 = [
  'Business Analyst',
  'Financial/Startup Planner',
  'Brand Designer',
  'Content Strategist',
  'Growth Marketer',
  'Ads Specialist',
  'SEO Specialist',
];

const LEVEL_4 = [
  'Investor Relations Manager',
  'Partnership Manager',
  'Fundraising Advisor',
  'Legal Advisor',
];

const LEVEL_5 = ['AI/ML Engineer', 'Data Analyst', 'Automation Engineer'];

const LEVEL_6 = ['Customer Support', 'Community Manager', 'Documentation Specialist'];

export default function TeamPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 py-16 sm:py-20">
        <div
          className="absolute inset-0 -z-10 opacity-30"
          style={{ background: 'linear-gradient(165deg, #E8F4EE 0%, #E8EEF7 100%)' }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
            Our Team
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            The people building startups, systems, and opportunities from the ground up.
          </p>
        </div>
      </section>

      {/* Founder — featured card */}
      <Section variant="muted">
        <div className="mx-auto max-w-2xl">
          <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-white p-8 shadow-lg shadow-primary/5 sm:p-10">
            <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/25 to-primary/10 text-primary ring-2 ring-primary/20">
                <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="mt-6 sm:ml-8 sm:mt-0">
                <h2 className="text-2xl font-bold text-secondary">{FOUNDER.name}</h2>
                <p className="mt-1 text-primary font-semibold">{FOUNDER.title}</p>
                <p className="mt-3 text-gray-600">{FOUNDER.description}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Level 1 — Core Founding Team */}
      <Section id="core-team">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          Core Founding Team
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Leadership across tech, business, marketing, and operations.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_1.map((role, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
            >
              <AvatarPlaceholder className="mx-auto h-24 w-24" />
              <h3 className="mt-4 text-center font-semibold text-secondary">{role.title}</h3>
              <p className="mt-2 text-center text-sm text-gray-600">{role.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 2 — Product & Tech */}
      <Section variant="muted" id="product-tech">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          Product & Technology
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Engineering, design, and quality.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_2.map((role, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-primary/20"
            >
              <AvatarPlaceholder className="h-14 w-14" />
              <div>
                <h3 className="font-semibold text-secondary">{role}</h3>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 3 — Startup Building Team */}
      <Section id="startup-team">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          Startup Development Team
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Business, brand, content, and growth.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_3.map((role, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-primary/20"
            >
              <AvatarPlaceholder className="h-14 w-14" />
              <h3 className="font-semibold text-secondary">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 4 — Investment & Growth */}
      <Section variant="muted" id="investment-growth">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          Investment & Growth
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_4.map((role, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-primary/20"
            >
              <AvatarPlaceholder className="h-14 w-14" />
              <h3 className="font-semibold text-secondary">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 5 — AI & Data */}
      <Section id="ai-data">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          AI & Data
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {LEVEL_5.map((role, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-primary/20"
            >
              <AvatarPlaceholder className="h-14 w-14" />
              <h3 className="font-semibold text-secondary">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 6 — Support */}
      <Section variant="muted" id="support">
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
          Support System
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {LEVEL_6.map((role, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white p-4 shadow-sm transition hover:border-primary/20"
            >
              <AvatarPlaceholder className="h-14 w-14" />
              <h3 className="font-semibold text-secondary">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Join the Team
          </h2>
          <p className="mt-4 text-white/85">
            Early contributors grow into leadership roles as we scale. Build with us.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition"
          >
            Get in Touch
          </Link>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
