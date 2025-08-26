/*
  XML sitemap for search engines using Next.js Metadata routes.
  - Generates absolute URLs from env NEXT_PUBLIC_SITE_URL or default domain.
  - Update the routes array as you add more public pages.
*/

import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mealbridge.net').replace(/\/$/, '');
  const now = new Date();

  // Public, indexable routes only. Avoid admin/private paths.
  const routes = ['/', '/about', '/donations', '/donations/create'];

  return routes.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: path === '/' ? 1 : 0.8,
  }));
}
