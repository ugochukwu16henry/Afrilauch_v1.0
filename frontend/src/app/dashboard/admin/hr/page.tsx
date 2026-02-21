'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type TalentListItem } from '@/lib/api';
import type { AdminCreateTalentBody } from '@/lib/api';

const FALLBACK_SKILLS = [
  'HR Manager',
  'Marketing Specialist',
  'Project Manager',
  'Graphic Designer',
  'UI/UX Designer',
  'Video Editor',
  'AI Engineer',
  'Backend Developer',
  'Data Analyst',
  'DevOps Engineer',
  'Frontend Developer',
  'Full Stack Developer',
  'Mobile Developer',
];

const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
] as const;

export default function HRDashboardPage() {
  const [talents, setTalents] = useState<TalentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [skillList, setSkillList] = useState<string[]>(FALLBACK_SKILLS);
  const [roleCategories, setRoleCategories] = useState<string[]>(['Tech Roles', 'Creative Roles', 'Business Roles']);
  const [pastProjectTitle, setPastProjectTitle] = useState('');
  const [createForm, setCreateForm] = useState<AdminCreateTalentBody>({
    name: '',
    email: '',
    password: '',
    skills: [],
    yearsExperience: 1,
    roleCategory: '',
    customRole: '',
    shortBio: '',
    portfolioUrl: '',
    resumeUrl: '',
    cvUrl: '',
    pastProjects: [],
    availability: undefined,
    country: '',
    phone: '',
  });

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth
      .me(token)
      .then((u) => setIsSuperAdmin(u.role === 'super_admin'))
      .catch(() => setIsSuperAdmin(false));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hiring/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.skillList?.length) setSkillList(data.skillList);
        if (data?.roleCategories?.length) setRoleCategories(data.roleCategories);
      })
      .catch(() => {});

    api.talent.list(token, filter === 'all' ? undefined : filter)
      .then((r) => setTalents(r.items))
      .catch(() => setTalents([]))
      .finally(() => setLoading(false));
  }, [filter]);

  function toggleSkill(skill: string) {
    setCreateForm((prev) => ({
      ...prev,
      skills: prev.skills?.includes(skill)
        ? (prev.skills || []).filter((s) => s !== skill)
        : [...(prev.skills || []), skill],
    }));
  }

  function addPastProject() {
    if (!pastProjectTitle.trim()) return;
    setCreateForm((prev) => ({
      ...prev,
      pastProjects: [...(prev.pastProjects || []), { title: pastProjectTitle.trim() }],
    }));
    setPastProjectTitle('');
  }

  async function handleApprove(id: string, status: 'approved' | 'rejected') {
    const token = getStoredToken();
    if (!token) return;
    try {
      await api.talent.approve(id, status, token);
      setTalents((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    } catch (e) {
      console.error(e);
    }
  }

  async function handleCreateTalent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const token = getStoredToken();
    if (!token || !isSuperAdmin) return;

    const skills = (createForm.skills || []).length
      ? (createForm.skills || [])
      : (createForm.customRole?.trim() ? [createForm.customRole.trim()] : []);

    if (skills.length === 0) {
      setError('Please enter at least one skill.');
      return;
    }

    setCreating(true);
    setError('');
    try {
      await api.talent.adminCreate(
        {
          ...createForm,
          skills,
          yearsExperience: Number(createForm.yearsExperience || 0),
        },
        token
      );
      setCreateForm({
        name: '',
        email: '',
        password: '',
        skills: [],
        yearsExperience: 1,
        roleCategory: '',
        customRole: '',
        shortBio: '',
        portfolioUrl: '',
        resumeUrl: '',
        cvUrl: '',
        pastProjects: [],
        availability: undefined,
        country: '',
        phone: '',
      });
      setPastProjectTitle('');
      const refreshed = await api.talent.list(token, filter === 'all' ? undefined : filter);
      setTalents(refreshed.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add talent');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">HR Manager — Talent review</h1>
      <p className="text-gray-600 mb-6">Approve or reject talent applications. Only approved talents appear in the marketplace.</p>

      {isSuperAdmin && (
        <form onSubmit={handleCreateTalent} className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-secondary mb-3 uppercase tracking-wide">Add Talent Directly to Marketplace</h2>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">1. Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Full name"
                value={createForm.name}
                onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
              <input
                type="email"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Email"
                value={createForm.email}
                onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="password"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Password (for new user)"
                value={createForm.password || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
              />
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Country (e.g. Nigeria)"
                value={createForm.country || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
              />
              <input
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Phone (+234...)"
                value={createForm.phone || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide pt-2">2. Professional Details</h3>
            <select
              value={createForm.roleCategory || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, roleCategory: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select category</option>
              {roleCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {skillList.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSkill(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    (createForm.skills || []).includes(s)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Or type custom role"
              value={createForm.customRole || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, customRole: e.target.value }))}
            />
            <div className="grid md:grid-cols-2 gap-3">
              <input
                type="number"
                min={0}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Years of experience"
                value={createForm.yearsExperience}
                onChange={(e) => setCreateForm((p) => ({ ...p, yearsExperience: Number(e.target.value || 0) }))}
                required
              />
              <select
                value={createForm.availability || ''}
                onChange={(e) =>
                  setCreateForm((p) => ({
                    ...p,
                    availability: (e.target.value || undefined) as AdminCreateTalentBody['availability'],
                  }))
                }
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Select availability</option>
                {AVAILABILITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <textarea
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Short bio"
              value={createForm.shortBio || ''}
              onChange={(e) => setCreateForm((p) => ({ ...p, shortBio: e.target.value }))}
            />

            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide pt-2">3. Portfolio & Experience</h3>
            <div className="grid md:grid-cols-3 gap-3">
              <input
                type="url"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Portfolio URL"
                value={createForm.portfolioUrl || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
              />
              <input
                type="url"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Resume URL"
                value={createForm.resumeUrl || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, resumeUrl: e.target.value }))}
              />
              <input
                type="url"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="CV URL"
                value={createForm.cvUrl || ''}
                onChange={(e) => setCreateForm((p) => ({ ...p, cvUrl: e.target.value }))}
              />
            </div>
            <div>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Project title"
                  value={pastProjectTitle}
                  onChange={(e) => setPastProjectTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addPastProject();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={addPastProject}
                  className="rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                >
                  Add
                </button>
              </div>
              {(createForm.pastProjects || []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {(createForm.pastProjects || []).map((p, i) => (
                    <span key={`${p.title}-${i}`} className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700">
                      {p.title}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? 'Submitting…' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="mb-6 rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : talents.length === 0 ? (
        <p className="text-gray-500">No talents in this category.</p>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name / Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skills</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {talents.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm">
                    <div>{t.user.name}</div>
                    <div className="text-gray-500">{t.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.skills.slice(0, 4).join(', ')}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${t.status === 'approved' ? 'bg-green-100 text-green-800' : t.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.status === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(t.id, 'approved')} className="text-green-600 text-sm font-medium hover:underline mr-2">Approve</button>
                        <button onClick={() => handleApprove(t.id, 'rejected')} className="text-red-600 text-sm font-medium hover:underline">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6">
        <Link href="/dashboard/admin/hr/hirers" className="text-primary font-medium hover:underline">View all hirers →</Link>
        {' · '}
        <Link href="/dashboard/admin/hr/hires" className="text-primary font-medium hover:underline">View all hires →</Link>
      </div>
    </div>
  );
}
