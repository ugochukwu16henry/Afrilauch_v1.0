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
    <div className="min-h-screen bg-background text-text-dark">
      <header className="border-b border-gray-200 bg-white">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-secondary">
            <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={36} height={36} className="h-9 w-auto object-contain" />
            <span>RiseFlow Hub</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/hiring" className="text-sm font-medium text-gray-600 hover:text-primary transition">Hiring</Link>
            <Link href="/talent-marketplace" className="text-sm font-medium text-gray-600 hover:text-primary transition">Talent Marketplace</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition">Login</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner With Us</h1>
        <p className="text-gray-600 mb-8">
          For investors, organizations, recruiters, and agencies. Tell us how you’d like to partner.
        </p>

        {sent ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-green-800">
            <p className="font-medium">Thank you for your interest.</p>
            <p className="mt-1 text-sm">We’ll be in touch soon.</p>
            <Link href="/" className="mt-4 inline-block text-primary font-medium hover:underline">Back to home</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            {error && <div className="rounded-lg bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company / Organization name *</label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="url" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type of partnership *</label>
              <select value={partnershipType} onChange={(e) => setPartnershipType(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {PARTNER_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Services offered</label>
              <textarea value={servicesOffered} onChange={(e) => setServicesOffered(e.target.value)} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="What do you offer?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="How would you like to partner?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact name</label>
              <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact email</label>
              <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {loading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
