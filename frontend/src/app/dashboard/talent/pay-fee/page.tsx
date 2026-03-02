'use client';

import Link from 'next/link';

export default function TalentPayFeePage() {
  return (
    <div className="p-6 max-w-md">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Talent marketplace fee</h1>
      <p className="text-gray-600 mb-4">
        Good news — the talent marketplace fee has been removed. You don&apos;t need to pay anything to appear in the
        Talent Marketplace. Once your profile is approved by the team, it can be listed automatically.
      </p>
      <Link
        href="/dashboard/talent"
        className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to Talent Dashboard
      </Link>
    </div>
  );
}
