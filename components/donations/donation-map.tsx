'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

type Donation = Database['public']['Tables']['donations']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
  categories: Database['public']['Tables']['categories']['Row'];
};

export function DonationMap() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number]>([40.7128, -74.0060]); // Default to NYC
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Dynamically import Leaflet on the client to avoid SSR "window is not defined" issues
    // Also configure default marker icons once Leaflet is loaded
    const setupLeaflet = async () => {
      const L = (await import('leaflet')).default;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const iconRetina = require('leaflet/dist/images/marker-icon-2x.png');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const icon = require('leaflet/dist/images/marker-icon.png');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const shadow = require('leaflet/dist/images/marker-shadow.png');

      L.Icon.Default.mergeOptions({
        iconRetinaUrl: iconRetina,
        iconUrl: icon,
        shadowUrl: shadow,
      });
    };
    setupLeaflet();

    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        (error) => {
          console.log('Geolocation error:', error);
          // Keep default location
        }
      );
    }

    // Load donations
    loadDonations();
  }, []);

  const loadDonations = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('donations')
      .select(`
        *,
        profiles!donations_donor_id_fkey (
          display_name,
          reputation_score,
          reputation_count
        ),
        categories (
          name,
          icon
        )
      `)
      .eq('status', 'available')
      .eq('is_hidden', false)
      .gte('expiry_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading donations:', error);
    } else {
      setDonations(data as Donation[]);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-96 bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="h-96 relative">
      <MapContainer
        center={userLocation}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {donations.map((donation) => (
          <Marker
            key={donation.id}
            position={[donation.location_lat, donation.location_lng]}
          >
            <Popup>
              <div className="p-2 min-w-48">
                <h3 className="font-semibold text-sm mb-1">{donation.title}</h3>
                <p className="text-xs text-gray-600 mb-2">{donation.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">
                    {donation.categories.icon} {donation.categories.name}
                  </span>
                  <span className="text-gray-500">
                    Expires {new Date(donation.expiry_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-medium text-gray-700">
                    By {donation.profiles.display_name}
                  </span>
                  {donation.profiles.reputation_count > 0 && (
                    <span className="text-xs text-yellow-600 ml-2">
                      ⭐ {donation.profiles.reputation_score.toFixed(1)} ({donation.profiles.reputation_count})
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}