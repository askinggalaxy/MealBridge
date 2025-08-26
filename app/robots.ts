/*
  Robots.txt via Next.js Metadata routes.
  - Allows all crawling.
  - Points to the canonical sitemap and host.
*/

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mealbridge.net').replace(/\/$/, '');

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
