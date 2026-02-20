'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Nav, Footer } from '@/components/landing';
import { api, getStoredToken, setStoredToken, type IdeaSubmissionBody } from '@/lib/api';

const STEPS = [
  { id: 1, title: 'Basic info' },
  { id: 2, title: 'Idea details' },
  { id: 3, title: 'Stage' },
  { id: 4, title: 'Goals' },
  { id: 5, title: 'Budget' },
  { id: 6, title: 'Submit' },
];

const STAGE_OPTIONS = [
  { value: 'just_idea', label: 'Just idea' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'existing_business', label: 'Existing business' },
];

const GOAL_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'app', label: 'App' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'funding', label: 'Funding' },
];

const BUDGET_OPTIONS = [
  { value: 'Under $1,000', label: 'Under $1,000' },
  { value: '$1,000 - $5,000', label: '$1,000 - $5,000' },
  { value: '$5,000 - $15,000', label: '$5,000 - $15,000' },
  { value: '$15,000 - $50,000', label: '$15,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
  { value: 'Not sure yet', label: 'Not sure yet' },
];

const defaultForm: IdeaSubmissionBody = {
  name: '',
  email: '',
  password: '',
  country: '',
  ideaDescription: '',
  problemItSolves: '',
  targetUsers: '',
  industry: '',
  stage: 'just_idea',
  goals: [],
  budgetRange: '',
};

function SubmitIdeaPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const earlyRef = searchParams.get('ref') || undefined;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<IdeaSubmissionBody>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      router.replace('/dashboard/client/submit');
    }
  }, [router]);

  function update<K extends keyof IdeaSubmissionBody>(key: K, value: IdeaSubmissionBody[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function toggleGoal(value: string) {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(value) ? prev.goals.filter((g) => g !== value) : [...prev.goals, value],
    }));
    setError(null);
  }

  function canProceed(): boolean {
    if (step === 1) return !!form.name.trim() && !!form.email.trim() && !!form.password.trim();
    if (step === 2) return !!form.ideaDescription.trim();
    if (step === 3) return !!form.stage;
    if (step === 4) return form.goals.length > 0;
    if (step === 5) return !!form.budgetRange;
    return true;
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const payload: IdeaSubmissionBody = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        country: form.country.trim(),
        ideaDescription: form.ideaDescription.trim(),
        problemItSolves: form.problemItSolves.trim(),
        targetUsers: form.targetUsers.trim(),
        industry: form.industry.trim(),
        stage: form.stage,
        goals: form.goals,
        budgetRange: form.budgetRange.trim(),
      };
      if (earlyRef) {
        // Tag early access referrals so the backend can enroll into the scholarship program.
        (payload as any).ref = earlyRef;
      }
      const res = await api.ideaSubmissions.submit(payload);
      if (res.token) setStoredToken(res.token);
      setSubmitted(true);
      router.replace('/dashboard/client');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background text-text-dark">
        <Nav />
        <section className="mx-auto max-w-2xl px-4 py-20 text-center">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">
              Your idea has been received
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Our system is analyzing it and preparing your startup proposal.
            </p>
            <p className="mt-2 text-gray-500">
              Check your email for confirmation. You can also go to your dashboard now.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white hover:opacity-90 transition"
            >
              Go to Dashboard
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

      <section className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <h1 className="text-2xl font-bold text-text-dark sm:text-3xl">Submit your idea</h1>
        <p className="mt-2 text-gray-600">We&apos;ll evaluate it and prepare your startup proposal.</p>

        {/* Step indicator */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                step === s.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s.id}. {s.title}
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-dark">Basic info</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Password * (min 6 characters)</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Create a password for your account"
                />
              </div>
            </div>
          )}

          {/* Step 2 — Idea details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-dark">Idea details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Idea description *</label>
                <textarea
                  value={form.ideaDescription}
                  onChange={(e) => update('ideaDescription', e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Describe your startup idea in a few sentences..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem it solves</label>
                <textarea
                  value={form.problemItSolves}
                  onChange={(e) => update('problemItSolves', e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="What problem does your idea address?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target users</label>
                <input
                  type="text"
                  value={form.targetUsers}
                  onChange={(e) => update('targetUsers', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Who will use this? (e.g. small businesses, students)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                <input
                  type="text"
                  value={form.industry}
                  onChange={(e) => update('industry', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="e.g. Fintech, EdTech, Health"
                />
              </div>
            </div>
          )}

          {/* Step 3 — Stage */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-dark">Stage</h2>
              <p className="text-sm text-gray-600">Where are you with this idea?</p>
              <div className="space-y-2">
                {STAGE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                      form.stage === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="stage"
                      value={opt.value}
                      checked={form.stage === opt.value}
                      onChange={() => update('stage', opt.value as IdeaSubmissionBody['stage'])}
                      className="text-primary"
                    />
                    <span className="font-medium text-text-dark">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4 — Goals */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-dark">Goals</h2>
              <p className="text-sm text-gray-600">What do you want to achieve? (Select all that apply)</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {GOAL_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                      form.goals.includes(opt.value) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={form.goals.includes(opt.value)}
                      onChange={() => toggleGoal(opt.value)}
                      className="rounded text-primary"
                    />
                    <span className="font-medium text-text-dark">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 5 — Budget */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-text-dark">Budget range</h2>
              <p className="text-sm text-gray-600">Rough budget for this project (helps us tailor the proposal)</p>
              <div className="space-y-2">
                {BUDGET_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition ${
                      form.budgetRange === opt.value ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="budget"
                      value={opt.value}
                      checked={form.budgetRange === opt.value}
                      onChange={() => update('budgetRange', opt.value)}
                      className="text-primary"
                    />
                    <span className="font-medium text-text-dark">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 6 — Review & Submit */}
          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-text-dark">Review & submit</h2>
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
                <p><strong>Name:</strong> {form.name || '—'}</p>
                <p><strong>Email:</strong> {form.email || '—'}</p>
                <p><strong>Country:</strong> {form.country || '—'}</p>
                <p><strong>Idea:</strong> {form.ideaDescription ? form.ideaDescription.slice(0, 120) + (form.ideaDescription.length > 120 ? '...' : '') : '—'}</p>
                <p><strong>Stage:</strong> {STAGE_OPTIONS.find((o) => o.value === form.stage)?.label ?? '—'}</p>
                <p><strong>Goals:</strong> {form.goals.length ? form.goals.map((g) => GOAL_OPTIONS.find((o) => o.value === g)?.label ?? g).join(', ') : '—'}</p>
                <p><strong>Budget:</strong> {form.budgetRange || '—'}</p>
              </div>
              <p className="text-sm text-gray-600">
                By submitting, we&apos;ll create your account, save your idea, run an AI evaluation, and send you a confirmation email.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step < 6 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed()}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit my idea'}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">Log in</Link>
        </p>
      </section>

      <Footer />
    </div>
  );
}

export default function SubmitIdeaPage() {
  return (
    <Suspense fallback={null}>
      <SubmitIdeaPageInner />
    </Suspense>
  );
}
