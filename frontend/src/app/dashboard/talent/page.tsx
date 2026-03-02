'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken, api, type TalentProfile } from '@/lib/api';

export default function TalentDashboardPage() {
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.talent.profile(token)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="text-gray-600">No talent profile found. You may need to complete your application.</p>
        <Link href="/register/talent" className="mt-2 inline-block text-primary font-medium hover:underline">Apply as talent</Link>
      </div>
    );
  }

  const isApproved = profile.status === 'approved';
  const canShowInMarketplace = isApproved;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Talent Dashboard</h1>
      <p className="text-gray-600 mb-6">Manage your profile and hire requests.</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">Profile status</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`rounded-full px-3 py-1 text-sm ${profile.status === 'approved' ? 'bg-green-100 text-green-800' : profile.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
            {profile.status}
          </span>
          {profile.feePaid && <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">Fee paid</span>}
        </div>
        <p className="text-sm text-gray-600 mb-2">
          Skills: {profile.skills.join(', ')} · {profile.yearsExperience} years experience
        </p>
        {profile.portfolioUrl && (
          <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">Portfolio →</a>
        )}
        <div className="mt-4 flex gap-3">
          <Link href="/dashboard/talent/hires" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">My hires</Link>
          <Link href="/dashboard/talent/agreements" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Agreements</Link>
        </div>
      </div>

      {canShowInMarketplace && (
        <p className="text-sm text-green-600">You’re visible in the <Link href="/talent-marketplace" className="font-medium hover:underline">Talent Marketplace</Link>.</p>
      )}
    </div>
  );
}
