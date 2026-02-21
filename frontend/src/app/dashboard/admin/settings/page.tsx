 'use client';

import { useEffect, useState } from 'react';
import { getStoredToken, api, type SocialMediaLink, type SuperAdminSystemSettings } from '@/lib/api';

interface FormState {
  platformName: string;
  url: string;
  iconUrl: string;
  active: boolean;
}

export default function AdminSettingsPage() {
  const [links, setLinks] = useState<SocialMediaLink[]>([]);
  const [systemSettings, setSystemSettings] = useState<SuperAdminSystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    platformName: '',
    url: '',
    iconUrl: '',
    active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      api.socialLinks
        .adminList(token)
        .then(setLinks)
        .catch(() => setLinks([])),
      api.superAdmin.settings
        .getSystem(token)
        .then(setSystemSettings)
        .catch(() =>
          setSystemSettings({
            protections: {
              waf: false,
              ddos: false,
              rateLimiting: true,
              aiMonitoring: false,
              dbEncryption: false,
              backups: false,
            },
            ai: { defaultModel: 'openai/gpt-5.2' },
          })
        ),
    ]).finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ platformName: '', url: '', iconUrl: '', active: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    const token = getStoredToken();
    if (!token) {
      setError('You must be signed in as Super Admin to manage social links.');
      return;
    }
    if (!form.platformName.trim() || !form.url.trim()) {
      setError('Platform name and URL are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await api.socialLinks.update(
          editingId,
          {
            platformName: form.platformName.trim(),
            url: form.url.trim(),
            iconUrl: form.iconUrl.trim() || null,
            active: form.active,
          },
          token
        );
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        setMessage('Social link updated.');
      } else {
        const created = await api.socialLinks.create(
          {
            platformName: form.platformName.trim(),
            url: form.url.trim(),
            iconUrl: form.iconUrl.trim() || undefined,
            active: form.active,
          },
          token
        );
        setLinks((prev) => [...prev, created]);
        setMessage('Social link added.');
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save social link.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(link: SocialMediaLink) {
    const token = getStoredToken();
    if (!token) return;
    try {
      const updated = await api.socialLinks.toggle(link.id, token);
      setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch {
      // ignore
    }
  }

  async function handleDelete(link: SocialMediaLink) {
    if (!confirm(`Remove ${link.platformName}?`)) return;
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.socialLinks.remove(link.id, token);
      setLinks((prev) => prev.filter((l) => l.id !== link.id));
    } catch {
      // ignore
    }
  }

  function handleEdit(link: SocialMediaLink) {
    setEditingId(link.id);
    setForm({
      platformName: link.platformName,
      url: link.url,
      iconUrl: link.iconUrl || '',
      active: link.active,
    });
  }

  async function saveSystemSettings() {
    const token = getStoredToken();
    if (!token || !systemSettings) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.superAdmin.settings.updateSystem(systemSettings, token);
      setSystemSettings(updated);
      setMessage('System settings updated. Security status now reflects these controls.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save system settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-secondary mb-2">Settings</h1>
      <p className="text-gray-600 mb-4 text-sm">
        Super Admin control for global social media handles. Changes here update the follow icons across the entire
        platform.
      </p>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-secondary mb-3">System settings</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-4">
          {systemSettings ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.waf}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev
                          ? { ...prev, protections: { ...prev.protections, waf: e.target.checked } }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  WAF protection
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.ddos}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev
                          ? { ...prev, protections: { ...prev.protections, ddos: e.target.checked } }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  DDoS defense
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.aiMonitoring}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev
                          ? { ...prev, protections: { ...prev.protections, aiMonitoring: e.target.checked } }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  AI threat monitoring
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.dbEncryption}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev
                          ? { ...prev, protections: { ...prev.protections, dbEncryption: e.target.checked } }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  Database encryption
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.backups}
                    onChange={(e) =>
                      setSystemSettings((prev) =>
                        prev
                          ? { ...prev, protections: { ...prev.protections, backups: e.target.checked } }
                          : prev
                      )
                    }
                    className="rounded border-gray-300"
                  />
                  Automated backups
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={systemSettings.protections.rateLimiting}
                    disabled
                    className="rounded border-gray-300"
                  />
                  Rate limiting (always on)
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Default AI model</label>
                <input
                  type="text"
                  value={systemSettings.ai.defaultModel}
                  onChange={(e) =>
                    setSystemSettings((prev) =>
                      prev
                        ? { ...prev, ai: { ...prev.ai, defaultModel: e.target.value } }
                        : prev
                    )
                  }
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  placeholder="openai/gpt-5.2"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={saveSystemSettings}
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save system settings'}
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Loading system settings...</p>
          )}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-sm font-semibold text-secondary mb-3">Social media links</h2>
        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          {error && (
            <div className="rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-md bg-emerald-50 border border-emerald-100 px-3 py-2 text-xs text-emerald-800">
              {message}
            </div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Platform name</label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm((f) => ({ ...f, platformName: e.target.value }))}
                placeholder="e.g. LinkedIn, X, YouTube"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Profile URL</label>
              <input
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 items-center">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Custom icon URL (optional)</label>
              <input
                type="url"
                value={form.iconUrl}
                onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                placeholder="https://cdn.example.com/icon.svg"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <label className="mt-4 inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="rounded border-gray-300"
              />
              Show this link on the site
            </label>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add link'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-secondary mb-3">Existing links</h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">Loading social links...</div>
          ) : links.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No social links configured yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Platform</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">URL</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Clicks</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-2 font-medium text-text-dark">{link.platformName}</td>
                    <td className="px-4 py-2 text-xs text-primary truncate max-w-xs">
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {link.url}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-xs">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          link.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {link.active ? 'Active' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {link.clickCount ?? 0}
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      <button
                        type="button"
                        onClick={() => handleEdit(link)}
                        className="mr-2 text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggle(link)}
                        className="mr-2 text-gray-600 hover:underline"
                      >
                        {link.active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
