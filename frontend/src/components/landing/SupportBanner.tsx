'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 20_000; // 20 seconds
const AUTO_HIDE_MS = 20 * 60 * 1000; // 20 minutes
const LAST_SHOWN_KEY = 'supportBannerLastShown';
const OPT_OUT_KEY = 'supportBannerOptOut';

export function SupportBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const optOut = window.localStorage.getItem(OPT_OUT_KEY);
      if (optOut === 'true') return;

      const lastShownRaw = window.localStorage.getItem(LAST_SHOWN_KEY);
      const lastShown = lastShownRaw ? Number(lastShownRaw) : 0;
      const now = Date.now();
      // Only show once per day
      if (lastShown && now - lastShown < ONE_DAY_MS) return;

      const showTimer = window.setTimeout(() => {
        setVisible(true);
        window.localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
        // Fire-and-forget log
        api.supportBanner
          .logEvent('shown')
          .catch(() => {
            // ignore
          });
      }, SHOW_DELAY_MS);

      const autoHideTimer = window.setTimeout(() => {
        setVisible(false);
      }, SHOW_DELAY_MS + AUTO_HIDE_MS);

      return () => {
        window.clearTimeout(showTimer);
        window.clearTimeout(autoHideTimer);
      };
    } catch {
      // If localStorage unavailable, fail silently
    }
  }, []);

  const hide = () => setVisible(false);

  const handleSupportClick = () => {
    api.supportBanner
      .logEvent('clicked_support')
      .catch(() => {});
    window.location.href = '/donate';
  };

  const handleMaybeLater = () => {
    api.supportBanner
      .logEvent('closed')
      .catch(() => {});
    hide();
  };

  const handleDontShowAgain = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(OPT_OUT_KEY, 'true');
      }
    } catch {
      // ignore
    }
    api.supportBanner
      .logEvent('dont_show_again')
      .catch(() => {});
    hide();
  };

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-3 sm:px-4">
      <div className="pointer-events-auto max-w-3xl w-full rounded-2xl border border-amber-100 bg-white/95 shadow-lg shadow-amber-200/50 px-4 py-3 sm:px-6 sm:py-4 animate-[slide-up_300ms_ease-out]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-7 w-7 flex items-center justify-center rounded-full bg-amber-100 text-amber-700">
              💛
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-secondary">
                Support RiseFlow Hub — Help us grow by donating.
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-700">
                Your donation helps us improve tools, learning resources, and opportunities for founders globally.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:items-end sm:min-w-[220px]">
            <button
              type="button"
              onClick={handleSupportClick}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-1.5 text-xs sm:text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Donate Now
            </button>
            <div className="flex flex-wrap items-center gap-2 justify-end">
              <button
                type="button"
                onClick={handleMaybeLater}
                className="text-[11px] text-gray-600 hover:text-secondary"
              >
                Maybe Later
              </button>
              <button
                type="button"
                onClick={handleDontShowAgain}
                className="text-[11px] text-gray-400 hover:text-gray-700"
              >
                Don&apos;t show again
              </button>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

