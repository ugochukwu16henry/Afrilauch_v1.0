'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

interface TalentCard {
  id: string;
  name: string;
  avatarUrl?: string | null;
  skills: string[];
  customRole: string | null;
  roleCategory: string | null;
  yearsExperience: number;
  portfolioUrl: string | null;
  pastProjects: Array<{ title?: string; description?: string; url?: string }> | null;
  shortBio: string | null;
  availability: string | null;
  country: string | null;
  hourlyRate: number | null;
  featured?: boolean;
  feePaid?: boolean;
  averageRating: number | null;
  ratingCount: number;
  videoUrl?: string | null;
}

export default function TalentMarketplacePage() {
  const [items, setItems] = useState<TalentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [skillFilter, setSkillFilter] = useState('');
  const [sort, setSort] = useState('rating');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (skillFilter.trim()) params.set('skills', skillFilter.trim());
    if (sort && sort !== 'rating') params.set('sort', sort);
    if (verifiedOnly) params.set('verifiedOnly', 'true');
    const url = `${API_BASE}/api/v1/talent/marketplace${params.toString() ? `?${params.toString()}` : ''}`;
    fetch(url)
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('Failed to load')))
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [skillFilter, sort, verifiedOnly]);

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
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-primary transition">Login</Link>
            <Link href="/register/hirer" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition">Hire Talent</Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Talent Marketplace</h1>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Filter by skill"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-48"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="rating">Highest rated</option>
              <option value="featured">Featured</option>
              <option value="recent">Recently active</option>
              <option value="new">New talents</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="rounded" />
              Verified only (fee paid)
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading talents...</p>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-600">
            <p>No approved talents in the marketplace yet.</p>
            <Link href="/hiring" className="mt-2 inline-block text-primary font-medium hover:underline">Join as Talent</Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <article
                key={t.id}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {t.avatarUrl ? (
                      <img src={t.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                        {t.name.slice(0, 1)}
                      </div>
                    )}
                    <h2 className="font-semibold text-gray-900">{t.name}</h2>
                    {t.featured && <span className="rounded bg-amber-100 text-amber-800 text-xs px-1.5 py-0.5">Featured</span>}
                    {t.feePaid && <span className="rounded bg-green-100 text-green-800 text-xs px-1.5 py-0.5">Verified</span>}
                  </div>
                  {t.averageRating != null && (
                    <span className="flex items-center gap-0.5 text-amber-600 text-sm" title="Rating">
                      ★ {t.averageRating.toFixed(1)}
                      {t.ratingCount > 0 && <span className="text-gray-400">({t.ratingCount})</span>}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {t.customRole || t.roleCategory || t.skills.slice(0, 3).join(', ')} · {t.yearsExperience} years exp.
                  {t.hourlyRate != null && <span> · ${t.hourlyRate}/hr</span>}
                </p>
                {t.shortBio && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{t.shortBio}</p>}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.skills.slice(0, 6).map((s) => (
                    <span key={s} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {s}
                    </span>
                  ))}
                </div>
                {t.pastProjects && Array.isArray(t.pastProjects) && t.pastProjects.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    Past projects: {t.pastProjects.map((p) => p.title || 'Project').join(', ')}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.portfolioUrl && (
                    <a
                      href={t.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Portfolio
                    </a>
                  )}
                  <Link
                    href={`/dashboard/hirer/hire/${t.id}`}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition"
                  >
                    Hire
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
