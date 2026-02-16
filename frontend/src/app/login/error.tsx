'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Login page error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">Something went wrong</h1>
        <p className="text-gray-600 text-sm mb-4">
          Sign-in hit an error. This is often due to the backend being unreachable (e.g. backend sleeping on Railway) or a CORS/network issue.
        </p>
        <p className="text-gray-500 text-xs mb-6">
          Check the browser console (F12 → Console) for details.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-lg bg-primary py-2.5 text-white font-medium hover:opacity-90"
          >
            Try again
          </button>
          <Link
            href="/login"
            className="block w-full rounded-lg border border-gray-300 py-2.5 text-gray-700 font-medium hover:bg-gray-50"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
