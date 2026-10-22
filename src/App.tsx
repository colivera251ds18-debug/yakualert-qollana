import { useCallback, useEffect, useState } from 'react';
import { BottomNav, type TabId } from './components/BottomNav';
import { ToastProvider } from './components/ui/Toast';
import { Inicio } from './pages/Inicio';
import { ReportarFuga } from './pages/ReportarFuga';
import { ListaReportes } from './pages/ListaReportes';
import { AvisosCortes } from './pages/AvisosCortes';
import { iniciarAutoSync, listarAvisos, listarReportes } from './lib/reportes';
import { supabaseConfigurado } from './lib/supabase';
import type { AvisoCorte, ReporteFuga } from './lib/types';

export default function App() {
  const [tab, setTab] = useState<TabId>('inicio');
  const [reportes, setReportes] = useState<ReporteFuga[]>([]);
  const [avisos, setAvisos] = useState<AvisoCorte[]>([]);

  const cargarReportes = useCallback(async () => {
    try {
      setReportes(await listarReportes());
    } catch (e) {
      console.warn('No se pudieron cargar los reportes:', e);
    }
  }, []);

  const cargarAvisos = useCallback(async () => {
    try {
      setAvisos(await listarAvisos());
    } catch (e) {
      console.warn('No se pudieron cargar los avisos:', e);
    }
  }, []);

  useEffect(() => {
    void cargarReportes();
    void cargarAvisos();
    // Auto-sync de la cola offline: al iniciar, al volver la conexión y cada 60 s
    const parar = iniciarAutoSync(() => {
      void cargarReportes();
    });
    return parar;
  }, [cargarReportes, cargarAvisos]);

  const pendientesSync = reportes.filter((r) => r.pendiente_sync).length;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 pb-20">
        {!supabaseConfigurado && (
          <div className="bg-warn px-4 py-1.5 text-center text-xs font-medium text-white">
            Modo demo: configura .env para conectar Supabase
          </div>
        )}
        <main className="mx-auto max-w-md px-4 py-5">
          {tab === 'inicio' && <Inicio reportes={reportes} onReportar={() => setTab('reportar')} />}
          {tab === 'reportar' && (
            <ReportarFuga onEnviado={() => void cargarReportes()} />
          )}
          {tab === 'reportes' && (
            <ListaReportes reportes={reportes} onRecargar={() => void cargarReportes()} />
          )}
          {tab === 'avisos' && <AvisosCortes avisos={avisos} />}
        </main>
        <BottomNav activo={tab} onCambiar={setTab} badgePendientes={pendientesSync} />
      </div>
    </ToastProvider>
  );
}
