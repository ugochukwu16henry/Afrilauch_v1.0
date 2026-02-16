'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function HiringPage() {
  return (
    <div className="min-h-screen bg-background text-text-dark">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
            <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={36} height={36} className="h-9 w-auto object-contain" />
            <span>RiseFlow Hub</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/talent-marketplace" className="text-sm font-medium text-gray-600 hover:text-primary transition">Talent Marketplace</Link>
            <Link href="/partner" className="text-sm font-medium text-gray-600 hover:text-primary transition">Partner With Us</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition">Login</Link>
            <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition">Get Started</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
        <section className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Join Our Team / Showcase Your Skills / Partner With Us
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Be part of a professional talent ecosystem. Get approved, get visible, get hired — or find vetted talent for your projects.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why join the platform?</h2>
          <ul className="grid gap-4 sm:grid-cols-2 text-gray-700">
            <li className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-primary text-xl">✓</span>
              <span>Get verified and visible to hiring companies and founders</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-primary text-xl">✓</span>
              <span>One profile for skills, portfolio, and ratings</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-primary text-xl">✓</span>
              <span>Clear agreements and payment tracking</span>
            </li>
            <li className="flex gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-primary text-xl">✓</span>
              <span>Option to start your own startup from the same account</span>
            </li>
          </ul>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Benefits of the approved talent marketplace</h2>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-6">
            <p className="text-gray-700 mb-4">
              Talents are reviewed by HR and Super Admin. Only approved profiles appear in the marketplace. 
              Hirers pay a one-time platform fee and sign a Fair Treatment Agreement. Everyone gets clear contracts, 
              ratings after projects, and full audit trails for legal oversight.
            </p>
            <p className="text-gray-600 text-sm">
              Talent fee: $7 one-time to showcase. Hirer fee: $20 one-time to hire. All in a secure, professional ecosystem.
            </p>
          </div>
        </section>

        <section className="grid gap-8 sm:grid-cols-2">
          <div className="rounded-2xl border-2 border-primary/20 bg-white p-8 shadow-sm hover:border-primary/40 transition">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Join as Talent</h3>
            <p className="text-gray-600 mb-6">
              Showcase your skills, portfolio, and experience. Submit for approval and appear in the marketplace once approved.
            </p>
            <Link
              href="/register/talent"
              className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
            >
              Join as Talent
            </Link>
          </div>
          <div className="rounded-2xl border-2 border-primary/20 bg-white p-8 shadow-sm hover:border-primary/40 transition">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Hire Talent</h3>
            <p className="text-gray-600 mb-6">
              Browse approved talents, send hire requests, and manage agreements. Pay the platform fee and sign the Fair Treatment Agreement to get started.
            </p>
            <Link
              href="/register/hirer"
              className="inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
            >
              Hire Talent
            </Link>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link href="/talent-marketplace" className="text-primary font-medium hover:underline">
            Browse the Talent Marketplace →
          </Link>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-500">
        <Link href="/" className="hover:text-primary">Home</Link>
        {' · '}
        <Link href="/terms" className="hover:text-primary">Terms</Link>
        {' · '}
        <Link href="/privacy" className="hover:text-primary">Privacy</Link>
      </footer>
    </div>
  );
}
