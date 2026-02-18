'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setStoredToken, getStoredToken, api } from '@/lib/api';

const FALLBACK_SKILLS = ['Frontend Developer', 'Backend Developer', 'UI/UX Designer', 'Project Manager', 'Marketing Specialist', 'Other'];
const AVAILABILITY_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'freelance', label: 'Freelance' },
] as const;

export default function RegisterTalentPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillList, setSkillList] = useState<string[]>(FALLBACK_SKILLS);
  const [roleCategories, setRoleCategories] = useState<string[]>(['Tech Roles', 'Creative Roles', 'Business Roles']);
  const [roleCategory, setRoleCategory] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [yearsExperience, setYearsExperience] = useState(5);
  const [shortBio, setShortBio] = useState('');
  const [availability, setAvailability] = useState<'full_time' | 'part_time' | 'freelance' | ''>('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [cvUrl, setCvUrl] = useState('');
  const [pastProjectTitle, setPastProjectTitle] = useState('');
  const [pastProjects, setPastProjects] = useState<Array<{ title: string; description?: string; url?: string }>>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/v1/hiring/config`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.skillList?.length) setSkillList(data.skillList);
        if (data?.roleCategories?.length) setRoleCategories(data.roleCategories);
      })
      .catch(() => {});
  }, []);

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const addPastProject = () => {
    if (!pastProjectTitle.trim()) return;
    setPastProjects((prev) => [...prev, { title: pastProjectTitle.trim() }]);
    setPastProjectTitle('');
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const token = getStoredToken();
      const data = await api.talent.apply(
        {
          name: name.trim(),
          email: email.trim(),
          password: password || undefined,
          skills: skills.length ? skills : [customRole || 'Other'],
          customRole: customRole.trim() || undefined,
          roleCategory: roleCategory.trim() || undefined,
          yearsExperience,
          shortBio: shortBio.trim() || undefined,
          availability: availability || undefined,
          country: country.trim() || undefined,
          phone: phone.trim() || undefined,
          portfolioUrl: portfolioUrl.trim() || undefined,
          resumeUrl: resumeUrl.trim() || undefined,
          cvUrl: cvUrl.trim() || undefined,
          pastProjects: pastProjects.length ? pastProjects : undefined,
        },
        token ?? undefined
      );
      if (data.token) setStoredToken(data.token);
      router.push('/dashboard/talent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Application failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/hiring" className="inline-flex items-center gap-2 text-sm text-primary hover:gap-3 transition-all font-medium">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hiring
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white/90 backdrop-blur-sm p-8 md:p-10 shadow-xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image src="/RiseFlowHub%20logo.png" alt="RiseFlow Hub" width={120} height={40} className="h-10 w-auto object-contain" />
            </div>
            <div className="inline-flex items-center gap-2 mb-3 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-medium text-emerald-700">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Talent Registration
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              Join as Talent
            </h1>
            <p className="text-gray-600 text-sm max-w-lg mx-auto">
              Submit your profile for approval. Only approved talents appear in the marketplace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">1</div>
                Basic Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Full name *</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Email *</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Password *</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    minLength={6} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                    placeholder="Min 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Country</label>
                  <input 
                    type="text" 
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    placeholder="e.g. Nigeria" 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Phone</label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="+234..." 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">2</div>
                Professional Details
              </h3>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Role category</label>
                <select 
                  value={roleCategory} 
                  onChange={(e) => setRoleCategory(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                >
                  <option value="">Select category</option>
                  {roleCategories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Skills * (Select one or more)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {skillList.map((s) => (
                    <button 
                      key={s} 
                      type="button" 
                      onClick={() => toggleSkill(s)} 
                      className={`rounded-full px-4 py-2 text-xs font-medium transition-all ${
                        skills.includes(s) 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <input 
                  type="text" 
                  placeholder="Or type custom role" 
                  value={customRole} 
                  onChange={(e) => setCustomRole(e.target.value)} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Years of experience *</label>
                  <input 
                    type="number" 
                    min={0} 
                    max={50} 
                    value={yearsExperience} 
                    onChange={(e) => setYearsExperience(Number(e.target.value))} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Availability</label>
                  <select 
                    value={availability} 
                    onChange={(e) => setAvailability(e.target.value as typeof availability)} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all cursor-pointer"
                  >
                    <option value="">Select</option>
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Short bio</label>
                <textarea 
                  value={shortBio} 
                  onChange={(e) => setShortBio(e.target.value)} 
                  rows={3} 
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  placeholder="Brief intro and what you offer..." 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">3</div>
                Portfolio & Experience
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Portfolio URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={portfolioUrl} 
                    onChange={(e) => setPortfolioUrl(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Resume URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={resumeUrl} 
                    onChange={(e) => setResumeUrl(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">CV URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    value={cvUrl} 
                    onChange={(e) => setCvUrl(e.target.value)} 
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Past projects</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Project title" 
                    value={pastProjectTitle} 
                    onChange={(e) => setPastProjectTitle(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPastProject())} 
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all" 
                  />
                  <button 
                    type="button" 
                    onClick={addPastProject} 
                    className="rounded-lg bg-gray-100 hover:bg-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 transition-all"
                  >
                    Add
                  </button>
                </div>
                {pastProjects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pastProjects.map((p, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs text-emerald-700">
                        {p.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 py-4 text-sm font-semibold text-white hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : 'Submit for Approval'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-500">
            After approval you can pay the $7 marketplace fee to appear in the marketplace.{' '}
            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline">
              Already have an account?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
