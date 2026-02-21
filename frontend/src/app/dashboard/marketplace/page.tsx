'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api, getStoredToken, type User } from '@/lib/api';

export default function DashboardMarketplacePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api.auth.me(token).then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary mb-2">Marketplace</h1>
        <p className="text-gray-600">Browse hiring and investment marketplaces from your dashboard.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/talent-marketplace"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition"
        >
          <h2 className="text-lg font-semibold text-secondary mb-1">Talent Marketplace</h2>
          <p className="text-sm text-gray-600">Hire vetted talents or discover skills across the platform.</p>
        </Link>

        <Link
          href="/dashboard/investor/marketplace"
          className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition"
        >
          <h2 className="text-lg font-semibold text-secondary mb-1">Startup Marketplace</h2>
          <p className="text-sm text-gray-600">Explore startup opportunities and investor marketplace listings.</p>
        </Link>
      </div>

      {user && (user.role === 'talent' || user.role === 'hirer' || user.role === 'hiring_company') && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-base font-semibold text-secondary mb-2">Your hiring workspace</h3>
          <div className="flex flex-wrap gap-3 text-sm">
            {user.role === 'talent' && (
              <Link href="/dashboard/talent/profile" className="text-primary hover:underline">
                Open talent profile
              </Link>
            )}
            {(user.role === 'hirer' || user.role === 'hiring_company') && (
              <Link href="/dashboard/hirer" className="text-primary hover:underline">
                Open hirer dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
