'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api, getStoredToken, setStoredToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'fail' | null>(null);

  const MAIN_SITE = process.env.NEXT_PUBLIC_MAIN_SITE || '';
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || '';
  const INVESTOR_URL = process.env.NEXT_PUBLIC_INVESTOR_URL || '';
  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || '';

  const getBase = (preferred: string) => {
    if (preferred) return preferred.replace(/\/+$/, '');
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const redirectTo = (base: string, path: string) => {
    const cleanBase = base || origin;
    const url = `${cleanBase.replace(/\/+$/, '')}${path}`;
    if (typeof window !== 'undefined') {
      if (url.startsWith(origin)) {
        router.push(path);
      } else {
        window.location.href = url;
      }
    } else {
      router.push(path);
    }
  };

  const redirectByRole = (role: string) => {
    if (role === 'super_admin' || role === 'project_manager' || role === 'finance_admin' || role === 'cofounder') {
      redirectTo(getBase(ADMIN_URL || MAIN_SITE), '/dashboard/admin');
    } else if (role === 'developer' || role === 'designer' || role === 'marketer') {
      redirectTo(getBase(APP_URL || MAIN_SITE), '/dashboard/team');
    } else if (role === 'investor') {
      redirectTo(getBase(INVESTOR_URL || MAIN_SITE), '/dashboard/investor');
    } else if (role === 'talent') {
      redirectTo(getBase(APP_URL || MAIN_SITE), '/dashboard/talent');
    } else if (role === 'hirer' || role === 'hiring_company') {
      redirectTo(getBase(APP_URL || MAIN_SITE), '/dashboard/hirer');
    } else if (role === 'hr_manager') {
      redirectTo(getBase(ADMIN_URL || MAIN_SITE), '/dashboard/admin/hr');
    } else if (role === 'legal_team') {
      redirectTo(getBase(ADMIN_URL || MAIN_SITE), '/dashboard/legal');
    } else {
      redirectTo(getBase(APP_URL || MAIN_SITE), '/dashboard/client');
    }
  };

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const healthUrl = base ? `${base.replace(/\/$/, '')}/api/v1/health` : '/api/v1/health';
    fetch(healthUrl)
      .then((r) => {
        if (r.ok) return r.json();
        return Promise.reject(new Error(`${r.status} ${r.statusText}`));
      })
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('fail'));
  }, []);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    let mounted = true;
    api.auth
      .me(token)
      .then((user) => {
        if (!mounted || !user?.role) return;
        redirectByRole(user.role);
      })
      .catch(() => {
        // Keep user on login page when token is missing/expired.
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const tenantDomain = typeof window !== 'undefined' ? window.location.hostname : undefined;
      const data = await api.auth.login({ email, password }, tenantDomain);
      if (!data || typeof data.token !== 'string') {
        setError('Invalid login response (missing token). Try again or check backend logs.');
        return;
      }
      if (!data.user) {
        setError('Invalid login response (missing user). Try again or check backend logs.');
        return;
      }
      setStoredToken(data.token);
      const role = data.user.role;
      redirectByRole(role);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Login failed. Check the browser console for details.';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('502') || msg.includes('Bad Gateway') || msg.includes('NetworkError')) {
        setError('Backend not responding. Set NEXT_PUBLIC_API_URL in Vercel to your Railway backend URL (e.g. https://your-backend.up.railway.app) and FRONTEND_URL on the Railway backend to this Vercel site URL, then redeploy backend on Railway and frontend on Vercel.');
      } else if (msg === 'Unauthorized' || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('401')) {
        setError('Invalid email or password. Please check your details and try again.');
      } else if (msg.includes('CORS') || msg.includes('Access-Control')) {
        setError('Request blocked (CORS). Set FRONTEND_URL on the backend (Railway) to this site\'s URL (no trailing slash), then redeploy the backend.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Branding (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="mb-8">
            <Image
              src="/RiseFlowHub%20logo.png"
              alt="RiseFlow Hub"
              width={160}
              height={60}
              className="h-15 w-auto object-contain"
            />
          </div>

          <h1 className="text-4xl font-bold mb-4 leading-tight">Welcome back to RiseFlow Hub</h1>
          <p className="text-lg text-white/90 mb-12">
            Continue building your vision. Sign in to access your projects, track progress, and connect with opportunities.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Track Your Progress</h3>
                <p className="text-sm text-white/80">Monitor milestones, tasks, and project status in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Collaborate Seamlessly</h3>
                <p className="text-sm text-white/80">Work with your team, investors, and partners all in one place.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Accelerate Growth</h3>
                <p className="text-sm text-white/80">Access resources, AI tools, and marketplace connections.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Image
              src="/RiseFlowHub%20logo.png"
              alt="RiseFlow Hub"
              width={180}
              height={56}
              priority
              className="h-14 w-auto object-contain"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to your account</h2>
              <p className="text-gray-600">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {apiStatus === 'fail' && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm space-y-1">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="font-medium">API unreachable</p>
                      <p className="text-xs mt-1">Configure NEXT_PUBLIC_API_URL and redeploy.</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-start gap-2" data-testid="auth-error">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary py-3 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="text-primary font-semibold hover:underline">
                  Create one now
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
