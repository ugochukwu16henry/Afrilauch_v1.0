import Link from 'next/link';
import { Nav, Section, Footer } from '@/components/landing';

export const metadata = {
  title: 'Team — RiseFlow Hub',
  description:
    'Meet the venture-building team: leadership, product & tech, startup development, investment, AI & data, and support.',
};

function AvatarPlaceholder({ className = '', size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-14 w-14',
    md: 'h-20 w-20',
    lg: 'h-28 w-28',
  };
  
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-primary ring-2 ring-primary/10 ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      <svg className={iconSizes[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 via-indigo-100/30 to-purple-100/50" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-40" />
        </div>
        
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 px-5 py-2 text-sm font-medium text-primary shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Meet Our Team
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Building the Future
            </span>
            <br />
            <span className="text-gray-900">Together</span>
          </h1>
          
          <p className="mt-6 text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
            The people building startups, systems, and opportunities from the ground up. Passionate innovators dedicated to creating exceptional ventures.
          </p>
        </div>
      </section>

      {/* Founder — featured card */}
      <Section variant="muted">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 backdrop-blur-sm p-8 sm:p-12 shadow-2xl shadow-primary/10">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
            
            <div className="relative flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6">
              <div className="flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 via-primary/20 to-indigo-500/20 text-primary ring-4 ring-primary/10 h-32 w-32 shadow-lg">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-3">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L4 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.733.99A1.002 1.002 0 0118 6v2a1 1 0 11-2 0v-.277l-.254.145a1 1 0 11-.992-1.736l.23-.132-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.58V12a1 1 0 11-2 0v-1.42l-1.246-.712a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.42l1.246.712a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.42V12a1 1 0 011-1zm-9.618 5.504a1 1 0 011.364-.372l.254.145V16a1 1 0 112 0v.277l.254-.145a1 1 0 11.992 1.736l-1.735.992a.995.995 0 01-.503.135 1 1 0 01-.992-1.36l1.735-.99-.23-.132-.23.132A1 1 0 017.382 16.504z" clipRule="evenodd" />
                  </svg>
                  Leadership
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900">{FOUNDER.name}</h2>
                <p className="mt-2 text-lg font-semibold text-primary">{FOUNDER.title}</p>
                <p className="mt-4 text-gray-600 leading-relaxed">{FOUNDER.description}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Level 1 — Core Founding Team */}
      <Section id="core-team">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Level 1
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Core Founding Team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Leadership across tech, business, marketing, and operations.
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_1.map((role, i) => (
            <div
              key={i}
              className="group relative flex flex-col rounded-2xl border border-gray-200/80 bg-white/80 backdrop-blur-sm p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <AvatarPlaceholder className="mx-auto" size="lg" />
              <h3 className="relative mt-5 text-center font-semibold text-gray-900 leading-snug">{role.title}</h3>
              <p className="relative mt-3 text-center text-sm text-gray-600 leading-relaxed">{role.summary}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 2 — Product & Tech */}
      <Section variant="muted" id="product-tech">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200/50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Level 2
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Product & Technology
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Engineering, design, and quality assurance experts.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_2.map((role, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-400/40"
            >
              <AvatarPlaceholder size="sm" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{role}</h3>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 3 — Startup Building Team */}
      <Section id="startup-team">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 px-4 py-1.5 text-sm font-medium text-purple-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Level 3
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Startup Development Team
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Business, brand, content, and growth specialists.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVEL_3.map((role, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/40"
            >
              <AvatarPlaceholder size="sm" />
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 4 — Investment & Growth */}
      <Section variant="muted" id="investment-growth">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 px-4 py-1.5 text-sm font-medium text-emerald-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Level 4
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Investment & Growth
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Investor relations, partnerships, and fundraising expertise.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LEVEL_4.map((role, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/40"
            >
              <AvatarPlaceholder size="sm" />
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 5 — AI & Data */}
      <Section id="ai-data">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200/50 px-4 py-1.5 text-sm font-medium text-cyan-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            Level 5
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AI & Data
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Machine learning, data analytics, and automation.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {LEVEL_5.map((role, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/40"
            >
              <AvatarPlaceholder size="sm" />
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* Level 6 — Support */}
      <Section variant="muted" id="support">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200/50 px-4 py-1.5 text-sm font-medium text-orange-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Level 6
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Support System
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Customer success, community, and documentation.
          </p>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-3 max-w-4xl mx-auto">
          {LEVEL_6.map((role, i) => (
            <div
              key={i}
              className="group flex items-center gap-4 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-4 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/40"
            >
              <AvatarPlaceholder size="sm" />
              <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{role}</h3>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section variant="dark">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 shadow-2xl">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4wNSIvPjwvZz48L3N2Zz4=')] opacity-30" />
          
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 text-sm font-medium text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Opportunities Available
            </div>
            
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              Join the Team
            </h2>
            
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Early contributors grow into leadership roles as we scale. Build with us and shape the future of venture building.
            </p>
            
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-primary shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Get in Touch
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
