'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setStoredToken, api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tenantDomain = typeof window !== 'undefined' ? window.location.hostname : undefined;
      const data = await api.auth.register({ name, email, password, role: 'client' }, tenantDomain);
      if (!data || typeof data.token !== 'string') {
        setError('Invalid signup response (missing token). Try again or check backend.');
        return;
      }
      if (!data.user) {
        setError('Invalid signup response (missing user). Try again or check backend.');
        return;
      }
      setStoredToken(data.token);
      router.push('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      if (msg === 'Failed to fetch' || msg.includes('502') || msg.includes('Bad Gateway')) {
        setError('Backend not responding. Set NEXT_PUBLIC_API_URL to your Railway backend URL and ensure the backend is running.');
      } else if (msg.includes('Email already registered')) {
        setError('This email is already registered. Try logging in or use a different email.');
      } else if (msg.includes('CORS') || msg.includes('Access-Control')) {
        setError('Request blocked (CORS). Set FRONTEND_URL on the backend (Railway) to this site\'s URL, then redeploy.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex justify-center mb-4">
          <img src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" className="h-14 w-auto object-contain" />
        </div>
        <h1 className="text-2xl font-bold text-primary mb-2 text-center">RiseFlow Hub</h1>
        <p className="text-secondary text-sm mb-6 text-center">Create your account</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password (min 6 characters)
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent text-text-dark py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Start Your Project'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
