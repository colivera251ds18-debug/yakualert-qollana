// Tipos compartidos de YakuAlert Qollana (espejo de la DB de Supabase)

export type EstadoReporte = 'Pendiente' | 'En proceso' | 'Atendido';

export type SectorQollana = 'Alto Qollana' | 'Centro' | 'Bajo Qollana';

export type RolSistema = 'Gasfitero Comunal' | 'Presidente JASS';

export const ESTADOS: EstadoReporte[] = ['Pendiente', 'En proceso', 'Atendido'];

export const SECTORES: SectorQollana[] = ['Alto Qollana', 'Centro', 'Bajo Qollana'];

export const ROLES_AUTORIZADOS: RolSistema[] = ['Gasfitero Comunal', 'Presidente JASS'];

export interface ReporteFuga {
  id: string;
  codigo: string;
  pin_verificacion: string;
  nombre_vecino: string;
  sector: SectorQollana;
  lat: number;
  lng: number;
  descripcion: string;
  referencia: string | null;
  estado: EstadoReporte;
  creado_en: string;
  actualizado_en: string;
  /** true si el reporte aún está en la cola local (sin confirmar por Supabase) */
  pendiente_sync?: boolean;
}

export interface AvisoCorte {
  id: string;
  titulo: string;
  sector: SectorQollana;
  fecha_inicio: string;
  fecha_fin: string;
  descripcion: string;
  creado_en: string;
}

export interface AuditoriaRegistro {
  id: string;
  reporte_id: string;
  estado_anterior: EstadoReporte;
  estado_nuevo: EstadoReporte;
  accion_realizada: string;
  usuario_responsable: string;
  rol_responsable: RolSistema;
  codigo_usado: string;
  creado_en: string;
}

export interface NuevoReporte {
  nombre_vecino: string;
  sector: SectorQollana;
  lat: number;
  lng: number;
  descripcion: string;
  referencia: string;
}
