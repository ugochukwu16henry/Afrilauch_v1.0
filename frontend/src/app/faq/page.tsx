'use client';

import { useEffect, useMemo, useState } from 'react';
import type { FaqItem } from '@/lib/api';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'founders', label: 'For Founders' },
  { id: 'investors', label: 'For Investors' },
  { id: 'pricing', label: 'Pricing & Payments' },
  { id: 'security', label: 'Security & Trust' },
  { id: 'process', label: 'Process & Platform' },
  { id: 'benefits', label: 'Benefits' },
  { id: 'vision', label: 'Future Vision' },
];

export default function FAQPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const usp = new URLSearchParams();
        if (category && category !== 'all') usp.set('category', category);
        if (query.trim()) usp.set('q', query.trim());
        const qs = usp.toString();
        const res = await fetch(`/api/v1/faq${qs ? `?${qs}` : ''}`, { signal: controller.signal });
        if (!res.ok) {
          throw new Error('Failed to load FAQs');
        }
        const data = (await res.json()) as { items: FaqItem[] };
        setItems(data.items);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof Error ? e.message : 'Failed to load FAQs');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [category, query]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return items
      .filter((i) => i.question.toLowerCase().includes(q))
      .slice(0, 5);
  }, [items, query]);

  return (
    <main className="min-h-screen bg-background text-text-dark">
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-semibold text-primary uppercase tracking-wide">FAQ & Knowledge Center</p>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary">
            Everything you need to know about RiseFlow Hub.
          </h1>
          <p className="text-gray-600 max-w-2xl text-sm">
            Learn how the venture-building platform works for founders and investors — from idea submission and product
            development to growth, scoring, and deal rooms.
          </p>
        </header>

        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="faq-search">
              Search questions
            </label>
            <input
              id="faq-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. investors, setup fee, AI mentor"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            {suggestions.length > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Suggestions:{' '}
                {suggestions.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setActiveId(s.id);
                      const el = document.getElementById(`faq-${s.id}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="underline text-primary mr-2"
                  >
                    {s.question}
                    {idx < suggestions.length - 1 ? ',' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                  category === cat.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="text-gray-500 text-sm">Loading FAQs...</p>}
        {error && !loading && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
        )}

        {!loading && !error && (
          <section className="space-y-3">
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">No questions found for this filter.</p>
            ) : (
              <dl className="space-y-2">
                {items.map((item) => {
                  const isOpen = activeId === item.id;
                  return (
                    <div
                      key={item.id}
                      id={`faq-${item.id}`}
                      className="rounded-xl border border-gray-200 bg-white"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveId(isOpen ? null : item.id)}
                        className="w-full flex items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-sm font-semibold text-secondary">{item.question}</span>
                        <span className="ml-3 text-gray-500 text-xs">{isOpen ? '−' : '+'}</span>
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line border-t border-gray-100">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </dl>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

