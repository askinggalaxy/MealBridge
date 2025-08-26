import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Footer } from '@/components/layout/footer';
import { CookieConsent } from '@/components/privacy/cookie-consent';

const inter = Inter({ subsets: ['latin'] });

// Determine the public site URL used in metadata, sitemap, robots, and JSON-LD.
// We prefer NEXT_PUBLIC_SITE_URL from environment. If not present, we fall back to the production domain.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mealbridge.net').replace(/\/$/, '');

// Centralized, descriptive metadata for SEO and social sharing.
// NOTE: Next.js will render all Open Graph/Twitter tags from here automatically.
export const metadata: Metadata = {
  // Use a template so nested routes can define `title` and still keep the suffix.
  title: {
    default: 'MealBridge - Share Food, Build Community',
    template: '%s | MealBridge',
  },
  description:
    'MealBridge connects food donors with recipients to reduce waste and support communities. Donate surplus meals, find nearby food, and bridge generosity with need.',
  keywords: [
    'MealBridge',
    'food donation',
    'reduce food waste',
    'charity',
    'non-profit',
    'community support',
    'social impact',
    'hunger relief',
  ],
  applicationName: 'MealBridge',
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'MealBridge',
    title: 'MealBridge - Share Food, Build Community',
    description:
      'Connect donors and recipients to reduce food waste. Share surplus meals, discover nearby donations, and help your community.',
    images: [
      // We expose a dynamic, always up-to-date OG image at /opengraph-image
      { url: '/opengraph-image', width: 1200, height: 630, alt: 'MealBridge - Share Food, Build Community' },
    ],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@MealBridge', // Optional: replace with the real handle if available
    creator: '@MealBridge', // Optional
    title: 'MealBridge - Share Food, Build Community',
    description:
      'Connect donors and recipients to reduce food waste. Share surplus meals, discover nearby donations, and help your community.',
    images: ['/twitter-image'],
  },
  category: 'nonprofit',
  icons: {
    icon: [
      // Keep default favicon while allowing future PNG/SVG icons.
      { url: '/favicon.ico', rel: 'icon', type: 'image/x-icon' },
    ],
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0b' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Prepare JSON-LD structured data for both Organization and WebSite.
  // These help search engines understand our brand and site purpose.
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MealBridge',
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.ico`,
    sameAs: [
      // Add official social profiles when available to strengthen entity recognition.
    ],
  } as const;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MealBridge',
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  } as const;

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Global JSON-LD structured data blocks */}
        <script
          type="application/ld+json"
          // We stringify inline to avoid hydration mismatches; this is static at build/runtime.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {children}
        {/* GDPR cookie consent banner + preferences */}
        <CookieConsent />
        {/* Global site footer with important links */}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}