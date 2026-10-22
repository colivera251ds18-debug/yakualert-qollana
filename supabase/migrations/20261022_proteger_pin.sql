-- ============================================================
-- YakuAlert Qollana — Protección del PIN de verificación
-- Archivo: 20261022_proteger_pin.sql
--
-- Problema que corrige:
--   1. La policy de SELECT permitía leer `pin_verificacion` a cualquier
--      visitante, así que el PIN dejaba de ser secreto y cualquiera podía
--      llamar a `cambiar_estado_reporte`.
--   2. El INSERT público permitía fijar `codigo`, `pin_verificacion`,
--      `estado` o `creado_en` desde el cliente.
--   3. `historial_auditoria.codigo_usado` también guarda el PIN y era legible.
--
-- Solución:
--   - SELECT por columnas: `pin_verificacion` queda fuera del alcance de anon.
--   - Se revoca el INSERT directo y se expone la RPC `crear_reporte`, que
--     genera código y PIN en el servidor y los devuelve UNA sola vez.
--   - En auditoría se oculta `codigo_usado`.
-- ============================================================

-- ------------------------------------------------------------
-- 1. reportes_fugas: el PIN deja de ser legible
-- ------------------------------------------------------------
revoke select on public.reportes_fugas from anon, authenticated;

grant select (
  id,
  codigo,
  nombre_vecino,
  sector,
  lat,
  lng,
  descripcion,
  referencia,
  estado,
  creado_en,
  actualizado_en
) on public.reportes_fugas to anon, authenticated;

-- ------------------------------------------------------------
-- 2. reportes_fugas: sin INSERT directo desde el cliente
-- ------------------------------------------------------------
revoke insert, update, delete on public.reportes_fugas from anon, authenticated;

drop policy if exists "reportes_insert_publico" on public.reportes_fugas;

-- ------------------------------------------------------------
-- 3. RPC de creación: genera YAK-### y PIN en el servidor
-- ------------------------------------------------------------
create or replace function public.crear_reporte(
  p_nombre_vecino text,
  p_sector        sector_qollana,
  p_lat           double precision,
  p_lng           double precision,
  p_descripcion   text,
  p_referencia    text default null
)
returns table (codigo text, pin_verificacion text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporte reportes_fugas%rowtype;
begin
  if btrim(coalesce(p_nombre_vecino, '')) = '' then
    raise exception 'El nombre del vecino es obligatorio';
  end if;

  if btrim(coalesce(p_descripcion, '')) = '' then
    raise exception 'La descripción de la fuga es obligatoria';
  end if;

  if p_lat is null or p_lng is null then
    raise exception 'La ubicación de la fuga es obligatoria';
  end if;

  if p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'Coordenadas inválidas';
  end if;

  insert into reportes_fugas (
    nombre_vecino, sector, lat, lng, descripcion, referencia, estado
  ) values (
    btrim(p_nombre_vecino),
    p_sector,
    p_lat,
    p_lng,
    btrim(p_descripcion),
    nullif(btrim(coalesce(p_referencia, '')), ''),
    'Pendiente'
  )
  returning * into v_reporte;

  return query select v_reporte.codigo, v_reporte.pin_verificacion;
end;
$$;

revoke execute on function public.crear_reporte(text, sector_qollana, double precision, double precision, text, text) from public;
grant execute on function public.crear_reporte(text, sector_qollana, double precision, double precision, text, text) to anon, authenticated;

-- ------------------------------------------------------------
-- 4. historial_auditoria: ocultar el PIN usado en cada cambio
-- ------------------------------------------------------------
revoke select on public.historial_auditoria from anon, authenticated;

grant select (
  id,
  reporte_id,
  estado_anterior,
  estado_nuevo,
  accion_realizada,
  usuario_responsable,
  rol_responsable,
  creado_en
) on public.historial_auditoria to anon, authenticated;

-- ------------------------------------------------------------
-- 5. Recargar la caché de esquema de PostgREST
-- ------------------------------------------------------------
notify pgrst, 'reload schema';
