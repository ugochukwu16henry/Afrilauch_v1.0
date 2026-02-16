import Link from 'next/link';
import { Nav, Section, Footer } from '@/components/landing';

export const metadata = {
  title: 'About Us — RiseFlow Hub',
  description:
    'We exist to ensure brilliant ideas are heard, built, and brought to life. A world where ideas are not allowed to die.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 py-20 sm:py-28 md:py-32">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: 'linear-gradient(165deg, #E8F4EE 0%, #D6EBE3 50%, #E8EEF7 100%)',
          }}
        />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-text-dark sm:text-5xl md:text-6xl">
            A World Where Ideas Are Not Allowed to Die
          </h1>
          <p className="mt-6 text-lg text-gray-600 sm:text-xl leading-relaxed max-w-2xl mx-auto">
            We exist to ensure brilliant ideas are heard, built, and brought to life.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <Section id="story" variant="muted">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            Why We Started
          </h2>
          <div className="mt-6 space-y-6 text-gray-600 leading-relaxed">
            <p>
              Too many life-changing ideas disappear because no one listens, no one believes, or no one has the tools to build them. We saw talented entrepreneurs, creators, and problem-solvers with powerful visions — but without access to technology, structure, and opportunity.
            </p>
            <p>
              We decided to build the system we wished existed. A platform where ideas are taken seriously, shaped into real businesses, and supported from concept to growth.
            </p>
            <p>
              We believe every person has the potential to create impact — they just need the right ecosystem.
            </p>
          </div>
        </div>
      </Section>

      {/* Our Mission */}
      <Section id="mission">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            Our Mission
          </h2>
          <blockquote className="mt-6 text-lg text-gray-600 leading-relaxed sm:text-xl">
            To help entrepreneurs achieve their full potential by transforming ideas into scalable, real-world businesses through technology, structure, and opportunity.
          </blockquote>
        </div>
      </Section>

      {/* What Makes Us Different */}
      <Section id="different" variant="muted">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            What Makes Us Different
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            We don&apos;t just advise — we build, execute, and connect.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'We don\'t just design — we build startups',
            'We don\'t just advise — we execute',
            'We combine AI + human expertise',
            'We connect founders with investors',
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="font-medium text-text-dark leading-snug">{item}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Our Vision */}
      <Section id="vision" variant="dark">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Our Vision
          </h2>
          <blockquote className="mt-6 text-lg text-white/90 leading-relaxed sm:text-xl">
            To become the infrastructure that powers innovation across emerging markets.
          </blockquote>
        </div>
      </Section>

      {/* Who We Serve */}
      <Section id="serve">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            Who We Serve
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Everyone with a vision and the will to build.
          </p>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            'Aspiring entrepreneurs',
            'Small business owners',
            'Innovators with ideas',
            'Investors looking for structured opportunities',
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-gray-200/80 bg-gray-50/50 px-5 py-4 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              <span className="font-medium text-text-dark">{item}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* CTA */}
      <Section variant="muted">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            Launch Your Idea With Us
          </h2>
          <p className="mt-4 text-gray-600">
            Join the ecosystem where ideas become real businesses.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 hover:opacity-90 transition"
          >
            Launch Your Idea With Us
          </Link>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
