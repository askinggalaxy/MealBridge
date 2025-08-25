'use client';

import { useEffect, useState } from 'react';
import { Suspense } from 'react';
import { DonationMap } from '@/components/donations/donation-map';

/**
 * MapListContainer controls the tabs above the map area.
 * - When "Map View" is active, the map is shown.
 * - When "List View" is active, the map is collapsed (hidden) and we scroll to the list section.
 * This is a client component as it manages interactive UI state.
 */
export function MapListContainer(): JSX.Element {
  // Track which tab is active. Default to 'map' to keep previous behavior.
  const [tab, setTab] = useState<'map' | 'list'>('map');

  // When switching to list, scroll the list section into view (if present)
  useEffect(() => {
    if (tab === 'list') {
      const el = document.getElementById('donation-list');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [tab]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Tabs header */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium ${
              tab === 'map'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('map')}
            aria-pressed={tab === 'map'}
            aria-label="Map View"
          >
            Map View
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${
              tab === 'list'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setTab('list')}
            aria-pressed={tab === 'list'}
            aria-label="List View"
          >
            List View
          </button>
        </nav>
      </div>

      {/* Map area: only render when Map tab is active to avoid unnecessary work */}
      {tab === 'map' && (
        <div className="relative">
          <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse" /> }>
            <DonationMap />
          </Suspense>
        </div>
      )}
    </div>
  );
}
