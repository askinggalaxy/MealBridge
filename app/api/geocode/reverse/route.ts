import { NextResponse } from 'next/server';

// Simple in-memory cache to avoid spamming providers when the same coordinates are requested repeatedly.
// Note: This resets on server restart; sufficient for UX and to be gentle with upstreams.
const cache = new Map<string, { display_name: string | null; ts: number }>();

// Server-side proxy for reverse geocoding using OpenStreetMap Nominatim with a fallback provider.
// We call upstreams from the server to avoid client-side CORS/rate-limit issues and to send a proper User-Agent per policy.
// No mocking: this performs real HTTP requests. See https://operations.osmfoundation.org/policies/nominatim/
export async function GET(req: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    const lat = Number(latStr);
    const lng = Number(lngStr);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Invalid lat/lng' }, { status: 400 });
    }

    const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && now - hit.ts < 60_000) { // 1 minute cache window
      return NextResponse.json({ display_name: hit.display_name, cached: true });
    }

    // Build URL for Nominatim reverse geocoding
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;

    // Respect Nominatim policies: include a descriptive User-Agent with a contact email/URL if available
    const userAgent = process.env.NOMINATIM_USER_AGENT
      || `MealBridge/1.0 (${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost'})`;

    // Attempt primary provider with timeout and proper abort handling
    let primaryOk = false;
    let display: string | null = null;
    {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout to avoid hanging
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'User-Agent': userAgent,
            'Accept-Language': 'en',
          },
          signal: controller.signal,
          // Disable Next.js fetch cache for this call
          cache: 'no-store',
        } as RequestInit);

        if (res.ok) {
          const data = await res.json();
          display = typeof data?.display_name === 'string' ? data.display_name : null;
          cache.set(key, { display_name: display, ts: Date.now() });
          primaryOk = true;
          clearTimeout(timeout);
          return NextResponse.json({ display_name: display, raw: data, provider: 'nominatim' });
        }

        // Non-OK response; fall through to fallback
        clearTimeout(timeout);
      } catch (e) {
        // Network error or abort; ensure timer is cleared and proceed to fallback
        clearTimeout(timeout);
      }
    }

    // If primary failed or timed out, try a secondary free provider with similar response
    if (!primaryOk) {
      const fallbackUrl = `https://geocode.maps.co/reverse?format=json&lat=${lat}&lon=${lng}`;
      const fbController = new AbortController();
      const fbTimeout = setTimeout(() => fbController.abort(), 6000);
      try {
        const fallback = await fetch(fallbackUrl, {
          headers: { 'Accept-Language': 'en' },
          cache: 'no-store',
          signal: fbController.signal,
        } as RequestInit);

        clearTimeout(fbTimeout);

        if (!fallback.ok) {
          return NextResponse.json({ error: `Upstream error and fallback ${fallback.status}` }, { status: 502 });
        }
        const data = await fallback.json();
        display = typeof data?.display_name === 'string' ? data.display_name : null;
        cache.set(key, { display_name: display, ts: Date.now() });
        return NextResponse.json({ display_name: display, raw: data, provider: 'maps.co' });
      } catch (e: unknown) {
        clearTimeout(fbTimeout);
        const message = e instanceof Error ? e.message : 'Unknown error';
        // Propagate as 504 for timeouts/aborts, 500 otherwise
        const status = message.includes('aborted') || message.includes('timeout') ? 504 : 500;
        return NextResponse.json({ error: message }, { status });
      }
    }

    // Should not reach here, but in case we do:
    return NextResponse.json({ error: 'Unexpected state' }, { status: 500 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    // Return 504 for timeouts/aborts, 500 otherwise
    const status = message.includes('aborted') || message.includes('timeout') ? 504 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
