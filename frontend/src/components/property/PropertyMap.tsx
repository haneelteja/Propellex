import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { formatRupeesCr } from '@/lib/utils';
import type { Property } from '@/types';

// Fix Leaflet default marker icon path in Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const navyIcon = new L.DivIcon({
  className: '',
  html: `<div style="
    width:28px;height:28px;background:#1E3A5F;border-radius:50% 50% 50% 0;
    transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -30],
});

interface PropertyMapProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
}

export function PropertyMap({
  properties,
  center = [17.4401, 78.3489],
  zoom = 12,
}: PropertyMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="w-full h-full rounded-xl z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={navyIcon}>
          <Popup>
            <div className="text-sm max-w-[200px]">
              <p className="font-semibold text-navy leading-snug mb-1">{p.title}</p>
              <p className="text-gray-500 text-xs mb-2">{p.locality}</p>
              <p className="font-bold text-navy text-base mb-2">{formatRupeesCr(p.price)}</p>
              <Link
                to={`/property/${p.id}`}
                className="text-brand text-xs hover:underline"
              >
                View details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
