import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true cuando el proyecto está conectado a Supabase (`.env` configurado) */
export const supabaseConfigurado = Boolean(
  url && anonKey && !url.includes('TU-PROYECTO') && !anonKey.includes('TA_CLAVE')
);

/**
 * Cliente Supabase. Si no hay `.env` queda en `null` y la app
 * funciona en modo demo con datos locales (ver src/lib/reportes.ts).
 */
export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url, anonKey, {
      auth: { persistSession: false }
    })
  : null;

// Centro por defecto de la comunidad Qollana (altiplano boliviano)
export const CENTRO_MAPA = {
  lat: Number(import.meta.env.VITE_LAT_CENTRO ?? -16.5045),
  lng: Number(import.meta.env.VITE_LNG_CENTRO ?? -68.1495)
};
