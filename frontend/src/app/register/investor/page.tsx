'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, setStoredToken } from '@/lib/api';
import type { InvestorRegisterBody } from '@/lib/api';

export default function InvestorRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<InvestorRegisterBody & { confirmPassword: string }>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [firmName, setFirmName] = useState('');
  const [investmentRangeMin, setInvestmentRangeMin] = useState('');
  const [investmentRangeMax, setInvestmentRangeMax] = useState('');
  const [industries, setIndustries] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const res = await api.investors.register({
        name: form.name,
        email: form.email,
        password: form.password,
        firmName: firmName || undefined,
        investmentRangeMin: investmentRangeMin ? parseFloat(investmentRangeMin) : undefined,
        investmentRangeMax: investmentRangeMax ? parseFloat(investmentRangeMax) : undefined,
        industries: industries || undefined,
        country: country || undefined,
      });
      setStoredToken(res.token);
      router.push('/dashboard/investor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <img src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" className="h-14 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">Investor registration</h1>
        <p className="text-secondary text-sm mb-6 text-center">Create your investor account to browse and fund startups.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password (min 6)</label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <input
              id="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="firmName" className="block text-sm font-medium text-gray-700 mb-1">Firm name (optional)</label>
            <input
              id="firmName"
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="rangeMin" className="block text-sm font-medium text-gray-700 mb-1">Min investment</label>
              <input
                id="rangeMin"
                type="number"
                min={0}
                value={investmentRangeMin}
                onChange={(e) => setInvestmentRangeMin(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="rangeMax" className="block text-sm font-medium text-gray-700 mb-1">Max investment</label>
              <input
                id="rangeMax"
                type="number"
                min={0}
                value={investmentRangeMax}
                onChange={(e) => setInvestmentRangeMax(e.target.value)}
                placeholder="—"
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label htmlFor="industries" className="block text-sm font-medium text-gray-700 mb-1">Industries (optional)</label>
            <input
              id="industries"
              type="text"
              value={industries}
              onChange={(e) => setIndustries(e.target.value)}
              placeholder="e.g. Tech, Health"
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Country (optional)</label>
            <input
              id="country"
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-primary py-2.5 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Register as investor'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}
