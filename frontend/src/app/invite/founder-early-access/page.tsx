'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getStoredToken } from '@/lib/api';

/**
 * Founder Early Access invite link.
 *
 * This page checks whether the Early Founder program still has seats,
 * and either redirects founders into the idea submission flow with a
 * special `ref` flag, or shows a "Program full" message.
 */
export default function FounderEarlyAccessInvitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [full, setFull] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const token = getStoredToken();
        if (token) {
          const me = await api.auth.me(token).catch(() => null);
          if (!cancelled && me?.role === 'super_admin') {
            const origin = typeof window !== 'undefined' ? window.location.origin : '';
            setInviteLink(`${origin}/submit-idea?ref=early_access_superadmin`);
            setIsSuperAdmin(true);
            setLoading(false);
            return;
          }
        }

        const status = await api.earlyAccess.status();
        if (cancelled) return;
        if (status.enabled) {
          router.replace('/submit-idea?ref=early_access_superadmin');
        } else {
          setFull(true);
        }
      } catch {
        if (!cancelled) {
          // On error, fall back to normal submit-idea flow (no scholarship flag).
          router.replace('/submit-idea');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleCopyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  if (isSuperAdmin) {
    const emailSubject = encodeURIComponent('RiseFlowHub Early Founder Scholarship Invite');
    const emailBody = encodeURIComponent(
      `Hello,\n\nUse this invite link to apply for the RiseFlowHub Early Founder scholarship (first 20 founders):\n${inviteLink}\n\nBest regards,\nRiseFlowHub Team`
    );
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-secondary mb-2">Early Founder Invite Link</h1>
          <p className="text-sm text-gray-600 mb-4">
            Share this link with founders. It enrolls eligible users into the first-20 scholarship flow.
          </p>
          <div className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 break-all mb-3">
            {inviteLink}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
            <a
              href={`mailto:?subject=${emailSubject}&body=${emailBody}`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Send via email
            </a>
            <button
              type="button"
              onClick={() => router.replace('/dashboard/admin')}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to admin dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (loading && !full) return null;

  if (full) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-secondary mb-2">Early Founder Program Full</h1>
          <p className="text-sm text-gray-600 mb-4">
            The first 20 scholarship seats have been filled. You can still submit your startup idea and join the platform normally.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/submit-idea')}
            className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue to submit my idea
          </button>
        </div>
      </main>
    );
  }

  return null;
}

