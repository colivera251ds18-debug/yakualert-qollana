// Cola offline: reportes y cambios de estado guardados en localStorage
// hasta poder sincronizarse con Supabase.

import type { EstadoReporte, NuevoReporte, RolSistema } from './types';

const CLAVE_COLA = 'yakualert:cola_reportes';
const CLAVE_COLA_ESTADOS = 'yakualert:cola_estados';

export interface ItemColaReporte {
  local_id: string;
  datos: NuevoReporte;
  creado_local: string;
}

export interface ItemColaEstado {
  local_id: string;
  reporte_id: string;
  estado_nuevo: EstadoReporte;
  usuario: string;
  rol: RolSistema;
  codigo: string;
  creado_local: string;
}

function leer<T>(clave: string): T[] {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo ? (JSON.parse(crudo) as T[]) : [];
  } catch {
    return [];
  }
}

function escribir(clave: string, items: unknown[]): void {
  localStorage.setItem(clave, JSON.stringify(items));
}

export function obtenerColaReportes(): ItemColaReporte[] {
  return leer<ItemColaReporte>(CLAVE_COLA);
}

export function obtenerColaEstados(): ItemColaEstado[] {
  return leer<ItemColaEstado>(CLAVE_COLA_ESTADOS);
}

export function encolarReporte(datos: NuevoReporte): ItemColaReporte {
  const item: ItemColaReporte = {
    local_id: `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    datos,
    creado_local: new Date().toISOString()
  };
  const cola = obtenerColaReportes();
  cola.push(item);
  escribir(CLAVE_COLA, cola);
  return item;
}

export function encolarCambioEstado(item: Omit<ItemColaEstado, 'local_id' | 'creado_local'>): ItemColaEstado {
  const completo: ItemColaEstado = {
    ...item,
    local_id: `LOCAL-EST-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    creado_local: new Date().toISOString()
  };
  const cola = obtenerColaEstados();
  cola.push(completo);
  escribir(CLAVE_COLA_ESTADOS, cola);
  return completo;
}

export function quitarDeCola(clave: 'reportes' | 'estados', localId: string): void {
  if (clave === 'reportes') {
    escribir(CLAVE_COLA, obtenerColaReportes().filter((i) => i.local_id !== localId));
  } else {
    escribir(CLAVE_COLA_ESTADOS, obtenerColaEstados().filter((i) => i.local_id !== localId));
  }
}

export function cantidadPendientes(): number {
  return obtenerColaReportes().length + obtenerColaEstados().length;
}
