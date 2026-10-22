// Servicios de datos de YakuAlert Qollana.
// Si Supabase está configurado usa la nube; si no, funciona en modo demo
// con datos locales para poder probar la interfaz.

import { supabase, supabaseConfigurado } from './supabase';
import {
  encolarCambioEstado,
  encolarReporte,
  obtenerColaEstados,
  obtenerColaReportes,
  quitarDeCola
} from './offline';
import type {
  AvisoCorte,
  EstadoReporte,
  NuevoReporte,
  ReporteFuga,
  RolSistema
} from './types';

// ---------------------------------------------------------------
// Datos demo (solo se usan si no hay `.env` de Supabase)
// ---------------------------------------------------------------
const ahoraISO = new Date().toISOString();

const REPORTES_DEMO: ReporteFuga[] = [
  {
    id: 'demo-1',
    codigo: 'YAK-001',
    pin_verificacion: '7842',
    nombre_vecino: 'Rosa Mamani Quispe',
    sector: 'Alto Qollana',
    lat: -16.5012,
    lng: -68.152,
    descripcion: 'Fuga de agua en la cañería principal del tanque comunal; el agua sale a chorros desde la conexión.',
    referencia: 'Esquina superior de la Plaza Qollana, junto al tanque elevado',
    estado: 'Pendiente',
    creado_en: ahoraISO,
    actualizado_en: ahoraISO
  },
  {
    id: 'demo-2',
    codigo: 'YAK-002',
    pin_verificacion: '3105',
    nombre_vecino: 'Juan Carlos Flores',
    sector: 'Centro',
    lat: -16.5045,
    lng: -68.1487,
    descripcion: 'Canilla de la red interna gotea de forma continua en el patio comunitario.',
    referencia: 'Frente a la tienda de doña Elena, calle central',
    estado: 'En proceso',
    creado_en: ahoraISO,
    actualizado_en: ahoraISO
  },
  {
    id: 'demo-3',
    codigo: 'YAK-003',
    pin_verificacion: '9264',
    nombre_vecino: 'María Elena Condori',
    sector: 'Bajo Qollana',
    lat: -16.5089,
    lng: -68.1452,
    descripcion: 'Rotura de tubería enterrada bajo el camino de acceso; hay encharcamiento permanente.',
    referencia: 'Después del puente peatonal, camino a las chacras',
    estado: 'Atendido',
    creado_en: ahoraISO,
    actualizado_en: ahoraISO
  },
  {
    id: 'demo-4',
    codigo: 'YAK-004',
    pin_verificacion: '4518',
    nombre_vecino: 'Pedro Aguilar Ticona',
    sector: 'Alto Qollana',
    lat: -16.4998,
    lng: -68.1541,
    descripcion: 'Válvula de control del acueducto con fuga en la roscada; pierde presión del sector alto.',
    referencia: 'Poste 12 del camino alto, junto a la capilla',
    estado: 'Pendiente',
    creado_en: ahoraISO,
    actualizado_en: ahoraISO
  },
  {
    id: 'demo-5',
    codigo: 'YAK-005',
    pin_verificacion: '6037',
    nombre_vecino: 'Lucía Mamani Aura',
    sector: 'Centro',
    lat: -16.5051,
    lng: -68.1495,
    descripcion: 'Desagüe del depósito comunal desconectado; el agua escurre por la calle.',
    referencia: 'Depósito comunal de Centro Qollana, puerta lateral',
    estado: 'Pendiente',
    creado_en: ahoraISO,
    actualizado_en: ahoraISO
  }
];

const AVISOS_DEMO: AvisoCorte[] = [
  {
    id: 'aviso-1',
    titulo: 'Mantenimiento de la válvula de control principal',
    sector: 'Alto Qollana',
    fecha_inicio: new Date(Date.now() + 2 * 864e5).toISOString(),
    fecha_fin: new Date(Date.now() + 2 * 864e5 + 5 * 36e5).toISOString(),
    descripcion:
      'Se realizarán trabajos de mantenimiento preventivo en la válvula principal del acueducto. El servicio de agua será suspendido en todo el sector Alto Qollana durante la jornada. Recomendamos almacenar agua el día anterior.',
    creado_en: ahoraISO
  },
  {
    id: 'aviso-2',
    titulo: 'Limpieza y cloración del tanque comunal',
    sector: 'Centro',
    fecha_inicio: new Date(Date.now() + 7 * 864e5).toISOString(),
    fecha_fin: new Date(Date.now() + 7 * 864e5 + 3 * 36e5).toISOString(),
    descripcion:
      'Limpieza programada del tanque de almacenamiento comunal y cloración de la red. Habrá interrupción del servicio en el sector Centro desde la madrugada hasta finalizar los trabajos.',
    creado_en: ahoraISO
  }
];

// ---------------------------------------------------------------
// Reportes
// ---------------------------------------------------------------

export async function listarReportes(): Promise<ReporteFuga[]> {
  // Reportes locales aún no sincronizados (visibles aunque estén offline)
  const locales: ReporteFuga[] = obtenerColaReportes().map((item) => ({
    id: item.local_id,
    codigo: item.local_id,
    ...item.datos,
    referencia: item.datos.referencia || null,
    estado: 'Pendiente' as EstadoReporte,
    creado_en: item.creado_local,
    actualizado_en: item.creado_local,
    pendiente_sync: true
  }));

  if (!supabase || !supabaseConfigurado) {
    return [...locales, ...REPORTES_DEMO];
  }

  const { data, error } = await supabase
    .from('reportes_fugas')
    .select('id, codigo, nombre_vecino, sector, lat, lng, descripcion, referencia, estado, creado_en, actualizado_en')
    .order('creado_en', { ascending: false });

  if (error) throw error;
  return [...locales, ...(data as ReporteFuga[])];
}

