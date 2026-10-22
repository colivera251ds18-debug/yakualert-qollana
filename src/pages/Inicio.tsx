import { Leaf, Droplets, MapPin, WifiOff } from 'lucide-react';
import { ReportesMap } from '../components/ReportesMap';
import { CENTRO_MAPA } from '../lib/supabase';
import { useConexion } from '../hooks/useConexion';
import type { ReporteFuga } from '../lib/types';

interface Props {
  reportes: ReporteFuga[];
  onReportar: () => void;
}

export function Inicio({ reportes, onReportar }: Props) {
  const { enLinea } = useConexion();
  const activos = reportes.filter((r) => r.estado !== 'Atendido');

  return (
    <div className="space-y-5">
      {/* Encabezado / propuesta de valor */}
      <div className="rounded-2xl bg-primary p-5 text-white">
        <h1 className="text-xl font-bold">YakuAlert Qollana</h1>
        <p className="mt-1 text-sm text-primary-100">
          Reporta y da seguimiento a las fugas de agua de tu comunidad. Entre todos
          cuidamos cada gota.
        </p>
        <button
          type="button"
          onClick={onReportar}
          className="mt-4 w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary-50"
        >
          <Droplets className="mr-1 inline" size={16} />
          Reportar una fuga ahora
        </button>
      </div>

      {!enLinea && (
        <div className="flex items-center gap-2 rounded-xl bg-warn/10 p-3 text-sm font-medium text-warn ring-1 ring-warn/20">
          <WifiOff size={18} />
          Sin conexión: tus reportes se guardarán y se enviarán solos.
        </div>
      )}

      {/* Banner de impacto sostenible */}
      <div className="flex items-center gap-3 rounded-2xl bg-sustainability-50 p-4 ring-1 ring-sustainability-100">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sustainability text-white">
          <Leaf size={22} />
        </span>
        <div>
          <p className="text-sm font-bold text-sustainability-600">
            30% de agua recuperada · ODS 6
          </p>
          <p className="text-xs text-gray-600">
            Meta de referencia: agua limpia y saneamiento para Qollana.
          </p>
        </div>
      </div>

      {/* Mapa panorámico con fugas activas */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1 text-sm font-bold text-gray-800">
            <MapPin size={16} className="text-primary" />
            Fugas activas en el mapa
          </h2>
          <span className="text-xs text-gray-500">{activos.length} activas</span>
        </div>
        <ReportesMap reportes={reportes} centro={CENTRO_MAPA} />
      </section>
    </div>
  );
}
