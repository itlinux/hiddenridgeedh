'use client';

import { useState, useCallback, useRef } from 'react';
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from '@react-google-maps/api';
import { Search, Loader2, X } from 'lucide-react';

const CENTER = { lat: 38.67253, lng: -121.02622 };
const DEFAULT_ZOOM = 17;
const LIBRARIES: ('places')[] = ['places'];

const mapContainerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  mapTypeId: 'hybrid',
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
  zoomControl: true,
};

interface MemberPin {
  id: string;
  full_name?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

interface Props {
  members: MemberPin[];
}

export default function NeighborhoodMap({ members }: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || '',
    libraries: LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberPin | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMarker, setSearchMarker] = useState<{ lat: number; lng: number; name: string } | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || !mapRef.current) return;

    setSearching(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const searchQuery = query.toLowerCase().includes('el dorado') || query.toLowerCase().includes('edh')
        ? query
        : `${query}, El Dorado Hills, CA`;

      const result = await geocoder.geocode({ address: searchQuery });
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        const pos = { lat: location.lat(), lng: location.lng() };
        setSearchMarker({ ...pos, name: result.results[0].formatted_address });
        mapRef.current.panTo(pos);
        mapRef.current.setZoom(18);
        setSelectedMember(null);
      }
    } catch {
      // Geocoding failed
    } finally {
      setSearching(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchMarker(null);
    if (mapRef.current) {
      mapRef.current.panTo(CENTER);
      mapRef.current.setZoom(DEFAULT_ZOOM);
    }
  };

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full bg-cream-100">
        <p className="text-forest-500 font-sans text-sm">Failed to load Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full bg-cream-100">
        <Loader2 className="animate-spin text-forest-400" size={32} />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div className="absolute top-3 left-3 right-3 z-10">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search address..."
              className="w-full pl-9 pr-8 py-2 text-sm rounded-sm border border-forest-200 bg-white shadow-md focus:outline-none focus:border-gold-400 font-sans"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
            {query && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600">
                <X size={14} />
              </button>
            )}
          </div>
          <button type="submit" disabled={searching} className="btn-primary text-xs px-4 py-2 shadow-md">
            {searching ? <Loader2 size={14} className="animate-spin" /> : 'Go'}
          </button>
        </form>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={CENTER}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        options={mapOptions}
      >
        {members.map((member) => (
          <MarkerF
            key={member.id}
            position={{ lat: member.latitude, lng: member.longitude }}
            onClick={() => setSelectedMember(member)}
          />
        ))}

        {selectedMember && (
          <InfoWindowF
            position={{ lat: selectedMember.latitude, lng: selectedMember.longitude }}
            onCloseClick={() => setSelectedMember(null)}
          >
            <div className="text-sm p-1">
              <strong className="text-forest-800">{selectedMember.full_name}</strong>
              {selectedMember.address && (
                <p className="text-forest-500 mt-1 text-xs">{selectedMember.address}</p>
              )}
            </div>
          </InfoWindowF>
        )}

        {searchMarker && (
          <>
            <MarkerF
              position={{ lat: searchMarker.lat, lng: searchMarker.lng }}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
              }}
              onClick={() => {}}
            />
            <InfoWindowF
              position={{ lat: searchMarker.lat, lng: searchMarker.lng }}
              onCloseClick={() => setSearchMarker(null)}
            >
              <div className="text-sm p-1">
                <strong className="text-forest-800">Search Result</strong>
                <p className="text-forest-500 mt-1 text-xs">{searchMarker.name}</p>
              </div>
            </InfoWindowF>
          </>
        )}
      </GoogleMap>
    </div>
  );
}
