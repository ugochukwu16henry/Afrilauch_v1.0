'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, getStoredRoleFromToken } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface TemplateItem {
  key: string;
  name: string;
  type: string;
  updatedAt: string | null;
}

export default function CorporateIdentityPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const t = getStoredToken();
    setToken(t || null);
  }, []);

  useEffect(() => {
    const role = getStoredRoleFromToken();
    if (role !== 'super_admin') {
      router.replace('/dashboard/admin');
      return;
    }
    if (!token) return;
    api.superAdmin.corporateIdentity
      .list(token)
      .then((res) => setItems(res.items))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, [token, router]);

  const openEdit = async (key: string) => {
    if (!token) return;
    try {
      const res = await api.superAdmin.corporateIdentity.get(key, token);
      setEditContent(res.content);
      setEditKey(key);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load template');
    }
  };

  const saveEdit = async () => {
    if (!token || !editKey) return;
    setSaving(true);
    try {
      await api.superAdmin.corporateIdentity.update(editKey, editContent, token);
      setEditKey(null);
      const res = await api.superAdmin.corporateIdentity.list(token);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (key: string, name: string) => {
    if (!token) return;
    setDownloading(key);
    try {
      const html = await api.superAdmin.corporateIdentity.download(key, token);
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadAsFile = async (key: string, name: string) => {
    if (!token) return;
    setDownloading(key);
    try {
      const html = await api.superAdmin.corporateIdentity.download(key, token);
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/\s+/g, '_')}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed');
    } finally {
      setDownloading(null);
    }
  };

  const role = getStoredRoleFromToken();
  if (role !== 'super_admin') {
    return (
      <div className="max-w-4xl p-6">
        <p className="text-gray-600">Corporate Identity is available to Super Admin only.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Corporate Identity</h1>
      <p className="text-gray-600 mb-6">
        Brand templates: letterhead, cover page, NDA, contract, email signature, presentation. Download as HTML (use Print to PDF in browser for PDF). Edit and version control. Super Admin only.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm mb-4">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading templates…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold text-secondary mb-1">{item.name}</h3>
              <p className="text-xs text-gray-500 mb-3">
                {item.updatedAt ? `Updated ${new Date(item.updatedAt).toLocaleDateString()}` : 'Default template'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(item.key, item.name)}
                  disabled={!!downloading}
                  className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {downloading === item.key ? 'Opening…' : 'Open / Print to PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadAsFile(item.key, item.name)}
                  disabled={!!downloading}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Download HTML
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(item.key)}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="px-4 py-3 border-b flex justify-between items-center">
              <h2 className="font-semibold text-secondary">Edit: {items.find((i) => i.key === editKey)?.name ?? editKey}</h2>
              <button
                type="button"
                onClick={() => setEditKey(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full h-96 font-mono text-sm rounded-lg border border-gray-300 p-3"
                spellCheck={false}
              />
            </div>
            <div className="px-4 py-3 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditKey(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
