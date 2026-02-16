/**
 * Keep-alive: ping our own health endpoint periodically so the instance stays warm.
 * Set SELF_URL (or BACKEND_PUBLIC_URL) on Render to your backend URL, e.g. https://riseflowhub-v1-0-1.onrender.com
 */

import cron from 'node-cron';

const SELF_URL = (process.env.SELF_URL || process.env.BACKEND_PUBLIC_URL || '').replace(/\/+$/, '');
const HEALTH_PATH = '/health';
const INTERVAL_CRON = process.env.KEEPALIVE_CRON || '*/5 * * * *'; // every 5 minutes

let isScheduled = false;

function ping(): void {
  if (!SELF_URL) {
    if (!isScheduled) console.warn('[keepAlive] SELF_URL or BACKEND_PUBLIC_URL not set; keep-alive disabled.');
    return;
  }
  const url = `${SELF_URL}${HEALTH_PATH}`;
  fetch(url, { method: 'GET', signal: AbortSignal.timeout(15_000) })
    .then((res) => {
      if (res.ok) {
        console.log('[keepAlive] Ping OK', res.status);
      } else {
        console.warn('[keepAlive] Ping non-OK', res.status, url);
      }
    })
    .catch((err) => {
      console.error('[keepAlive] Ping failed:', err instanceof Error ? err.message : err);
    });
}

/**
 * Start the keep-alive cron job. Call once after server is listening.
 */
export function startKeepAlive(): void {
  if (isScheduled) return;
  if (!SELF_URL) return;

  try {
    cron.schedule(INTERVAL_CRON, () => ping());
    isScheduled = true;
    console.log('[keepAlive] Scheduled', INTERVAL_CRON, '→', `${SELF_URL}${HEALTH_PATH}`);
    // Optional: one immediate ping after a short delay so first request isn't cold
    setTimeout(() => ping(), 30_000);
  } catch (e) {
    console.error('[keepAlive] Failed to schedule:', e);
  }
}
