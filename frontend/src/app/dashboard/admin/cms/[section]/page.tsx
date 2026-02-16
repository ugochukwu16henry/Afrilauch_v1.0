'use client';

import { useCallback, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getStoredToken, api } from '@/lib/api';
import { cmsSections, cmsSectionSlugs, type CmsFieldDef } from '@/lib/cmsSections';
import { clearCMSCache } from '@/hooks/useCMS';
import Link from 'next/link';

function FieldEditor({
  def,
  value,
  onChange,
}: {
  def: CmsFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  if (def.type === 'richtext') {
    return (
      <textarea
        id={def.key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        rows={6}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
      />
    );
  }
  if (def.type === 'json') {
    return (
      <textarea
        id={def.key}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={def.placeholder}
        rows={16}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary"
      />
    );
  }
  return (
    <input
      id={def.key}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={def.placeholder}
      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
    />
  );
}

export default function CMSSectionPage() {
  const params = useParams();
  const router = useRouter();
  const sectionSlug = (params?.section as string) ?? '';
  const section = cmsSectionSlugs.includes(sectionSlug) ? cmsSections[sectionSlug] : null;

  const [contents, setContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!section) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.cms.getByPage(section.pageName);
      const record = res.contents || {};
      const next: Record<string, string> = {};
      for (const f of section.fields) {
        const v = record[f.key];
        next[f.key] = typeof v === 'string' ? v : typeof v === 'object' && v !== null ? JSON.stringify(v, null, 2) : '';
      }
      setContents(next);
    } catch {
      setError('Failed to load content');
      setContents({});
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    if (section) load();
  }, [section, load]);

  const handleSave = async () => {
    if (!section) return;
    const token = getStoredToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        contents: Object.entries(contents).map(([key, value]) => ({
          key,
          value: section.fields.find((f) => f.key === key)?.type === 'json' ? (() => {
            try {
              return JSON.parse(value);
            } catch {
              return value;
            }
          })() : value,
        })),
      };
      await api.cms.bulkUpdatePage(section.pageName, payload, token);
      clearCMSCache();
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!section) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-gray-600">Section not found.</p>
        <Link href="/dashboard/admin/cms" className="mt-4 inline-block text-sm text-primary hover:underline">
          Back to CMS
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-secondary">{section.title}</h2>
          {section.description && (
            <p className="text-sm text-gray-500 mt-0.5">{section.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || loading}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-90 disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div className="p-4">
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {section.fields.map((def) => (
                <div key={def.key}>
                  <label htmlFor={def.key} className="block text-sm font-medium text-gray-700 mb-1">
                    {def.label}
                  </label>
                  <FieldEditor
                    def={def}
                    value={contents[def.key] ?? ''}
                    onChange={(v) => setContents((prev) => ({ ...prev, [def.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
