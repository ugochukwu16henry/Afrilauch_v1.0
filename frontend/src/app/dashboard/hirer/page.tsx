'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getStoredToken, api, type HirerProfile } from '@/lib/api';

export default function HirerDashboardPage() {
  const [profile, setProfile] = useState<HirerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.hirer.profile(token)
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
        <p className="text-gray-600">No hirer profile found.</p>
        <Link href="/register/hirer" className="mt-2 inline-block text-primary font-medium hover:underline">Register as hirer</Link>
      </div>
    );
  }

  const canHire = profile.feePaid && profile.fairTreatmentSignedAt;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Hiring Dashboard</h1>
          <p className="text-gray-600">Browse talents and manage your hires.</p>
        </div>
        <div className="flex-1 flex justify-end">
          <Image
            src="/hiring-agreements.png"
            alt="Hiring agreements and interviews illustration"
            width={380}
            height={240}
            className="w-full max-w-sm rounded-xl border border-primary/10 bg-white object-cover shadow-sm shadow-primary/10"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-3">{profile.companyName}</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {profile.feePaid ? <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-sm">Platform fee paid</span> : <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm">Fee required</span>}
          {profile.fairTreatmentSignedAt ? <span className="rounded-full bg-green-100 text-green-800 px-3 py-1 text-sm">Fair Treatment signed</span> : <span className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm">Sign Fair Treatment</span>}
        </div>
        {profile.hiringNeeds && <p className="text-sm text-gray-600 mb-2">Hiring needs: {profile.hiringNeeds}</p>}
        {profile.budget && <p className="text-sm text-gray-600">Budget: {profile.budget}</p>}
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/talent-marketplace" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">Browse talents</Link>
          <Link href="/dashboard/hirer/hires" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">My hires</Link>
          <Link href="/dashboard/hirer/agreements" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Agreements</Link>
          {!profile.feePaid && <Link href="/dashboard/hirer/pay-fee" className="rounded-lg border border-amber-500 text-amber-700 px-4 py-2 text-sm font-medium hover:bg-amber-50">Pay $20 platform fee</Link>}
          {profile.feePaid && !profile.fairTreatmentSignedAt && <Link href="/dashboard/hirer/sign-fair-treatment" className="rounded-lg border border-amber-500 text-amber-700 px-4 py-2 text-sm font-medium hover:bg-amber-50">Sign Fair Treatment Agreement</Link>}
        </div>
      </div>

      {!canHire && (
        <p className="text-sm text-amber-700">Pay the platform fee and sign the Fair Treatment Agreement to send hire requests.</p>
      )}
    </div>
  );
}
