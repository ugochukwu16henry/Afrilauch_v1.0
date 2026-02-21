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
    label: 'support@riseflowhub.app',
    href: 'mailto:support@riseflowhub.app',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    title: 'Business inquiries',
    desc: 'Projects, proposals, and partnerships.',
    label: 'hello@riseflowhub.app',
    href: 'mailto:hello@riseflowhub.app',
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
      </svg>
    ),
  },
  {
    title: 'Partnerships',
    desc: 'Investors, accelerators, and collaborators.',
    label: 'partners@riseflowhub.app',
    href: 'mailto:partners@riseflowhub.app',
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 text-text-dark">
        <Nav />
        <section className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="rounded-3xl border border-green-200/80 bg-white/90 backdrop-blur-sm p-10 shadow-2xl">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Message Sent!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for reaching out. We will get back to you shortly.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-8 py-3.5 text-base font-semibold text-white hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to home
            </Link>
          </div>
        </section>
        <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-8">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 text-text-dark">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-20 sm:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/60 via-purple-100/40 to-pink-100/60" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzAwMCIgc3Ryb2tlLW9wYWNpdHk9Ii4wMiIvPjwvZz48L3N2Zz4=')] opacity-40" />
        </div>
        
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 mb-6 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 px-5 py-2 text-sm font-medium text-primary shadow-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Get in Touch
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              We&apos;d Love to
            </span>
            <br />
            <span className="text-gray-900">Hear From You</span>
          </h1>
          
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Have a question, partnership idea, or need support? Reach out and let's build something amazing together.
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
              className="group relative rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-purple-500/10 text-primary transition group-hover:from-primary/20 group-hover:to-purple-500/20 group-hover:scale-110">
                {card.icon}
              </div>
              <h2 className="relative mt-5 text-lg font-semibold text-gray-900">{card.title}</h2>
              <p className="relative mt-2 text-sm text-gray-600">{card.desc}</p>
              <p className="relative mt-4 text-sm font-semibold text-primary group-hover:text-purple-600 transition-colors flex items-center gap-2">
                {card.label}
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </p>
            </a>
          ))}
        </div>
      </Section>

      {/* Quick book */}
      <Section id="quick-book">
        <div className="mx-auto max-w-2xl rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 md:p-10 text-center shadow-lg">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200/50 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule a Call
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Prefer to Talk?</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">Book a quick call and we&apos;ll get back to you with a time that works for both of us.</p>
          <Link
            href="/book-consultation"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-3.5 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Book a Quick Call
          </Link>
        </div>
      </Section>

      {/* Contact form */}
      <Section id="form" variant="muted">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 px-4 py-1.5 text-sm font-medium text-purple-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Contact Form
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-4">
              Send a Message
            </h2>
            <p className="text-gray-600 text-lg">
              Fill out the form below and we&apos;ll get back to you as soon as we can.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-8 shadow-xl">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                placeholder="you@example.com"
              />
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Phone / WhatsApp</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="+234 901 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => update('subject', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="e.g. Partnership inquiry"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Message *</label>
              <textarea
                value={form.message}
                onChange={(e) => update('message', e.target.value)}
                required
                rows={6}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            
            <button
              type="submit"
              disabled={submitting || !form.name.trim() || !form.email.trim() || !form.message.trim()}
              className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-4 text-base font-semibold text-white hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Send Message
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </span>
              )}
            </button>
            
            <div className="text-center">
              <a
                href="https://wa.me/2349015718484?text=Hello,%20I%20am%20contacting%20you%20through%20your%20platform."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Chat with us on WhatsApp
              </a>
            </div>
          </form>
        </div>
      </Section>

      {/* Location */}
      <Section id="location">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 px-4 py-1.5 text-sm font-medium text-blue-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Global Reach
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Where We Work</h2>
          <p className="text-lg text-gray-600">
            Global startup-focused. Working worldwide to build amazing ventures.
          </p>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <Link href="/" className="flex items-center gap-2 font-semibold text-secondary transition hover:opacity-80">
              <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={28} height={28} className="h-7 w-auto object-contain" />
              <span>RiseFlow Hub</span>
            </Link>
            <nav className="flex flex-wrap items-center justify-center gap-6">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.label} href={link.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
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
