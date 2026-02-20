'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const TIME_SLOTS = Array.from({ length: 17 }, (_, i) => {
  const h = 9 + Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

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

export default function DashboardConsultationPage() {
  const router = useRouter();
  const [form, setForm] = useState<ConsultationBookingBody>(defaultForm);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [timezone, setTimezone] = useState('');

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    setTimezone(tz);
    setForm((prev) => ({ ...prev, timezone: tz }));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then((me) => {
        if (me.role === 'super_admin') {
          router.replace('/dashboard/admin/consultations');
          return;
        }
        setUser(me);
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || me.name || '',
          email: prev.email || me.email || '',
        }));
      })
      .catch(() => setUser(null));
  }, [router]);

  function update<K extends keyof ConsultationBookingBody>(key: K, value: ConsultationBookingBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
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
      <div className="space-y-6">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-2xl font-bold text-emerald-800">Consultation booked</h1>
          <p className="mt-2 text-sm text-emerald-700">
            Your consultation has been booked. We will confirm by email and contact you through your selected method.
          </p>
          <div className="mt-4 flex gap-3">
            <Link href="/dashboard" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
              Back to dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setForm((prev) => ({ ...defaultForm, fullName: prev.fullName, email: prev.email, timezone: prev.timezone }));
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Book another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Book Consultation</h1>
        <p className="mt-1 text-sm text-gray-600">Fill this form here in your dashboard to book your 1:1 session.</p>
        {user?.setupPaid ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
            Free consultation included with your setup
          </p>
        ) : user ? (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
            Setup not completed — consultation may be billed separately
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary">Schedule</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Preferred date</label>
              <input
                type="date"
                value={form.preferredDate}
                onChange={(e) => update('preferredDate', e.target.value)}
                min={minDateStr}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Preferred time</label>
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

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-secondary">Your details</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Full name *</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Country</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => update('country', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="e.g. Nigeria"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Business idea</label>
              <textarea
                value={form.businessIdea}
                onChange={(e) => update('businessIdea', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Briefly describe your idea"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Stage</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Main goal</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Budget range</label>
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
              <label className="mb-1 block text-sm font-medium text-gray-700">Preferred contact method</label>
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

            <button
              type="submit"
              disabled={submitting || !form.fullName.trim() || !form.email.trim()}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Confirm Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
