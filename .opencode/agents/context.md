# Contexto del proyecto — YakuAlert Qollana

## Qué es
PWA en español para la comunidad Qollana: residentes reportan fugas de agua,
el gasfitero comunal y el presidente JASS gestionan los estados.

## Stack
- React 18 + Vite 5 + TypeScript (strict)
- Tailwind CSS puro (sin Shadcn): paleta Primary Blue `#0B6E99`, Sustainability Green `#2E9E5B`
- Leaflet + React-Leaflet (mapa con marcadores de fugas)
- Supabase (`reportes_fugas`, `historial_auditoria`, `avisos_cortes`)
- vite-plugin-pwa (offline: caché + cola de reportes en localStorage)

## Comandos
- `npm run dev` — desarrollo
- `npm run build` — build de producción (tsc + vite build)
- La migración SQL vive en `supabase/migrations/20261020_init_schema.sql`

## Reglas de negocio (no tocar sin auditar)
1. Cualquier vecino puede reportar fugas (acceso público de INSERT).
2. Todo reporte genera código único `YAK-###` y PIN de verificación de 4 dígitos.
3. Solo `Gasfitero Comunal` o `Presidente JASS` cambian estado
   `Pendiente` -> `En proceso` -> `Atendido` (vía RPC `cambiar_estado_reporte`).
4. Cada cambio de estado deja registro en `historial_auditoria` con
   `codigo_usado` validado contra el PIN del reporte (en servidor).
5. Sin conexión: reportes quedan en localStorage y se sincronizan solos.

## Estructura
- `src/pages/` — 4 tabs: Inicio, ReportarFuga, ListaReportes, AvisosCortes
- `src/components/` — BottomNav, MapPicker, AuditPinModal, ui/
- `src/lib/` — supabase.ts, types.ts, reportes.ts (servicios), offline.ts (cola)
