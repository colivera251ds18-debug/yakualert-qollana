import type { EstadoReporte } from '../../lib/types';

const ESTILOS: Record<EstadoReporte, string> = {
  Pendiente: 'bg-amber-100 text-amber-800 ring-amber-200',
  'En proceso': 'bg-primary-100 text-primary-700 ring-primary-100',
  Atendido: 'bg-sustainability-100 text-sustainability-600 ring-sustainability-100'
};

export function BadgeEstado({ estado }: { estado: EstadoReporte }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${ESTILOS[estado]}`}
    >
      {estado}
    </span>
  );
}
