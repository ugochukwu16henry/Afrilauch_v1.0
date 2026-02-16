'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setStoredToken, getStoredToken, api } from '@/lib/api';

export default function RegisterHirerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hiringNeeds, setHiringNeeds] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = getStoredToken();
      const data = await api.hirer.register(
        {
          name: name.trim(),
          email: email.trim(),
          password: password || undefined,
          companyName: companyName.trim(),
          hiringNeeds: hiringNeeds.trim() || undefined,
          budget: budget.trim() || undefined,
        },
        token ?? undefined
      );
      if (data.token) setStoredToken(data.token);
      router.push('/dashboard/hirer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link href="/hiring" className="text-sm text-primary hover:underline mb-4 inline-block">← Back to Hiring</Link>
        <div className="flex justify-center mb-4">
          <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={120} height={40} className="h-10 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-bold text-primary mb-2 text-center">Hire Talent</h1>
        <p className="text-secondary text-sm mb-6 text-center">Register as a hiring company or individual. You’ll pay a $20 platform fee and sign the Fair Treatment Agreement before hiring.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password (min 6) *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name *</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hiring needs</label>
            <textarea value={hiringNeeds} onChange={(e) => setHiringNeeds(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="What roles or skills are you looking for?" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
            <input type="text" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="e.g. $500–2000" />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-gray-500">
          After registering you’ll need to pay the $20 fee and sign the Fair Treatment Agreement. <Link href="/login" className="text-primary hover:underline">Already have an account?</Link>
        </p>
      </div>
    </div>
  );
}
