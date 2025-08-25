"use client";

import Link from "next/link";

// Simple site-wide footer with important links.
// Includes accessible markup and Tailwind classes for a clean look.
// Per user preference, we add clear code comments to explain each part.
export function Footer(): JSX.Element {
  // When the user clicks the "Cookie Preferences" link, we dispatch a
  // custom event that our CookieConsent component listens to. This opens
  // the preferences modal so users can update their choices anytime.
  const openCookiePreferences = (): void => {
    try {
      window.dispatchEvent(new Event("open-cookie-preferences"));
    } catch {
      // no-op; older browsers should still support Event()
    }
  };

  return (
    <footer className="border-t bg-white">
      {/* Constrain the content width and add spacing */}
      <div className="container mx-auto px-4 py-8">
        {/* Brand + short tagline */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">MealBridge</p>
            <p className="text-sm text-gray-500">Share Food, Build Community</p>
          </div>

          {/* Navigation links to legal/info pages */}
          <nav aria-label="Footer">
            <ul className="flex flex-wrap items-center gap-4 text-sm">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 hover:underline">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Contact
                </Link>
              </li>
              {/* Button-styled link to open cookie preferences modal */}
              <li>
                <button
                  type="button"
                  onClick={openCookiePreferences}
                  className="text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Cookie Preferences
                </button>
              </li>
            </ul>
          </nav>
        </div>

        {/* Copyright line */}
        <div className="mt-6 border-t pt-4 text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} MealBridge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

