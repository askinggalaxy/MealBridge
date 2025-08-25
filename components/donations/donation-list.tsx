'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { DonationCard } from './donation-card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

export function DonationList() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const searchParams = useSearchParams();

  // User location used for distance filter/sort; we only set when permission is granted
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Haversine distance helper (km)
  const distanceKm = (a: [number, number], b: [number, number]): number => {
    const R = 6371; // km
    const dLat = ((b[0] - a[0]) * Math.PI) / 180;
    const dLon = ((b[1] - a[1]) * Math.PI) / 180;
    const lat1 = (a[0] * Math.PI) / 180;
    const lat2 = (b[0] * Math.PI) / 180;
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.asin(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon));
    return R * c;
  };

  useEffect(() => {
    // Try to get geolocation if permission is already granted so we can filter/sort by distance.
    const maybeGetLocation = async () => {
      try {
        if ('permissions' in navigator && (navigator as any).permissions?.query) {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
              () => void 0,
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
          }
        }
      } catch (_) {
        // ignore; distance filtering will simply be skipped
      }
    };

    // When URL filters change OR userLocation resolves, reload list
    maybeGetLocation();
    loadDonations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString(), JSON.stringify(userLocation)]);

  const loadDonations = async () => {
    setLoading(true);
    
    // Read category filter from URL; 'all' means no filter
    const category = searchParams.get('category') ?? 'all';

    let query = supabase
      .from('donations')
      .select(`
        *,
        profiles!donations_donor_id_fkey (
          id,
          display_name,
          avatar_url,
          reputation_score,
          reputation_count,
          neighborhood
        ),
        categories (
          name,
          icon
        )
      `)
      .eq('is_hidden', false)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }
    const { data, error } = await query;

    if (error) {
      console.error('Error loading donations:', error);
    } else {
      // Apply client-side filters based on URL params
      const sealedOnly = (searchParams.get('sealed') ?? 'false') === 'true';
      const sortBy = searchParams.get('sort') ?? 'newest';
      const radiusKm = Number(searchParams.get('distance') ?? 5);

      let items = (data as Donation[]).filter((d) => (sealedOnly ? d.condition === 'sealed' : true));

      // Filter by distance if we have user's location
      if (userLocation) {
        items = items.filter((d) => distanceKm(userLocation, [d.location_lat, d.location_lng]) <= radiusKm);
      }

      // Apply sorting preference
      if (sortBy === 'distance' && userLocation) {
        // Sort ascending by distance when available
        items.sort((a, b) =>
          distanceKm(userLocation, [a.location_lat, a.location_lng]) -
          distanceKm(userLocation, [b.location_lat, b.location_lng])
        );
      } else if (sortBy === 'expiry') {
        // Always sort by earliest expiry first (soonest)
        items.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
      } // 'newest' is already enforced by server order

      setDonations(items);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!donations.length) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center">
        <p className="text-gray-500">No food donations available nearby.</p>
        <p className="text-sm text-gray-400 mt-1">Check back later or expand your search area.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">Nearby Food ({donations.length})</h2>
      {donations.some((d) => d.status !== 'available') && (
        <Alert className="bg-blue-50 border-blue-200 text-blue-900">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Some items are already reserved (Delivery) or donated. They are shown grayed out and cannot be reserved.
          </AlertDescription>
        </Alert>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className={
              donation.status === 'available' ? '' : 'opacity-70'
            }
          >
            <DonationCard donation={donation} />
          </div>
        ))}
      </div>
    </div>
  );
}