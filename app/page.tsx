import { Suspense } from 'react';
// Map is now controlled by MapListContainer (shows/hides map based on selected tab)
import { MapListContainer } from '@/components/donations/map-list-container';
import { DonationList } from '@/components/donations/donation-list';
import { DonationFilters } from '@/components/donations/donation-filters';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters and Actions */}
          <div className="lg:w-80">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Find Food Near You</h2>
                <Link href="/donations/create">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Share Food
                  </Button>
                </Link>
              </div>
              <Suspense fallback={<div className="animate-pulse bg-gray-200 h-48 rounded"></div>}>
                <DonationFilters />
              </Suspense>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs + Map area. MapListContainer hides the map when List View is active */}
            <MapListContainer />

            {/* List section; give it an id so the tab can scroll here */}
            <div id="donation-list" className="mt-6">
              <Suspense fallback={<div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>}>
                <DonationList />
              </Suspense>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}