export interface ResultadoCreacion {
  codigo: string;
  /** PIN de verificación (solo si el reporte se registró en el servidor). */
  pin?: string;
  offline: boolean;
}

/**
 * Crea un reporte. Si no hay conexión (o Supabase no está configurado),
 * lo deja en la cola local para sincronización posterior.
 *
 * El código YAK-### y el PIN los genera el servidor dentro de la RPC
 * `crear_reporte`; el cliente no puede elegirlos ni leerlos después.
 */
export async function crearReporte(datos: NuevoReporte): Promise<ResultadoCreacion> {
  if (!supabase || !supabaseConfigurado || !navigator.onLine) {
    const item = encolarReporte(datos);
    return { codigo: item.local_id, offline: true };
  }

  const { data, error } = await supabase.rpc('crear_reporte', {
    p_nombre_vecino: datos.nombre_vecino,
    p_sector: datos.sector,
    p_lat: datos.lat,
    p_lng: datos.lng,
    p_descripcion: datos.descripcion,
    p_referencia: datos.referencia || null
  });

  if (error) throw error;

  const fila = (data as { codigo: string; pin_verificacion: string }[] | null)?.[0];
  if (!fila) throw new Error('El servidor no devolvió el código del reporte');

  return { codigo: fila.codigo, pin: fila.pin_verificacion, offline: false };
}

// ---------------------------------------------------------------
// Cambio de estado (solo roles autorizados, con PIN)
// ---------------------------------------------------------------

export interface ResultadoCambioEstado {
  ok: boolean;
  offline: boolean;
  mensaje: string;
}

export async function cambiarEstadoReporte(
  reporteId: string,
  estadoNuevo: EstadoReporte,
  usuario: string,
  rol: RolSistema,
  codigo: string
): Promise<ResultadoCambioEstado> {
  // Cola offline: se aplicará vía RPC cuando vuelva la conexión
  if (!supabase || !supabaseConfigurado || !navigator.onLine) {
    encolarCambioEstado({ reporte_id: reporteId, estado_nuevo: estadoNuevo, usuario, rol, codigo });
    return { ok: true, offline: true, mensaje: 'Cambio guardado sin conexión; se aplicará automáticamente.' };
  }

  const { error } = await supabase.rpc('cambiar_estado_reporte', {
    p_reporte_id: reporteId,
    p_estado_nuevo: estadoNuevo,
    p_usuario: usuario,
    p_rol: rol,
    p_codigo: codigo
  });

  if (error) {
    return { ok: false, offline: false, mensaje: error.message };
  }
  return { ok: true, offline: false, mensaje: `Estado actualizado a "${estadoNuevo}".` };
}

// ---------------------------------------------------------------
// Avisos de cortes
// ---------------------------------------------------------------

export async function listarAvisos(): Promise<AvisoCorte[]> {
  if (!supabase || !supabaseConfigurado) return AVISOS_DEMO;

  const { data, error } = await supabase
    .from('avisos_cortes')
    .select('*')
    .order('fecha_inicio', { ascending: true });

  if (error) throw error;
  return data as AvisoCorte[];
}

// ---------------------------------------------------------------
// Sincronización de la cola offline
// ---------------------------------------------------------------

let sincronizando = false;

/** Envía a Supabase todo lo guardado en la cola local. Idempotente. */
export async function sincronizarCola(): Promise<{ enviados: number; fallidos: number }> {
  if (sincronizando || !supabase || !supabaseConfigurado || !navigator.onLine) {
    return { enviados: 0, fallidos: 0 };
  }
  sincronizando = true;
  let enviados = 0;
  let fallidos = 0;

  try {
    // 1) Reportes pendientes
    for (const item of obtenerColaReportes()) {
      const { error } = await supabase.rpc('crear_reporte', {
        p_nombre_vecino: item.datos.nombre_vecino,
        p_sector: item.datos.sector,
        p_lat: item.datos.lat,
        p_lng: item.datos.lng,
        p_descripcion: item.datos.descripcion,
        p_referencia: item.datos.referencia || null
      });
      if (error) {
        fallidos += 1; // se queda en cola para reintentar
      } else {
        quitarDeCola('reportes', item.local_id);
        enviados += 1;
      }
    }

    // 2) Cambios de estado pendientes
    for (const item of obtenerColaEstados()) {
      const { error } = await supabase.rpc('cambiar_estado_reporte', {
        p_reporte_id: item.reporte_id,
        p_estado_nuevo: item.estado_nuevo,
        p_usuario: item.usuario,
        p_rol: item.rol,
        p_codigo: item.codigo
      });
      if (error) {
        fallidos += 1;
      } else {
        quitarDeCola('estados', item.local_id);
        enviados += 1;
      }
    }
  } finally {
    sincronizando = false;
  }

  return { enviados, fallidos };
}

/** Arranca el auto-sync: al cargar, al volver la conexión y cada 60 s. */
export function iniciarAutoSync(callback?: () => void): () => void {
  const correr = () => {
    void sincronizarCola().then((r) => {
      if (r.enviados > 0) callback?.();
    });
  };
  correr();
  window.addEventListener('online', correr);
  const intervalo = window.setInterval(correr, 60_000);
  return () => {
    window.removeEventListener('online', correr);
    window.clearInterval(intervalo);
  };
}
