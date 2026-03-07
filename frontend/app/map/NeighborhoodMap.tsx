'use client';

import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, Loader2, X } from 'lucide-react';

// Fix Leaflet default marker icon issue in Next.js/webpack
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const searchIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'search-marker',
});

// Hidden Ridge, El Dorado Hills center
const CENTER: [number, number] = [38.67253, -121.02622];
const DEFAULT_ZOOM = 17;

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

// Component to fly the map to a location
function FlyTo({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  if (position) {
    map.flyTo(position, zoom || 18, { duration: 1 });
  }
  return null;
}

export default function NeighborhoodMap({ members }: Props) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<{ lat: number; lon: number; name: string } | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      // Append El Dorado Hills context for better results
      const searchQuery = query.toLowerCase().includes('el dorado') || query.toLowerCase().includes('edh')
        ? query
        : `${query}, El Dorado Hills, CA`;

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'User-Agent': 'HiddenRidgeEDH/1.0' } }
      );
      const data = await res.json();
      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const pos: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setSearchResult({ lat: parseFloat(lat), lon: parseFloat(lon), name: display_name });
        setFlyTarget(pos);
      } else {
        setSearchResult(null);
      }
    } catch {
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const clearSearch = () => {
    setQuery('');
    setSearchResult(null);
    setFlyTarget(CENTER);
  };

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000]">
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

      <MapContainer
        center={CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FlyTo position={flyTarget} />
        {members.map((member) => (
          <Marker
            key={member.id}
            position={[member.latitude, member.longitude]}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-forest-800">{member.full_name}</strong>
                {member.address && (
                  <p className="text-forest-500 mt-1 text-xs">{member.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        {searchResult && (
          <Marker
            position={[searchResult.lat, searchResult.lon]}
            icon={searchIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong className="text-forest-800">Search Result</strong>
                <p className="text-forest-500 mt-1 text-xs">{searchResult.name}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
