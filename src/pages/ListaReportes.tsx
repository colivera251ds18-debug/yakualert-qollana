import { useState } from 'react';
import { ClipboardList, Clock, RefreshCw } from 'lucide-react';
import { BadgeEstado } from '../components/ui/Badge';
import { AuditPinModal } from '../components/AuditPinModal';
import { useToast } from '../components/ui/Toast';
import { cambiarEstadoReporte } from '../lib/reportes';
import { ESTADOS, type EstadoReporte, type ReporteFuga, type RolSistema } from '../lib/types';

interface Props {
  reportes: ReporteFuga[];
  onRecargar: () => void;
}

const FILTROS: ('Todos' | EstadoReporte)[] = ['Todos', ...ESTADOS];

export function ListaReportes({ reportes, onRecargar }: Props) {
  const { mostrar } = useToast();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');
  const [seleccion, setSeleccion] = useState<ReporteFuga | null>(null);

  const filtrados = filtro === 'Todos' ? reportes : reportes.filter((r) => r.estado === filtro);

  const confirmarCambio = async (datos: {
    usuario: string;
    rol: RolSistema;
    codigo: string;
    estadoNuevo: 'En proceso' | 'Atendido';
  }) => {
    if (!seleccion) return;
    const res = await cambiarEstadoReporte(seleccion.id, datos.estadoNuevo, datos.usuario, datos.rol, datos.codigo);
    if (res.ok) {
      mostrar(res.mensaje, res.offline ? 'offline' : 'exito');
      setSeleccion(null);
      onRecargar();
    } else {
      mostrar(res.mensaje, 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Lista de reportes</h1>
        <button
          type="button"
          onClick={onRecargar}
          aria-label="Recargar"
          className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filtros por estado */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              filtro === f
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl bg-gray-50 p-8 text-center text-gray-500">
          <ClipboardList size={28} />
          <p className="text-sm">No hay reportes con estado "{filtro}".</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtrados.map((r) => (
            <li key={r.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-gray-900">{r.codigo}</p>
                  <p className="text-xs text-gray-500">{r.nombre_vecino} · {r.sector}</p>
                </div>
                <BadgeEstado estado={r.estado} />
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-gray-700">{r.descripcion}</p>

              {r.pendiente_sync && (
                <p className="mt-1 text-xs font-medium text-warn">
                  Pendiente de sincronización (sin conexión)
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} />
                  {new Date(r.creado_en).toLocaleString('es-BO', {
                    dateStyle: 'short',
                    timeStyle: 'short'
                  })}
                </span>
                <button
                  type="button"
                  disabled={r.pendiente_sync}
                  onClick={() => setSeleccion(r)}
                  className="rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Marcar Estado
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <AuditPinModal
        reporte={seleccion}
        onCerrar={() => setSeleccion(null)}
        onConfirmar={confirmarCambio}
      />
    </div>
  );
}
