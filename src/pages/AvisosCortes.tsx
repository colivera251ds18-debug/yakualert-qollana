import { CalendarClock, MapPin } from 'lucide-react';
import type { AvisoCorte } from '../lib/types';

interface Props {
  avisos: AvisoCorte[];
}

function formatoFecha(iso: string): string {
  return new Date(iso).toLocaleString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function AvisosCortes({ avisos }: Props) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-gray-900">Avisos de cortes</h1>
      <p className="text-sm text-gray-500">
        Mantenimientos programados de la red de agua por sector.
      </p>

      {avisos.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
          No hay avisos programados por el momento.
        </div>
      ) : (
        <ul className="space-y-3">
          {avisos.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border-l-4 border-warn bg-white p-4 shadow-sm ring-1 ring-gray-100"
            >
              <p className="font-bold text-gray-900">{a.titulo}</p>
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary">
                <MapPin size={12} />
                {a.sector}
              </span>
              <p className="mt-2 flex items-start gap-1.5 text-xs text-gray-600">
                <CalendarClock size={14} className="mt-0.5 shrink-0 text-warn" />
                <span>
                  Del {formatoFecha(a.fecha_inicio)}
                  <br />
                  al {formatoFecha(a.fecha_fin)}
                </span>
              </p>
              <p className="mt-2 text-sm text-gray-700">{a.descripcion}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
