/*
  Web App Manifest for better metadata completeness and potential PWA support.
  - Keep icons minimal; you can add generated PNGs later if desired.
*/

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MealBridge',
    short_name: 'MealBridge',
    description:
      'MealBridge connects food donors with recipients to reduce waste and support communities.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
