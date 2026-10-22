import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type TipoToast = 'info' | 'exito' | 'error' | 'offline';

interface Toast {
  id: number;
  mensaje: string;
  tipo: TipoToast;
}

interface ContextoToast {
  mostrar: (mensaje: string, tipo?: TipoToast) => void;
}

const Contexto = createContext<ContextoToast>({ mostrar: () => {} });

export function useToast() {
  return useContext(Contexto);
}

const ESTILOS: Record<TipoToast, string> = {
  info: 'bg-primary text-white',
  exito: 'bg-sustainability text-white',
  error: 'bg-danger text-white',
  offline: 'bg-warn text-white'
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tipo: TipoToast = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <Contexto.Provider value={{ mostrar }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-[1000] flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${ESTILOS[t.tipo]} pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </Contexto.Provider>
  );
}
