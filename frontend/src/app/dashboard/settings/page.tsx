'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  api,
  getStoredToken,
  type SettingsActivityItem,
  type SettingsBilling,
  type SettingsNotificationPreferences,
  type SettingsPreferences,
  type SettingsPrivacy,
  type SettingsProfile,
  type SettingsSessionItem,
} from '@/lib/api';
import { ProfileImageUploader } from '@/components/common/ProfileImageUploader';

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
  const [profile, setProfile] = useState<SettingsProfile | null>(null);
  const [notifications, setNotifications] = useState<SettingsNotificationPreferences | null>(null);
  const [preferences, setPreferences] = useState<SettingsPreferences | null>(null);
  const [privacy, setPrivacy] = useState<SettingsPrivacy | null>(null);
  const [billing, setBilling] = useState<SettingsBilling | null>(null);
  const [accountStatus, setAccountStatus] = useState<{ status: string } | null>(null);
  const [securityEmail, setSecurityEmail] = useState<{ newEmail: string; password: string }>({ newEmail: '', password: '' });
  const [securityPassword, setSecurityPassword] = useState<{ currentPassword: string; newPassword: string }>({ currentPassword: '', newPassword: '' });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessions, setSessions] = useState<SettingsSessionItem[]>([]);
  const [activity, setActivity] = useState<SettingsActivityItem[]>([]);
  const [deleteReason, setDeleteReason] = useState<string>('temporary_break');
  const [deleteOther, setDeleteOther] = useState<string>('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileCompletionPercent, setProfileCompletionPercent] = useState(0);

  const token = useMemo(() => (typeof window !== 'undefined' ? getStoredToken() : null), []);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    setError(null);

    Promise.all([
      api.settings.profile.get(token).then((data) => {
        setProfile(data);
        setProfileCompletionPercent(data.profileCompletionPercent ?? 0);
        setTwoFactorEnabled(!!data.twoFactorEnabled);
        setSecurityEmail((prev) => ({ ...prev, newEmail: data.email || '' }));
      }),
      api.settings.profileMedia.status(token).then((status) => {
        setProfileCompletionPercent(status.profileCompletionPercent);
        setProfile((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            avatarUrl: status.avatarUrl,
            companyLogoUrl: status.companyLogoUrl,
            profileCompleted: status.profileCompleted,
            profileCompletionPercent: status.profileCompletionPercent,
            completionRequirements: status.completionRequirements,
            client: prev.client
              ? {
                  ...prev.client,
                  logoUrl: status.companyLogoUrl ?? prev.client.logoUrl,
                }
              : prev.client,
          };
        });
      }).catch(() => {}),
      api.settings.notifications.get(token).then(setNotifications),
      api.settings.preferences.get(token).then(setPreferences).catch(() =>
        setPreferences({ theme: 'system', language: 'en', dashboardLayout: 'default' })
      ),
      api.settings.privacy.get(token).then(setPrivacy).catch(() =>
        setPrivacy({ profileVisibility: 'public', messagePreference: 'anyone' })
      ),
      api.settings.billing.get(token).then(setBilling).catch(() => setBilling(null)),
      api.settings.accountStatus.get(token).then(setAccountStatus).catch(() => setAccountStatus(null)),
      api.settings.security.sessions(token).then((result) => setSessions(result.sessions)).catch(() => setSessions([])),
      api.settings.activity(token, 30).then((result) => setActivity(result.items)).catch(() => setActivity([])),
    ])
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function saveProfile() {
    if (!token || !profile) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const payload = {
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
        companyLogoUrl: profile.companyLogoUrl,
        company: profile.client
          ? {
              businessName: profile.client.businessName,
              industry: profile.client.industry,
              companySize: profile.client.companySize,
              headquarters: profile.client.headquarters,
              logoUrl: profile.client.logoUrl,
              coverImageUrl: profile.client.coverImageUrl,
          }
          : undefined,
      };

      const updated = await api.settings.profile.update(payload, token);
      setProfile((prev) => (prev ? { ...prev, ...updated } : updated));
      setProfileCompletionPercent(updated.profileCompletionPercent ?? profileCompletionPercent);
      setSuccess('Profile updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  function isBusinessRole(role?: string): boolean {
    return role === 'client' || role === 'hirer' || role === 'hiring_company';
  }

  async function uploadAvatar(file: File) {
    if (!token) return;
    const result = await api.settings.profileMedia.uploadAvatar(file, token);
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        avatarUrl: result.avatarUrl ?? prev.avatarUrl,
        profileCompleted: result.profileCompleted ?? prev.profileCompleted,
        profileCompletionPercent: result.profileCompletionPercent ?? prev.profileCompletionPercent,
      };
    });
    if (result.profileCompletionPercent != null) setProfileCompletionPercent(result.profileCompletionPercent);
    setSuccess('Profile image updated');
  }

  async function removeAvatar() {
    if (!token) return;
    const result = await api.settings.profileMedia.deleteAvatar(token);
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        avatarUrl: null,
        profileCompleted: result.profileCompleted,
        profileCompletionPercent: result.profileCompletionPercent,
      };
    });
    setProfileCompletionPercent(result.profileCompletionPercent);
    setSuccess('Profile image removed');
  }

  async function uploadCompanyLogo(file: File) {
    if (!token) return;
    const result = await api.settings.profileMedia.uploadCompanyLogo(file, token);
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        companyLogoUrl: result.companyLogoUrl ?? prev.companyLogoUrl,
        profileCompleted: result.profileCompleted ?? prev.profileCompleted,
        profileCompletionPercent: result.profileCompletionPercent ?? prev.profileCompletionPercent,
        client: prev.client
          ? {
              ...prev.client,
              logoUrl: result.companyLogoUrl ?? prev.client.logoUrl,
            }
          : prev.client,
      };
    });
    if (result.profileCompletionPercent != null) setProfileCompletionPercent(result.profileCompletionPercent);
    setSuccess('Company logo updated');
  }

  async function removeCompanyLogo() {
    if (!token) return;
    const result = await api.settings.profileMedia.deleteCompanyLogo(token);
    setProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        companyLogoUrl: null,
        profileCompleted: result.profileCompleted,
        profileCompletionPercent: result.profileCompletionPercent,
        client: prev.client
          ? {
              ...prev.client,
              logoUrl: null,
            }
          : prev.client,
      };
    });
    setProfileCompletionPercent(result.profileCompletionPercent);
    setSuccess('Company logo removed');
  }

  async function saveNotifications() {
    if (!token || !notifications) return;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const updated = await api.settings.notifications.update(notifications, token);
      setNotifications(updated);
      setSuccess('Notification preferences updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save notifications');
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    if (!token || !preferences) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.settings.preferences.update(preferences, token);
      setPreferences(updated);
      setSuccess('Preferences updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  }

  async function savePrivacy() {
    if (!token || !privacy) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.settings.privacy.update(privacy, token);
      setPrivacy(updated);
      setSuccess('Privacy settings updated');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save privacy');
    } finally {
      setSaving(false);
    }
  }

  async function saveSecurityEmail() {
    if (!token || !securityEmail.newEmail.trim() || !securityEmail.password.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.settings.security.updateEmail(
        { newEmail: securityEmail.newEmail.trim(), password: securityEmail.password },
        token
      );
      setProfile((prev) => (prev ? { ...prev, email: updated.email } : prev));
      setSecurityEmail({ newEmail: updated.email, password: '' });
      setSuccess('Email updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update email');
    } finally {
      setSaving(false);
    }
  }

  async function saveSecurityPassword() {
    if (!token || !securityPassword.currentPassword || !securityPassword.newPassword) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.settings.security.updatePassword(
        {
          currentPassword: securityPassword.currentPassword,
          newPassword: securityPassword.newPassword,
        },
        token
      );
      setSecurityPassword({ currentPassword: '', newPassword: '' });
      setSuccess('Password updated successfully');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  }

  async function toggleTwoFactor() {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.settings.security.set2FA(!twoFactorEnabled, token);
      setTwoFactorEnabled(updated.twoFactorEnabled);
      setSuccess(updated.twoFactorEnabled ? 'Two-factor authentication enabled' : 'Two-factor authentication disabled');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update two-factor authentication');
    } finally {
      setSaving(false);
    }
  }

  async function revokeSession(id: string) {
    if (!token) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.settings.security.revokeSession(id, token);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      setSuccess('Session revoked');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to revoke session');
    } finally {
      setSaving(false);
    }
  }

  async function downloadDataExport() {
    if (!token) return;
    try {
      const blob = await api.settings.downloadDataExport(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'riseflow-data-export.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to download data');
    }
  }

  function formatActivityValue(value: string | null): string {
    if (!value) return '—';
    try {
      const parsed = JSON.parse(value) as unknown;
      if (typeof parsed === 'string' || typeof parsed === 'number' || typeof parsed === 'boolean') {
        return String(parsed);
      }
      return JSON.stringify(parsed);
    } catch {
      return value;
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
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Profile completion</span>
              <span className="text-gray-600">{profileCompletionPercent}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-primary transition-all"
                style={{ width: `${Math.max(0, Math.min(100, profileCompletionPercent))}%` }}
              />
            </div>
            {profileCompletionPercent < 100 && (
              <p className="text-xs text-amber-700">
                Complete your profile picture and bio to unlock full profile completion.
              </p>
            )}
          </div>

          <ProfileImageUploader
            label="Profile picture"
            imageUrl={profile.avatarUrl}
            name={profile.name}
            onUpload={uploadAvatar}
            onRemove={removeAvatar}
            disabled={saving}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile((p) => (p ? { ...p, name: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display name</label>
              <input
                type="text"
                value={profile.displayName || ''}
                onChange={(e) => setProfile((p) => (p ? { ...p, displayName: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, bio: e.target.value } : p))}
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
                onChange={(e) => setProfile((p) => (p ? { ...p, jobTitle: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input
                type="url"
                value={profile.website || ''}
                onChange={(e) => setProfile((p) => (p ? { ...p, website: e.target.value } : p))}
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
                onChange={(e) => setProfile((p) => (p ? { ...p, linkedinUrl: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X</label>
              <input
                type="url"
                value={profile.twitterUrl || ''}
                onChange={(e) => setProfile((p) => (p ? { ...p, twitterUrl: e.target.value } : p))}
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
                onChange={(e) => setProfile((p) => (p ? { ...p, phone: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={(e) => setProfile((p) => (p ? { ...p, country: e.target.value } : p))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
            <input
              type="text"
              value={profile.timezone || ''}
              onChange={(e) => setProfile((p) => (p ? { ...p, timezone: e.target.value } : p))}
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
          {isBusinessRole(profile.role) && (
            <ProfileImageUploader
              label="Company logo"
              imageUrl={profile.companyLogoUrl ?? profile.client.logoUrl}
              name={profile.client.businessName}
              onUpload={uploadCompanyLogo}
              onRemove={removeCompanyLogo}
              disabled={saving}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
              <input
                type="text"
                value={profile.client.businessName || ''}
                onChange={(e) =>
                  setProfile((p) =>
                    p && p.client ? { ...p, client: { ...p.client, businessName: e.target.value } } : p
                  )
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
                  setProfile((p) =>
                    p && p.client ? { ...p, client: { ...p.client, industry: e.target.value } } : p
                  )
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
                  setProfile((p) =>
                    p && p.client ? { ...p, client: { ...p.client, companySize: e.target.value } } : p
                  )
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
                  setProfile((p) =>
                    p && p.client ? { ...p, client: { ...p.client, headquarters: e.target.value } } : p
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover image URL</label>
              <input
                type="url"
                value={profile.client.coverImageUrl || ''}
                onChange={(e) =>
                  setProfile((p) =>
                    p && p.client ? { ...p, client: { ...p.client, coverImageUrl: e.target.value } } : p
                  )
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
              onChange={(e) => setNotifications((n) => (n ? { ...n, emailNotifications: e.target.checked } : n))}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.inAppNotifications}
              onChange={(e) => setNotifications((n) => (n ? { ...n, inAppNotifications: e.target.checked } : n))}
            />
            <span>In-app notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.dealUpdates}
              onChange={(e) => setNotifications((n) => (n ? { ...n, dealUpdates: e.target.checked } : n))}
            />
            <span>Deal updates</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.investorMessages}
              onChange={(e) => setNotifications((n) => (n ? { ...n, investorMessages: e.target.checked } : n))}
            />
            <span>Investor messages</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.projectAlerts}
              onChange={(e) => setNotifications((n) => (n ? { ...n, projectAlerts: e.target.checked } : n))}
            />
            <span>Project progress alerts</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!notifications.marketingEmails}
              onChange={(e) => setNotifications((n) => (n ? { ...n, marketingEmails: e.target.checked } : n))}
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
          <p className="text-gray-600">Change your email, password, manage 2FA, and review account activity.</p>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-secondary">Email</h3>
              <input
                type="email"
                value={securityEmail.newEmail}
                onChange={(e) => setSecurityEmail((prev) => ({ ...prev, newEmail: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="New email"
              />
              <input
                type="password"
                value={securityEmail.password}
                onChange={(e) => setSecurityEmail((prev) => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Current password"
              />
              <button
                type="button"
                onClick={saveSecurityEmail}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Update email
              </button>
            </div>

            <div className="space-y-2 rounded-lg border border-gray-200 p-4">
              <h3 className="font-medium text-secondary">Password</h3>
              <input
                type="password"
                value={securityPassword.currentPassword}
                onChange={(e) => setSecurityPassword((prev) => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Current password"
              />
              <input
                type="password"
                value={securityPassword.newPassword}
                onChange={(e) => setSecurityPassword((prev) => ({ ...prev, newPassword: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="New password (min 8 chars)"
              />
              <button
                type="button"
                onClick={saveSecurityPassword}
                disabled={saving}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Update password
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-secondary">Two-factor authentication</p>
              <p className="text-xs text-gray-600">Current status: {twoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
            <button
              type="button"
              onClick={toggleTwoFactor}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-2">
            <h3 className="font-medium text-secondary">Recent sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-xs text-gray-500">No recent sessions.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <li key={session.id} className="py-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-700">{new Date(session.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{session.details?.ip ? `IP: ${String(session.details.ip)}` : 'Session record'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => revokeSession(session.id)}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Revoke
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 p-4 space-y-2">
            <h3 className="font-medium text-secondary">Settings activity</h3>
            {activity.length === 0 ? (
              <p className="text-xs text-gray-500">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {activity.slice(0, 12).map((item) => (
                  <li key={item.id} className="py-2">
                    <p className="text-sm text-gray-800">{item.action.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()} · {item.fieldChanged || 'general'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {formatActivityValue(item.oldValue)} → {formatActivityValue(item.newValue)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
                  setPrivacy((p) => (p ? { ...p, profileVisibility: e.target.value } : p))
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
                  setPrivacy((p) => (p ? { ...p, messagePreference: e.target.value } : p))
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
              onClick={savePrivacy}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              Save privacy
            </button>
            <button
              type="button"
              onClick={downloadDataExport}
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
                  setPreferences((p) => (p ? { ...p, theme: e.target.value } : p))
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
                  setPreferences((p) => (p ? { ...p, language: e.target.value } : p))
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
                setPreferences((p) => (p ? { ...p, dashboardLayout: e.target.value } : p))
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
              onClick={savePreferences}
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
                        const data = await api.settings.accountStatus.requestDelete(
                          {
                            reason: deleteReason,
                            otherReason: deleteReason === 'other' ? deleteOther : undefined,
                          },
                          token
                        );
                        setAccountStatus({ status: data.status ?? 'pending_deletion' });
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
                    await api.settings.accountStatus.cancelDelete(token);
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

