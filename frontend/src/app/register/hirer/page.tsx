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
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-xl">
        <div className="mb-6">
          <Link href="/hiring" className="inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hiring
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-8 md:p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={120} height={40} className="h-10 w-auto object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full bg-violet-50 border border-violet-200 px-4 py-1.5 text-xs font-medium text-violet-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Employer Registration
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600">
              Hire Top Talent
            </h1>
            <p className="text-gray-600 text-sm max-w-md mx-auto">
              Register as a hiring company or individual. Access vetted professionals ready to join your team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Your name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password *</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Company name *</label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    required 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                    placeholder="Acme Corp"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Hiring needs</label>
                <textarea 
                  value={hiringNeeds} 
                  onChange={(e) => setHiringNeeds(e.target.value)} 
                  rows={3} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                  placeholder="What roles or skills are you looking for? E.g., Full-stack developer with React experience..." 
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Budget</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input 
                    type="text" 
                    value={budget} 
                    onChange={(e) => setBudget(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 pl-8 pr-4 py-2.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all" 
                    placeholder="500–2000 per project or monthly"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-violet-50 border border-violet-200 p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-violet-800">
                  <p className="font-medium mb-1">Next steps after registration:</p>
                  <ul className="space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                      Pay the one-time $20 platform fee
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                      Sign the Fair Treatment Agreement
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600"></span>
                      Start browsing and hiring talent
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 py-4 text-sm font-semibold text-white hover:from-violet-700 hover:to-fuchsia-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
