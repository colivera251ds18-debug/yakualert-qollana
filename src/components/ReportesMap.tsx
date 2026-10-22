import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { MapErrorBoundary } from './MapErrorBoundary';
import { iconoPin } from './MapPicker';
import type { ReporteFuga } from '../lib/types';
import { BadgeEstado } from './ui/Badge';

const COLORES: Record<string, string> = {
  Pendiente: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  'En proceso': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  Atendido: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png'
};

const iconos = Object.fromEntries(
  Object.entries(COLORES).map(([estado, url]) => [
    estado,
    L.icon({ iconUrl: url, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] })
  ])
) as Record<string, L.Icon>;

interface Props {
  reportes: ReporteFuga[];
  centro: { lat: number; lng: number };
}

/** Mapa panorámico de Inicio: marcadores coloreados por estado. */
export function ReportesMap({ reportes, centro }: Props) {
  return (
    <MapErrorBoundary mensaje="No se pudo cargar el mapa de fugas">
      <MapContainer
        center={[centro.lat, centro.lng]}
        zoom={14}
        className="h-72 w-full rounded-xl ring-1 ring-gray-200"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reportes.map((r) => (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={iconos[r.estado] ?? iconoPin}
          >
            <Popup>
              <div className="space-y-1 text-sm">
                <p className="font-bold">{r.codigo}</p>
                <BadgeEstado estado={r.estado} />
                <p className="text-xs text-gray-600">{r.sector}</p>
                <p className="line-clamp-3 text-xs">{r.descripcion}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </MapErrorBoundary>
  );
}
