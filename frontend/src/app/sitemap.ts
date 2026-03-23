import type { MetadataRoute } from 'next';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_URL = process.env.NEXT_PUBLIC_API_URL?.trim() || '';
const FETCH_TIMEOUT_MS = 5000;

function canUseExternalUrl(url: string): boolean {
  if (!url) return false;
  if (process.env.NODE_ENV !== 'production') return true;
  return !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
}

async function fetchWithTimeout(input: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about',
    '/pricing',
    '/investors',
    '/submit-idea',
    '/talent-marketplace',
    '/hiring',
    '/contact',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${APP_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  let dynamic: MetadataRoute.Sitemap = [];
  if (!canUseExternalUrl(API_URL)) return staticRoutes;

  try {
    const res = await fetchWithTimeout(`${API_URL}/api/v1/startups/marketplace`, {
      // ensure fresh list of startups for sitemap
      next: { revalidate: 60 * 60 },
    });
    if (res.ok) {
      const startups = (await res.json()) as Array<{ id: string; updatedAt?: string }>;
      dynamic = startups.map((s) => ({
        url: `${APP_URL}/startups/${s.id}`,
        lastModified: s.updatedAt ? new Date(s.updatedAt) : new Date(),
        changeFrequency: 'daily',
        priority: 0.8,
      }));
    }
  } catch {
    // fail silently; static routes are still returned
  }

  return [...staticRoutes, ...dynamic];
}

