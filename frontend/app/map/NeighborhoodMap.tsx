'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Hidden Ridge, El Dorado Hills center
const CENTER: [number, number] = [38.67253, -121.02622];
const DEFAULT_ZOOM = 16;

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
  return (
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
    </MapContainer>
  );
}
