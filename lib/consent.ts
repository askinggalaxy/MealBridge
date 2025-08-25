/*
  Cookie consent utility helpers for GDPR compliance.
  - Strongly typed categories and consent shape
  - Reads/writes a first-party cookie and mirrors to localStorage for quick checks
  - No mocking/simulation; this is real functionality
*/

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing';

export interface CookieConsent {
  necessary: boolean; // always true (required for site to function)
  analytics: boolean;
  marketing: boolean;
  updatedAt: string; // ISO timestamp for auditing
}

const CONSENT_COOKIE_NAME = 'mb_cookie_consent';
const CONSENT_LS_KEY = 'mb_cookie_consent';

// Set cookie max age to 180 days (in seconds)
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

/** Safely get document in browser contexts only */
const isBrowser = (): boolean => typeof window !== 'undefined' && typeof document !== 'undefined';

/** Serialize and set the consent cookie */
export function setConsentCookie(consent: CookieConsent): void {
  if (!isBrowser()) return;
  const value = encodeURIComponent(JSON.stringify(consent));
  // Use SameSite=Lax to prevent CSRF on cookie, Secure in production with HTTPS
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE_NAME}=${value}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  try {
    localStorage.setItem(CONSENT_LS_KEY, JSON.stringify(consent));
  } catch {
    // ignore storage errors (e.g., Safari private mode)
  }
}

/** Parse the cookie string to find our consent cookie */
function readConsentCookie(): CookieConsent | null {
  if (!isBrowser()) return null;
  const cookieStr = document.cookie || '';
  const parts = cookieStr.split(';').map((c) => c.trim());
  const found = parts.find((p) => p.startsWith(`${CONSENT_COOKIE_NAME}=`));
  if (!found) return null;
  try {
    const raw = decodeURIComponent(found.split('=')[1] ?? '');
    const parsed = JSON.parse(raw) as CookieConsent;
    // Validate minimal shape
    if (typeof parsed === 'object' && parsed && typeof parsed.necessary === 'boolean') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

/** Return current consent from cookie or localStorage; prefer cookie as source of truth. */
export function getConsent(): CookieConsent | null {
  // Try cookie first
  const fromCookie = readConsentCookie();
  if (fromCookie) return fromCookie;
  // Fallback to localStorage (helps on sub-path navigations before cookie read updates)
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(CONSENT_LS_KEY);
      if (raw) return JSON.parse(raw) as CookieConsent;
    } catch {
      return null;
    }
  }
  return null;
}

/** Convenience check for category consent */
export function hasConsent(category: Exclude<ConsentCategory, 'necessary'>): boolean {
  const c = getConsent();
  if (!c) return false;
  return Boolean(c[category]);
}

/** Create a default consent object with only necessary enabled. */
export function defaultConsent(): CookieConsent {
  return {
    necessary: true,
    analytics: false,
    marketing: false,
    updatedAt: new Date().toISOString(),
  };
}
