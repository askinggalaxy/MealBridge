'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/lib/supabase/database.types';
import { useSearchParams } from 'next/navigation';
// useMap must be statically imported
import { useMap } from 'react-leaflet';

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
  // List of donations loaded from Supabase; independent of geolocation
  const [donations, setDonations] = useState<Donation[]>([]);

  // We avoid any arbitrary default (e.g., NYC). Start with null until we have real coordinates.
  // This prevents showing a misleading map location before the user acts on the permission prompt.
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Loading state for donations (not for geolocation)
  const [donationsLoading, setDonationsLoading] = useState(true);

  // Track geolocation permission/flow state explicitly so we can show proper UI without full page reloads
  // States: 'idle' (checking), 'prompt' (ask user), 'loading' (resolving GPS), 'granted', 'denied', 'error'
  const [geoState, setGeoState] = useState<'idle' | 'prompt' | 'loading' | 'granted' | 'denied' | 'error'>('idle');
  const [geoErrorMsg, setGeoErrorMsg] = useState<string | null>(null);

  const supabase = createClient();
  const searchParams = useSearchParams();

  // Local counter to trigger recenter side-effect
  const [recenterTick, setRecenterTick] = useState<number>(0);

  // Helper component to recenter/zoom the map on demand using useMap
  function RecenterControl({ center, trigger }: { center: [number, number] | null; trigger: number }) {
    const map = useMap();
    useEffect(() => {
      if (center) {
        // Keep a friendly zoom level when recentering to the user
        map.setView(center, Math.max(map.getZoom(), 13), { animate: true });
      }
    }, [center, trigger, map]);
    return null;
  }

  // Haversine distance (km) between two points; explicit types for clarity
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

  // Read distance filter from URL (in km); default 5km
  const radiusKm = Number(searchParams.get('distance') ?? 5);

  // Filter donations by distance if we have user's location
  const donationsInRadius: Donation[] = userLocation
    ? donations.filter((d) => distanceKm(userLocation, [d.location_lat, d.location_lng]) <= radiusKm)
    : donations;

  useEffect(() => {
    // 1) Dynamically import Leaflet on the client to avoid SSR issues with Leaflet
    const setupLeaflet = async () => {
      const L = (await import('leaflet')).default;
      // Configure default icons using absolute CDN URLs to be robust across Webpack/Turbopack builds
      const base = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `${base}marker-icon-2x.png`,
        iconUrl: `${base}marker-icon.png`,
        shadowUrl: `${base}marker-shadow.png`,
      });
    };
    setupLeaflet();

    // 2) Proactively check Permissions API to decide UX without rendering the map at a wrong location
    const checkPermissions = async () => {
      try {
        // If Permissions API exists, check current geolocation permission state
        // We cast to PermissionName for TS; browser will ignore if unsupported
        if ('permissions' in navigator && (navigator as any).permissions?.query) {
          const status = await (navigator as any).permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'granted') {
            // Permission granted: fetch coordinates immediately
            setGeoState('loading');
            requestGeolocation();
          } else if (status.state === 'prompt') {
            // Show overlay with a button that triggers getCurrentPosition on user gesture
            setGeoState('prompt');
          } else {
            // Denied: do not render map centered elsewhere; show guidance instead
            setGeoState('denied');
          }

          // Keep track of permission changes (e.g., user updates in the browser UI)
          status.onchange = () => {
            const newState = (status.state as 'granted' | 'prompt' | 'denied');
            if (newState === 'granted') {
              setGeoState('loading');
              requestGeolocation();
            } else if (newState === 'prompt') {
              setGeoState('prompt');
            } else {
              setGeoState('denied');
            }
          };
        } else {
          // Permissions API not available: fall back to explicit prompt via button
          setGeoState('prompt');
        }
      } catch (err) {
        // Any unexpected error: allow manual prompt via button
        console.error('Permissions API error:', err);
        setGeoState('prompt');
      }
    };

    // 3) Load donations in parallel to permission check; this doesn't depend on geolocation
    loadDonations();
    checkPermissions();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  const loadDonations = async () => {
    setDonationsLoading(true);
    
    // Read category filter from URL; 'all' means no filter
    const category = searchParams.get('category') ?? 'all';

    let query = supabase
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

    if (category && category !== 'all') {
      query = query.eq('category_id', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading donations:', error);
    } else {
      setDonations(data as Donation[]);
    }
    
    setDonationsLoading(false);
  };

  // Request geolocation through the browser API (invoked automatically when permission is granted,
  // or manually via the overlay button when the user consents). We avoid page refresh and just update state.
  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoState('error');
      setGeoErrorMsg('Geolocația nu este suportată de acest browser.');
      return;
    }

    setGeoErrorMsg(null);
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Update coordinates and mark permission as granted; the map will render centered correctly.
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setGeoState('granted');
      },
      (error) => {
        console.error('Geolocation error:', error);
        // Do not fall back to an arbitrary default; keep the overlay visible with a clear message.
        if (error.code === error.PERMISSION_DENIED) {
          setGeoState('denied');
          setGeoErrorMsg('Accesul la locație a fost refuzat. Activează permisiunea din setările browserului.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGeoState('error');
          setGeoErrorMsg('Locația nu este disponibilă în acest moment. Încearcă din nou.');
        } else if (error.code === error.TIMEOUT) {
          setGeoState('prompt');
          setGeoErrorMsg('Cererea de geolocație a expirat. Încearcă din nou.');
        } else {
          setGeoState('error');
          setGeoErrorMsg('A apărut o eroare la preluarea locației.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="h-96 relative">
      {/*
        Geolocation gating overlay:
        - Until we have permission granted AND coordinates, do NOT render the map.
        - This avoids showing a random default like NYC.
      */}
      {geoState !== 'granted' || !userLocation ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="text-center p-6">
            <h3 className="text-base font-semibold mb-2">Permite accesul la locație</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
              Pentru a-ți afișa donațiile din apropiere, avem nevoie de permisiunea de a-ți accesa locația.
              Harta va apărea imediat după accept, fără a reîncărca pagina.
            </p>
            {geoErrorMsg && (
              <p className="text-sm text-red-600 mb-3">{geoErrorMsg}</p>
            )}
            {geoState === 'prompt' && (
              <button
                onClick={requestGeolocation}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Folosește locația mea
              </button>
            )}
            {geoState === 'loading' && (
              <div className="text-gray-500">Se obține locația...</div>
            )}
            {geoState === 'denied' && (
              <div className="text-sm text-gray-700">
                Accesul este refuzat. Poți activa permisiunea din setările browserului și reîncerca.
              </div>
            )}
            {geoState === 'error' && (
              <div className="text-sm text-gray-700">
                Nu am putut obține locația. Încearcă din nou.
              </div>
            )}
          </div>
        </div>
      ) : (
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          {/* Recenter controller listens for trigger increments and recenters to userLocation */}
          <RecenterControl center={userLocation} trigger={recenterTick} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Optional marker showing user's current location */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>Locația ta</Popup>
            </Marker>
          )}

          {donationsInRadius.map((donation) => (
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
      )}

      {/* Optional: show a subtle loader for donations separate from geolocation */}
      {donationsLoading && (
        <div className="absolute bottom-2 left-2 bg-white/80 text-xs text-gray-700 px-2 py-1 rounded shadow">
          Se încarcă ofertele din apropiere...
        </div>
      )}

      {/* Floating button to center on user's location, visible when map is shown */}
      {geoState === 'granted' && (
        <button
          onClick={() => {
            // If we don't have coords yet, request them; else just recenter
            if (!userLocation) {
              requestGeolocation();
            } else {
              setRecenterTick((n) => n + 1);
            }
          }}
          className="absolute top-2 right-2 z-[1000] px-3 py-1.5 rounded bg-green-600 text-white text-sm shadow hover:bg-green-700"
        >
          Locația mea
        </button>
      )}
    </div>
  );
}