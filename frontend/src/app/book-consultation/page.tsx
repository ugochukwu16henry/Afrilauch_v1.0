'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Nav, Section, Footer } from '@/components/landing';
import { api, getStoredToken, type ConsultationBookingBody, type User } from '@/lib/api';

const STAGE_OPTIONS = [
  { value: 'Idea', label: 'Idea' },
  { value: 'MVP', label: 'MVP' },
  { value: 'Business', label: 'Business' },
];

const MAIN_GOAL_OPTIONS = [
  { value: 'Website', label: 'Website' },
  { value: 'App', label: 'App' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Funding', label: 'Funding' },
  { value: 'All', label: 'All' },
];

const BUDGET_OPTIONS = [
  { value: 'Under $1,000', label: 'Under $1,000' },
  { value: '$1,000 - $5,000', label: '$1,000 - $5,000' },
  { value: '$5,000 - $15,000', label: '$5,000 - $15,000' },
  { value: '$15,000 - $50,000', label: '$15,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
  { value: 'Not sure yet', label: 'Not sure yet' },
];

const CONTACT_METHOD_OPTIONS = [
  { value: 'Email', label: 'Email' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Zoom', label: 'Zoom' },
];

// 9:00 - 17:00 in 30-min slots
const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const WHAT_TO_EXPECT = [
  { title: '30–45 minute strategy session', desc: 'A focused call to understand your idea and goals.' },
  { title: 'Idea clarity and direction', desc: 'Expert feedback to sharpen your vision and next steps.' },
  { title: 'Tech & business roadmap', desc: 'High-level roadmap for build, launch, and growth.' },
  { title: 'Next steps', desc: 'Clear action items and options to work with us further.' },
];

const defaultForm: ConsultationBookingBody = {
  fullName: '',
  email: '',
  country: '',
  businessIdea: '',
  stage: '',
  mainGoal: '',
  budgetRange: '',
  preferredContactMethod: '',
  preferredDate: '',
  preferredTime: '',
  timezone: '',
};

export default function BookConsultationPage() {
  const [form, setForm] = useState<ConsultationBookingBody>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timezone, setTimezone] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      setTimezone(tz);
      setForm((prev) => ({ ...prev, timezone: tz }));
    } catch {
      setTimezone('');
    }
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => setUser(null));
  }, []);

  function update<K extends keyof ConsultationBookingBody>(key: K, value: ConsultationBookingBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: ConsultationBookingBody = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        country: form.country?.trim() || undefined,
        businessIdea: form.businessIdea?.trim() || undefined,
        stage: form.stage || undefined,
        mainGoal: form.mainGoal || undefined,
        budgetRange: form.budgetRange || undefined,
        preferredContactMethod: form.preferredContactMethod || undefined,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        timezone: form.timezone || undefined,
      };
      await api.consultations.book(payload);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().slice(0, 10);

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
            <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">Booking confirmed</h1>
            <p className="mt-4 text-lg text-gray-600">
              Your consultation has been booked. We will confirm by email shortly and reach out via your preferred contact method.
            </p>
            <Link
              href="/"
              className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
            >
              Back to home
            </Link>
          </div>
        </section>
        <Footer />
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
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-10 text-center lg:flex-row lg:text-left">
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-text-dark sm:text-4xl md:text-5xl">
              Let&apos;s Talk About Your Idea
            </h1>
            {user?.setupPaid ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-medium text-emerald-800">
                Free consultation — included with your setup
              </p>
            ) : user ? (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-1.5 text-sm font-medium text-amber-800">
                Paid booking — unlock free consultation by completing setup
              </p>
            ) : null}
            <p className="mt-6 text-lg text-gray-600 leading-relaxed">
              Book a consultation and get expert guidance on turning your idea into a real business.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            <Image
              src="/Rise Flow Idea Valedation pic.png"
              alt="Founder reviewing idea validation insights"
              width={520}
              height={360}
              className="w-full max-w-md rounded-2xl border border-emerald-100 shadow-lg shadow-emerald-100 object-cover"
            />
          </div>
        </div>
      </section>

      {/* Calendar + Form */}
      <Section id="booking" variant="muted">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
          {/* Calendar / date & time */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-text-dark">Choose a time</h2>
            <p className="mt-1 text-sm text-gray-600">Select your preferred date and time. We&apos;ll confirm by email.</p>
            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date</label>
                <input
                  type="date"
                  value={form.preferredDate}
                  onChange={(e) => update('preferredDate', e.target.value)}
                  min={minDateStr}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred time</label>
                <select
                  value={form.preferredTime}
                  onChange={(e) => update('preferredTime', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select time</option>
                  {TIME_SLOTS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              {timezone && (
                <p className="text-xs text-gray-500">
                  Your timezone: <span className="font-medium">{timezone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-lg font-semibold text-text-dark">Your details</h2>
            <p className="mt-1 text-sm text-gray-600">We&apos;ll use this to confirm your booking and reach out.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Your full name"
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => update('country', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Nigeria, Kenya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business idea (short description)</label>
                <textarea
                  value={form.businessIdea}
                  onChange={(e) => update('businessIdea', e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="A brief description of your idea..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select
                  value={form.stage}
                  onChange={(e) => update('stage', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select stage</option>
                  {STAGE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Main goal</label>
                <select
                  value={form.mainGoal}
                  onChange={(e) => update('mainGoal', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select goal</option>
                  {MAIN_GOAL_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget range</label>
                <select
                  value={form.budgetRange}
                  onChange={(e) => update('budgetRange', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select budget</option>
                  {BUDGET_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preferred contact method</label>
                <select
                  value={form.preferredContactMethod}
                  onChange={(e) => update('preferredContactMethod', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select method</option>
                  {CONTACT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                Your information is confidential and secure.
              </p>
              <button
                type="submit"
                disabled={submitting || !form.fullName.trim() || !form.email.trim()}
                className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </form>
          </div>
        </div>
      </Section>

      {/* What to expect */}
      <Section id="expect">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-text-dark sm:text-3xl">
            What to Expect
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            A focused, supportive session to clarify your idea and next steps.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHAT_TO_EXPECT.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-gray-50/50 p-6 transition hover:border-primary/20 hover:bg-primary/5"
            >
              <h3 className="text-lg font-semibold text-text-dark">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Trust */}
      <Section variant="dark">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-lg font-medium text-white sm:text-xl">
            Your information is confidential and secure.
          </p>
          <p className="mt-2 text-white/85 text-sm">
            We use your details only to confirm your booking and reach out. We do not share your data with third parties.
          </p>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
