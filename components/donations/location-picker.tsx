'use client';

// Leaflet map picker with a draggable marker, designed to run only on client.
// This component dynamically imports react-leaflet pieces to avoid SSR issues in Next.js.
// It exposes a simple controlled interface: value (lat,lng) and onChange callback.
// Optionally reacts to address text changes to geocode and move the marker.

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
// useMap must be imported statically; hooks cannot be dynamically imported
import { useMap } from 'react-leaflet';

// Dynamic import of react-leaflet parts (client-only)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });

// Type for a coordinate pair to keep explicit typing, per user preference
export type LatLng = { lat: number; lng: number };

export interface LocationPickerProps {
  // Current selected location (null means not selected yet)
  value: LatLng | null;
  // Callback when user picks/moves the marker
  onChange: (coord: LatLng) => void;
  // Optional address text; when it changes we can geocode and update the marker
  addressText?: string;
  // Optional: called if address geocoding fails
  onGeocodeError?: (message: string) => void;
  // Optional: initial zoom level when we have coordinates
  zoom?: number;
  // Optional: className for the container
  className?: string;
}

export default function LocationPicker({ value, onChange, addressText, onGeocodeError, zoom = 15, className }: LocationPickerProps) {
  const [ready, setReady] = useState(false);
  const [internal, setInternal] = useState<LatLng | null>(value ?? null);
  const initializedRef = useRef(false);
  const lastGeocodeValueRef = useRef<string | null>(null);
  // This flag instructs the map to change zoom ONLY on the next center (e.g., after geocoding or locate-me).
  // For marker drag/click updates we want to keep the user's current zoom, so we will not set this flag.
  const zoomNextRef = useRef<boolean>(false);

  // Setup Leaflet marker icons correctly on the client (prevents missing icon issues in bundlers)
  useEffect(() => {
    const setupLeaflet = async () => {
      const L = (await import('leaflet')).default;
      // Use absolute CDN URLs to be robust across Webpack/Turbopack builds
      const base = 'https://unpkg.com/leaflet@1.9.4/dist/images/';
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: `${base}marker-icon-2x.png`,
        iconUrl: `${base}marker-icon.png`,
        shadowUrl: `${base}marker-shadow.png`,
      });
      setReady(true);
    };
    setupLeaflet();
  }, []);

  // Keep internal state in sync with external value when it changes from outside
  useEffect(() => {
    if (value && (!internal || value.lat !== internal.lat || value.lng !== internal.lng)) {
      setInternal(value);
    }
  }, [value]);

  // Simple geocoder using OpenStreetMap Nominatim (no API key). We avoid simulation and perform real HTTP fetch.
  const geocode = useMemo(() => {
    return async (address: string): Promise<LatLng | null> => {
      try {
        if (!address || address.trim().length < 3) return null;
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const data: Array<{ lat: string; lon: string }> = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
        return null;
      } catch (e) {
        console.error('Geocoding failed:', e);
        return null;
      }
    };
  }, []);

  // Debounced geocoding on address changes: always attempt and center/zoom the map.
  useEffect(() => {
    if (!addressText) return;
    const current = addressText.trim();
    if (current.length < 3) return;
    // Avoid duplicate requests for the same value back-to-back
    if (lastGeocodeValueRef.current === current) return;
    const timer = setTimeout(async () => {
      const result = await geocode(current);
      lastGeocodeValueRef.current = current;
      if (result) {
        initializedRef.current = true;
        // We intend to focus and zoom in on the new geocoded position once.
        zoomNextRef.current = true;
        setInternal(result);
        onChange(result);
      } else if (onGeocodeError) {
        onGeocodeError('Address could not be geocoded.');
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [addressText, geocode, onChange, onGeocodeError]);

  // Handler for when the marker drag ends; we propagate to parent and mark as initialized
  const handleDragEnd = async (e: any) => {
    const lat = e.target.getLatLng().lat as number;
    const lng = e.target.getLatLng().lng as number;
    const coord = { lat, lng };
    initializedRef.current = true;
    // When user drags the marker, keep the current zoom level (do not zoom).
    zoomNextRef.current = false;
    setInternal(coord);
    onChange(coord);
  };

  // Helper inner component: whenever 'position' changes, recenter and zoom the map smoothly.
  // We keep it inside the same file for clarity. It uses react-leaflet's useMap hook.
  function RecenterMap({ position, zoomLevel }: { position: LatLng; zoomLevel: number }) {
    // @ts-ignore useMap is dynamically imported
    const map = useMap();
    useEffect(() => {
      if (position) {
        // If we just geocoded or used "Use my location", zoom once to the provided zoom level.
        // Otherwise, preserve the user's current zoom and only pan the map to the new center.
        if (zoomNextRef.current) {
          map.setView([position.lat, position.lng], zoomLevel, { animate: true });
          zoomNextRef.current = false;
        } else {
          // panTo keeps the current zoom unchanged which avoids the annoying zoom reset on marker moves
          map.panTo([position.lat, position.lng], { animate: true });
        }
      }
    }, [map, position, zoomLevel]);
    return null;
  }

  // Optional helper: use current device location button
  const locateMe = async () => {
    if (!('geolocation' in navigator)) return;
    await new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          initializedRef.current = true;
          setInternal(coord);
          onChange(coord);
          // No need to resolve immediately; we still want to zoom in after coordinates are set
          resolve();
        },
        () => resolve(),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Render placeholder while client libs prepare
  if (!ready) {
    return (
      <div className={"h-64 w-full rounded border bg-gray-100 animate-pulse " + (className ?? '')} />
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">Drag the marker to the exact pickup spot or use your current location.</p>
        <button
          type="button"
          onClick={locateMe}
          className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700"
        >
          Use my location
        </button>
      </div>

      <div className="h-64 w-full rounded overflow-hidden border">
        <MapContainer
          center={internal ?? { lat: 45.9432, lng: 24.9668 } /* Romania centroid as neutral fallback */}
          zoom={internal ? zoom : 7}
          style={{ height: '100%', width: '100%' }}
          // Allow users to click the map to place the marker quickly
          // @ts-ignore react-leaflet passes LeafletMouseEvent
          onClick={(e: any) => {
            const coord = { lat: e.latlng.lat as number, lng: e.latlng.lng as number };
            initializedRef.current = true;
            // For map click placement, also keep the existing zoom level.
            zoomNextRef.current = false;
            setInternal(coord);
            onChange(coord);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {internal && (
            // @ts-ignore react-leaflet Marker typing accepts draggable prop
            <Marker position={internal} draggable eventHandlers={{ dragend: handleDragEnd }} />
          )}

          {internal && (
            // Smoothly recenter and zoom whenever coordinates change (useful for 'Use my location' and geocoding)
            <RecenterMap position={internal} zoomLevel={zoom} />
          )}

          {!internal && (
            // If we don't have a point yet, place a temporary marker in center after first interaction
            // User can click "Use my location" or type an address to initialize.
            null
          )}
        </MapContainer>
      </div>
    </div>
  );
}
