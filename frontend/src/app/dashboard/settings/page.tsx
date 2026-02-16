'use client';

import { useEffect, useState } from 'react';
import { getStoredToken } from '@/lib/api';

type Tab =
  | 'profile'
  | 'company'
  | 'security'
  | 'notifications'
  | 'billing'
  | 'privacy'
  | 'preferences'
  | 'account';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [notifications, setNotifications] = useState<any | null>(null);
  const [preferences, setPreferences] = useState<any | null>(null);
  const [privacy, setPrivacy] = useState<any | null>(null);
  const [billing, setBilling] = useState<any | null>(null);
  const [accountStatus, setAccountStatus] = useState<{ status: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState<string>('temporary_break');
  const [deleteOther, setDeleteOther] = useState<string>('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch('/api/v1/settings/profile', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load profile'))))
        .then(setProfile),
      fetch('/api/v1/settings/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load notifications'))))
        .then(setNotifications),
      fetch('/api/v1/settings/preferences', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load preferences'))))
        .then(setPreferences)
        .catch(() => setPreferences({ theme: 'system', language: 'en', dashboardLayout: 'default' })),
      fetch('/api/v1/settings/privacy', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load privacy'))))
        .then(setPrivacy)
        .catch(() => setPrivacy({ profileVisibility: 'public', messagePreference: 'anyone' })),
      fetch('/api/v1/settings/billing', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load billing'))))
        .then(setBilling)
        .catch(() => setBilling(null)),
      fetch('/api/v1/settings/account-status', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load account status'))))
        .then(setAccountStatus)
        .catch(() => setAccountStatus(null)),
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const token = typeof window !== 'undefined' ? getStoredToken() : null;

  async function saveProfile() {
    if (!token || !profile) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const payload: any = {
        name: profile.name,
        displayName: profile.displayName,
        bio: profile.bio,
        jobTitle: profile.jobTitle,
        website: profile.website,
        linkedinUrl: profile.linkedinUrl,
        twitterUrl: profile.twitterUrl,
        phone: profile.phone,
        country: profile.country,
        timezone: profile.timezone,
      };
      if (profile.client) {
        payload.company = {
          businessName: profile.client.businessName,
          industry: profile.client.industry,
          companySize: profile.client.companySize,
          headquarters: profile.client.headquarters,
          logoUrl: profile.client.logoUrl,
          coverImageUrl: profile.client.coverImageUrl,
        };
      }
      const res = await fetch('/api/v1/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to save profile');
      }
      const updated = await res.json();
      setProfile((prev: any) => ({ ...prev, ...updated }));
      setSuccess('Profile updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    if (!token || !notifications) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/v1/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(notifications),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any).error || 'Failed to save notifications');
      }
      const updated = await res.json();
      setNotifications(updated);
      setSuccess('Notification preferences updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save notifications');
    } finally {
      setSaving(false);
    }
  }

  if (!token) return null;

  if (loading) {
    return (
      <div className="max-w-3xl">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile, security, and notifications.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'profile', label: 'Profile' },
          { id: 'company', label: 'Company' },
          { id: 'security', label: 'Account & Security' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'billing', label: 'Billing' },
          { id: 'privacy', label: 'Privacy' },
          { id: 'preferences', label: 'Preferences' },
          { id: 'account', label: 'Delete Account' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id as Tab);
              setSuccess(null);
              setError(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm">{success}</div>
      )}

      {tab === 'profile' && profile && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={profile.displayName || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, displayName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile((p: any) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job title</label>
              <input
                type="text"
                value={profile.jobTitle || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, jobTitle: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, website: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
              <input
                type="url"
                value={profile.linkedinUrl || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, linkedinUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X</label>
              <input
                type="url"
                value={profile.twitterUrl || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, twitterUrl: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={(e) => setProfile((p: any) => ({ ...p, country: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input
              type="text"
              value={profile.timezone || ''}
              onChange={(e) => setProfile((p: any) => ({ ...p, timezone: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="e.g. Europe/London"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save profile'}
            </button>
          </div>
        </div>
      )}

      {tab === 'company' && profile?.client && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Company profile</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input
                type="text"
                value={profile.client.businessName || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, businessName: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
              <input
                type="text"
                value={profile.client.industry || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, industry: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company size</label>
              <input
                type="text"
                value={profile.client.companySize || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, companySize: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters</label>
              <input
                type="text"
                value={profile.client.headquarters || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, headquarters: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
              <input
                type="url"
                value={profile.client.logoUrl || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, logoUrl: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL</label>
              <input
                type="url"
                value={profile.client.coverImageUrl || ''}
                onChange={(e) =>
                  setProfile((p: any) => ({ ...p, client: { ...p.client, coverImageUrl: e.target.value } }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveProfile}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save company'}
            </button>
          </div>
        </div>
      )}

      {tab === 'notifications' && notifications && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Notification preferences</h2>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.emailNotifications}
              onChange={(e) => setNotifications((n: any) => ({ ...n, emailNotifications: e.target.checked }))}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.inAppNotifications}
              onChange={(e) => setNotifications((n: any) => ({ ...n, inAppNotifications: e.target.checked }))}
            />
            <span>In-app notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.dealUpdates}
              onChange={(e) => setNotifications((n: any) => ({ ...n, dealUpdates: e.target.checked }))}
            />
            <span>Deal updates</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.investorMessages}
              onChange={(e) => setNotifications((n: any) => ({ ...n, investorMessages: e.target.checked }))}
            />
            <span>Investor messages</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.projectAlerts}
              onChange={(e) => setNotifications((n: any) => ({ ...n, projectAlerts: e.target.checked }))}
            />
            <span>Project progress alerts</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.marketingEmails}
              onChange={(e) => setNotifications((n: any) => ({ ...n, marketingEmails: e.target.checked }))}
            />
            <span>Marketing emails</span>
          </label>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={saveNotifications}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save notifications'}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Account & Security</h2>
          <p className="text-gray-600">Change your email, password, and manage 2FA.</p>
          <p className="text-xs text-gray-500 mt-2">
            (Security changes are wired to backend endpoints but this UI keeps it minimal; you can expand it later.)
          </p>
        </div>
      )}

      {tab === 'billing' && billing && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Billing & subscriptions</h2>
          <p className="text-gray-700">
            Setup fee status:{' '}
            <span className="font-medium">
              {billing.setupFeeStatus === 'paid' ? 'Paid' : 'Not paid yet'}
            </span>
          </p>
          <p className="text-gray-700">
            Marketplace fees: <span className="font-medium">{billing.marketplaceFeeStatus}</span>
          </p>
          <div className="mt-4">
            <h3 className="font-semibold text-secondary mb-2">Recent payments</h3>
            {billing.payments?.length ? (
              <ul className="divide-y divide-gray-200">
                {billing.payments.slice(0, 10).map((p: any) => (
                  <li key={p.id} className="py-2 flex justify-between">
                    <span className="text-gray-700 text-sm">
                      {p.type} · {p.status}
                    </span>
                    <span className="text-gray-900 text-sm font-medium">
                      {Number(p.amount)} {p.currency}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">No payments yet.</p>
            )}
          </div>
        </div>
      )}

      {tab === 'privacy' && privacy && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Data & privacy</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile visibility</label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) =>
                  setPrivacy((p: any) => ({ ...p, profileVisibility: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Who can message you</label>
              <select
                value={privacy.messagePreference}
                onChange={(e) =>
                  setPrivacy((p: any) => ({ ...p, messagePreference: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="anyone">Anyone</option>
                <option value="investors_only">Investors only</option>
                <option value="no_one">No one</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={async () => {
                if (!token) return;
                setError(null);
                setSuccess(null);
                try {
                  const res = await fetch('/api/v1/settings/privacy', {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(privacy),
                  });
                  if (!res.ok) throw new Error('Failed to save privacy');
                  setSuccess('Privacy settings updated');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed to save privacy');
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Save privacy
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!token) return;
                try {
                  const res = await fetch('/api/v1/settings/data-export', {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error('Failed to export data');
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'riseflow-data-export.json';
                  a.click();
                  URL.revokeObjectURL(url);
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed to download data');
                }
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Download personal data
            </button>
          </div>
        </div>
      )}

      {tab === 'preferences' && preferences && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-secondary mb-2">Preferences</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) =>
                  setPreferences((p: any) => ({ ...p, theme: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={preferences.language}
                onChange={(e) =>
                  setPreferences((p: any) => ({ ...p, language: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dashboard layout</label>
            <select
              value={preferences.dashboardLayout}
              onChange={(e) =>
                setPreferences((p: any) => ({ ...p, dashboardLayout: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="default">Default</option>
              <option value="compact">Compact</option>
            </select>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                if (!token) return;
                setError(null);
                setSuccess(null);
                try {
                  const res = await fetch('/api/v1/settings/preferences', {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(preferences),
                  });
                  if (!res.ok) throw new Error('Failed to save preferences');
                  setSuccess('Preferences updated');
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Failed to save preferences');
                }
              }}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Save preferences
            </button>
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 space-y-4 text-sm">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Delete account</h2>
          <p className="text-red-700">
            Your account will be scheduled for deletion in 14 days. You can restore it anytime before then by logging in
            and cancelling the request.
          </p>
          <p className="text-sm text-red-800 font-medium">
            Current status:{' '}
            <span className="uppercase">
              {accountStatus?.status ?? 'active'}
            </span>
          </p>
          <div className="space-y-2">
            <p className="font-medium text-sm text-red-800">Why are you leaving?</p>
            {[
              { id: 'too_expensive', label: 'Too expensive' },
              { id: 'not_useful', label: 'Not useful' },
              { id: 'found_other', label: 'Found another platform' },
              { id: 'privacy', label: 'Privacy concerns' },
              { id: 'temporary_break', label: 'Temporary break' },
              { id: 'other', label: 'Other' },
            ].map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="delete-reason"
                  value={r.id}
                  checked={deleteReason === r.id}
                  onChange={() => setDeleteReason(r.id)}
                />
                <span>{r.label}</span>
              </label>
            ))}
            {deleteReason === 'other' && (
              <textarea
                value={deleteOther}
                onChange={(e) => setDeleteOther(e.target.value)}
                className="mt-2 w-full rounded-lg border border-red-200 px-3 py-2 text-sm"
                placeholder="Tell us more (optional)"
              />
            )}
          </div>
          <div className="space-y-3 pt-2">
            {!confirmingDelete ? (
              <button
                type="button"
                onClick={() => setConfirmingDelete(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Continue to delete confirmation
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-800">
                  Are you sure? Your account will be scheduled for deletion in 14 days. You can restore it by logging in
                  and cancelling before then.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!token) return;
                      setError(null);
                      setSuccess(null);
                      try {
                        const res = await fetch('/api/v1/settings/delete-request', {
                          method: 'POST',
                          headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            reason: deleteReason,
                            otherReason: deleteReason === 'other' ? deleteOther : undefined,
                          }),
                        });
                        if (!res.ok) throw new Error('Failed to request deletion');
                        const data = await res.json().catch(() => ({}));
                        setAccountStatus({ status: (data as any).status ?? 'pending_deletion' });
                        setSuccess('Deletion requested. Your account is now pending deletion.');
                      } catch (e) {
                        setError(e instanceof Error ? e.message : 'Failed to request deletion');
                      } finally {
                        setConfirmingDelete(false);
                      }
                    }}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Confirm delete request
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
          {accountStatus?.status === 'pending_deletion' && (
            <div className="pt-4 border-t border-red-200 mt-4">
              <p className="text-sm text-red-800 mb-2">
                Changed your mind? You can restore your account before the 14 days are over.
              </p>
              <button
                type="button"
                onClick={async () => {
                  if (!token) return;
                  setError(null);
                  setSuccess(null);
                  try {
                    const res = await fetch('/api/v1/settings/delete-cancel', {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` },
                    });
                    if (!res.ok) throw new Error('Failed to cancel deletion');
                    setAccountStatus({ status: 'active' });
                    setSuccess('Account deletion cancelled. Your account is active again.');
                  } catch (e) {
                    setError(e instanceof Error ? e.message : 'Failed to cancel deletion');
                  }
                }}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-700 border border-red-300 hover:bg-red-100"
              >
                Restore account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

