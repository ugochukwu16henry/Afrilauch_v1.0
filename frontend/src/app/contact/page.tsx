'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Nav, Section } from '@/components/landing';
import { api, type ContactMessageBody } from '@/lib/api';

const CONTACT_CARDS = [
  {
    title: 'Email support',
    desc: 'General questions and support.',
    label: 'support@riseflowhub.com',
    href: 'mailto:support@riseflowhub.com',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: 'Business inquiries',
    desc: 'Projects, proposals, and partnerships.',
    label: 'hello@riseflowhub.com',
    href: 'mailto:hello@riseflowhub.com',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    title: 'Partnerships',
    desc: 'Investors, accelerators, and collaborators.',
    label: 'partners@riseflowhub.com',
    href: 'mailto:partners@riseflowhub.com',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
  },
];

const defaultForm: ContactMessageBody = {
  name: '',
  email: '',
  subject: '',
  message: '',
  phone: '',
};

const FOOTER_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Investors', href: '/investors' },
  { label: 'Terms', href: '#' },
  { label: 'Privacy', href: '#' },
];

export default function ContactPage() {
  const [form, setForm] = useState<ContactMessageBody>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update<K extends keyof ContactMessageBody>(key: K, value: ContactMessageBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.contact.send({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject?.trim() || undefined,
        message: form.message.trim(),
      });
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sending failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">Message sent</h1>
            <p className="mt-4 text-lg text-gray-600">
              Thank you for reaching out. We will get back to you shortly.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
            >
              Back to home
            </Link>
          </div>
        </section>
        <footer className="border-t border-gray-200 bg-white py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm font-medium text-gray-600 hover:text-primary transition">
                  {link.label}
                </Link>
              ))}
            </nav>
            <p className="mt-6 text-center text-sm text-gray-500">© {new Date().getFullYear()} RiseFlow Hub.</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-white px-4 py-16 sm:py-20">
        <div
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background: 'linear-gradient(165deg, #E8F4EE 0%, #E8EEF7 100%)',
          }}
        />
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
            We&apos;d Love to Hear From You
          </h1>
          <p className="mt-6 text-lg text-gray-600 leading-relaxed">
            Have a question, partnership idea, or need support? Reach out.
          </p>
        </div>
      </section>

      {/* Contact info cards */}
      <Section id="contact-info" variant="muted">
        <div className="grid gap-6 sm:grid-cols-3">
          {CONTACT_CARDS.map((card, i) => (
            <a
              key={i}
              href={card.href}
              className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                {card.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-text-dark">{card.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{card.desc}</p>
              <p className="mt-3 text-sm font-medium text-primary">{card.label}</p>
            </a>
          ))}
        </div>
      </Section>

      {/* Quick book */}
      <Section id="quick-book">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-200/80 bg-gray-50/80 p-8 text-center">
          <h2 className="text-xl font-semibold text-text-dark">Prefer to talk?</h2>
          <p className="mt-2 text-gray-600">Book a quick call and we&apos;ll get back to you with a time.</p>
          <Link
            href="/book-consultation"
            className="mt-6 inline-flex rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white hover:opacity-90 transition"
          >
            Book a quick call
          </Link>
        </div>
      </Section>

      {/* Contact form */}
      <Section id="form" variant="muted">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            Send a message
          </h2>
          <p className="mt-2 text-gray-600">
            Fill out the form below and we&apos;ll get back to you as soon as we can.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone / WhatsApp (optional)</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="+234 901 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Partnership inquiry"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                required
                rows={5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.email.trim() || !form.message.trim()}
              className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {submitting ? 'Sending...' : 'Send message'}
            </button>
            <a
              href="https://wa.me/2349015718484?text=Hello,%20I%20am%20contacting%20you%20through%20your%20platform."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              <span>Chat with us on WhatsApp</span>
            </a>
          </form>
        </div>
      </Section>

      {/* Location */}
      <Section id="location">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-text-dark">Where we work</h2>
          <p className="mt-2 text-lg text-gray-600">
            Global startup-focused. Working worldwide.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
              <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={28} height={28} className="h-7 w-auto object-contain" />
              <span>RiseFlow Hub</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm font-medium text-gray-600 hover:text-primary transition">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <p className="mt-6 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} RiseFlow Hub. Build. Grow. Launch.
          </p>
        </div>
      </footer>
    </div>
  );
}
