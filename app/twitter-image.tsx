/*
  Dynamic Twitter Card image (summary_large_image)
  - Same layout as Open Graph to keep brand consistency.
  - Twitter also prefers 1200x630 for large summary cards.
*/

import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function TwitterImage() {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mealbridge.net').replace(/\/$/, '');

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
          background: 'linear-gradient(135deg, #052e16 0%, #15803d 50%, #86efac 100%)',
          color: '#ffffff',
          padding: 64,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
        }}
      >
        <div style={{ fontSize: 60, fontWeight: 800, letterSpacing: -1 }}>MealBridge</div>
        <div style={{ fontSize: 30, marginTop: 12 }}>Donate surplus meals. Help your community.</div>
        <div style={{ fontSize: 22, marginTop: 28, opacity: 0.95 }}>Reducing food waste together</div>
        <div style={{ fontSize: 20, marginTop: 32, background: 'rgba(255,255,255,0.16)', padding: '10px 18px', borderRadius: 9999 }}>
          {baseUrl}
        </div>
      </div>
    ),
    { ...size }
  );
}
