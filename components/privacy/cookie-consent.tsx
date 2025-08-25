'use client';

/*
  GDPR Cookie Consent banner + preferences dialog.
  - Real persistence via first-party cookie + localStorage mirror
  - Granular categories: necessary (always on), analytics, marketing
  - Accessible keyboard navigation and ARIA roles
  - Heavily commented per project preference
*/

import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultConsent, getConsent, setConsentCookie, type CookieConsent } from '@/lib/consent';

/** Key used only in component state for showing/hiding UI */
const PREFS_EVENT_NAME = 'open-cookie-preferences';

/** Control structure for category rendering */
interface ToggleDef {
  key: keyof Pick<CookieConsent, 'analytics' | 'marketing'>;
  title: string;
  description: string;
}

export function CookieConsent(): JSX.Element | null {
  // Loaded consent from cookie/localStorage (null means not decided yet)
  const [consent, setConsent] = useState<CookieConsent | null>(null);
  // Show banner if no consent yet; show dialog when user opts to manage
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  // Local working copy used when the dialog is open
  const [prefsDraft, setPrefsDraft] = useState<CookieConsent>(defaultConsent());

  // For focus trapping in the dialog
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Define configurable categories (necessary is always on and not togglable)
  const toggles: ToggleDef[] = useMemo(
    () => [
      {
        key: 'analytics',
        title: 'Analytics cookies',
        description: 'Help us understand usage (page views, feature adoption) so we can improve MealBridge.',
      },
      {
        key: 'marketing',
        title: 'Marketing cookies',
        description: 'Used for personalized content and measuring the effectiveness of outreach.',
      },
    ],
    []
  );

  // On mount: read consent and decide whether to show banner
  useEffect(() => {
    const current = getConsent();
    if (current) {
      setConsent(current);
      setShowBanner(false);
    } else {
      setConsent(null);
      setShowBanner(true);
    }
  }, []);

  // Listen for a global event to reopen preferences from anywhere (e.g., footer link)
  useEffect(() => {
    const handler = () => {
      const existing = getConsent() ?? defaultConsent();
      setPrefsDraft({ ...existing });
      setShowDialog(true);
    };
    window.addEventListener(PREFS_EVENT_NAME, handler);
    return () => window.removeEventListener(PREFS_EVENT_NAME, handler);
  }, []);

  // Trap focus within the dialog when open (very lightweight approach)
  useEffect(() => {
    if (!showDialog) return;
    const root = dialogRef.current;
    if (!root) return;
    const focusable = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDialog(false);
      }
      if (e.key === 'Tab' && focusable.length > 1) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showDialog]);

  // Handlers
  const acceptAll = () => {
    const c: CookieConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      updatedAt: new Date().toISOString(),
    };
    setConsentCookie(c);
    setConsent(c);
    setShowBanner(false);
  };

  const rejectAll = () => {
    const c: CookieConsent = {
      necessary: true,
      analytics: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    };
    setConsentCookie(c);
    setConsent(c);
    setShowBanner(false);
  };

  const openPreferences = () => {
    const base = consent ?? defaultConsent();
    setPrefsDraft({ ...base });
    setShowDialog(true);
  };

  const savePreferences = () => {
    const c: CookieConsent = {
      ...prefsDraft,
      necessary: true, // enforce necessary always true
      updatedAt: new Date().toISOString(),
    };
    setConsentCookie(c);
    setConsent(c);
    setShowDialog(false);
    setShowBanner(false);
  };

  // Don't render anything when the user already gave consent and no dialog is open
  if (consent && !showDialog && !showBanner) return null;

  return (
    <>
      {/* Banner */}
      {showBanner && (
        <div
          className="fixed inset-x-0 bottom-0 z-[60]"
          role="region"
          aria-label="Cookie consent banner"
        >
          <div className="container mx-auto px-4 pb-4">
            <div className="rounded-lg border shadow-lg bg-white p-4 md:p-5">
              <p className="text-sm text-gray-800">
                We use essential cookies to make MealBridge work. With your consent, we also use analytics and
                marketing cookies to improve services. See our{' '}
                <a href="/privacy" className="underline hover:text-gray-900">Privacy Policy</a>.
              </p>
              <div className="mt-3 flex flex-col md:flex-row gap-2 md:items-center md:justify-end">
                <button onClick={rejectAll} className="px-4 py-2 rounded border text-sm">
                  Reject all
                </button>
                <button onClick={openPreferences} className="px-4 py-2 rounded border text-sm">
                  Manage preferences
                </button>
                <button
                  onClick={acceptAll}
                  className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 text-sm"
                >
                  Accept all
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences dialog (simple modal) */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-prefs-title"
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDialog(false)} />

          {/* Panel */}
          <div ref={dialogRef} className="relative z-10 w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <h2 id="cookie-prefs-title" className="text-lg font-semibold">
              Cookie preferences
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Choose which cookies you want to allow. You can update your choices anytime.
            </p>

            {/* Necessary (always enabled) */}
            <div className="mt-4 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Necessary cookies</p>
                  <p className="text-sm text-gray-600">
                    Required for the website to function. Always on.
                  </p>
                </div>
                <input type="checkbox" checked disabled aria-label="Necessary cookies always enabled" />
              </div>
            </div>

            {/* Other toggles */}
            <div className="mt-3 space-y-3">
              {toggles.map((t) => (
                <div key={t.key} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t.title}</p>
                      <p className="text-sm text-gray-600">{t.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(prefsDraft[t.key])}
                      onChange={(e) =>
                        setPrefsDraft((prev) => ({ ...prev, [t.key]: e.target.checked }))
                      }
                      aria-label={t.title}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button className="px-4 py-2 rounded border text-sm" onClick={() => setShowDialog(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded text-white bg-green-600 hover:bg-green-700 text-sm"
                onClick={savePreferences}
              >
                Save preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieConsent;
