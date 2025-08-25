import './globals.css';
import 'leaflet/dist/leaflet.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { Footer } from '@/components/layout/footer';
import { CookieConsent } from '@/components/privacy/cookie-consent';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MealBridge - Share Food, Build Community',
  description: 'Connect food donors with recipients to reduce waste and support communities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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