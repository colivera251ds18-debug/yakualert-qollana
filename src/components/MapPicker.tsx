import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapErrorBoundary } from './MapErrorBoundary';
import { CENTRO_MAPA } from '../lib/supabase';

// Fix de íconos de Leaflet bajo bundlers
const iconoPin = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

interface Props {
  lat: number;
  lng: number;
  onUbicacion: (lat: number, lng: number) => void;
}

function SelectorPin({ onUbicacion }: { onUbicacion: Props['onUbicacion'] }) {
  useMapEvents({
    click(e) {
      onUbicacion(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

/** Mapa con selector de pin: toca/toca-drag para ubicar la fuga. */
export function MapPicker({ lat, lng, onUbicacion }: Props) {
  return (
    <MapErrorBoundary>
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="h-64 w-full rounded-xl ring-1 ring-gray-200"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <SelectorPin onUbicacion={onUbicacion} />
      <Marker position={[lat, lng]} icon={iconoPin} draggable eventHandlers={{ dragend: (e) => {
        const p = (e.target as L.Marker).getLatLng();
        onUbicacion(p.lat, p.lng);
      }}} />
    </MapContainer>
    </MapErrorBoundary>
  );
}

export const POSICION_INICIAL = { lat: CENTRO_MAPA.lat, lng: CENTRO_MAPA.lng };
export { iconoPin };
