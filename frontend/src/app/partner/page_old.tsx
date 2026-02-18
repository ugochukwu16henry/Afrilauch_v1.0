'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';
const PARTNER_TYPES = ['Investor', 'Organization', 'Recruiter', 'Agency'];

export default function PartnerWithUsPage() {
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [partnershipType, setPartnershipType] = useState('Organization');
  const [servicesOffered, setServicesOffered] = useState('');
  const [message, setMessage] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/partner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: companyName.trim(),
          website: website.trim() || undefined,
          partnershipType,
          servicesOffered: servicesOffered.trim() || undefined,
          message: message.trim(),
          contactName: contactName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || res.statusText);
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-text-dark">
      <header className="border-b border-white/50 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-secondary transition hover:opacity-80">
            <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={36} height={36} className="h-9 w-auto object-contain" />
            <span className="text-lg">RiseFlow Hub</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/hiring" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Hiring</Link>
            <Link href="/talent-marketplace" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Talent Marketplace</Link>
            <Link href="/login" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-all shadow-sm">Login</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Partnership Program
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Partner With Us
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            For investors, organizations, recruiters, and agencies. Join us in building the future of talent connection.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-green-800 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-full bg-green-500 p-2">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-xl font-semibold">Thank you for your interest!</p>
            </div>
            <p className="text-sm mb-6">We've received your partnership inquiry and will be in touch soon.</p>
            <Link href="/" className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-8 shadow-xl">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Company / Organization name *</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  required 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="Your company name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Website</label>
                <input 
                  type="url" 
                  placeholder="https://yoursite.com" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Type of partnership *</label>
              <select 
                value={partnershipType} 
                onChange={(e) => setPartnershipType(e.target.value)} 
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Services offered</label>
              <textarea 
                value={servicesOffered} 
                onChange={(e) => setServicesOffered(e.target.value)} 
                rows={2} 
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder="What services or value do you offer?" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Message *</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                required 
                rows={4} 
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                placeholder="Tell us about your partnership goals..." 
              />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contact name</label>
                <input 
                  type="text" 
                  value={contactName} 
                  onChange={(e) => setContactName(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contact email</label>
                <input 
                  type="email" 
                  value={contactEmail} 
                  onChange={(e) => setContactEmail(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 py-3.5 text-sm font-semibold text-white hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : 'Submit Partnership Inquiry'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
