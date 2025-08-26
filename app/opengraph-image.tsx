/*
  Dynamic Open Graph image for rich link previews
  - Uses Next.js `next/og` ImageResponse.
  - Self-contained (no remote fonts) to avoid failures at edge runtime.
  - Dimensions follow the standard 1200x630 Open Graph size.
*/

import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  // Read base URL from env or fallback to production domain.
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mealbridge.net').replace(/\/$/, '');

  // Simple, accessible design. Keep it lightweight and consistent.
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #bbf7d0 100%)',
          color: '#ffffff',
          padding: 64,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>MealBridge</div>
        <div style={{ fontSize: 32, marginTop: 12 }}>Share Food, Build Community</div>
        <div style={{ fontSize: 24, marginTop: 28, opacity: 0.95 }}>
          Connect donors and recipients to reduce food waste
        </div>
        <div style={{ fontSize: 22, marginTop: 32, background: 'rgba(255,255,255,0.16)', padding: '10px 18px', borderRadius: 9999 }}>
          {baseUrl}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
