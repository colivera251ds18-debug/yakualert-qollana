import { ClipboardList, Droplets, Home, Megaphone } from 'lucide-react';

export type TabId = 'inicio' | 'reportar' | 'reportes' | 'avisos';

const TABS: { id: TabId; etiqueta: string; Icono: typeof Home }[] = [
  { id: 'inicio', etiqueta: 'Inicio', Icono: Home },
  { id: 'reportar', etiqueta: 'Reportar Fuga', Icono: Droplets },
  { id: 'reportes', etiqueta: 'Reportes', Icono: ClipboardList },
  { id: 'avisos', etiqueta: 'Avisos', Icono: Megaphone }
];

interface Props {
  activo: TabId;
  onCambiar: (tab: TabId) => void;
  badgePendientes?: number;
}

export function BottomNav({ activo, onCambiar, badgePendientes = 0 }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-[800] border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ id, etiqueta, Icono }) => {
          const seleccionado = activo === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onCambiar(id)}
              aria-current={seleccionado ? 'page' : undefined}
              className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                seleccionado ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="relative">
                <Icono size={22} strokeWidth={seleccionado ? 2.4 : 1.8} />
                {id === 'reportes' && badgePendientes > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-warn px-1 text-[9px] font-bold text-white">
                    {badgePendientes}
                  </span>
                )}
              </span>
              {etiqueta}
              {seleccionado && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
