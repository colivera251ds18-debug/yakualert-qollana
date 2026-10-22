-- ============================================================
-- YakuAlert Qollana — Migración inicial
-- Archivo: 20261020_init_schema.sql
-- Tablas: reportes_fugas, historial_auditoria, avisos_cortes
-- Incluye: RLS, RPC de cambio de estado con auditoría, y datos de muestra
-- ============================================================

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------
create type estado_reporte as enum ('Pendiente', 'En proceso', 'Atendido');
create type sector_qollana as enum ('Alto Qollana', 'Centro', 'Bajo Qollana');
create type rol_sistema as enum ('Vecino', 'Gasfitero Comunal', 'Presidente JASS');

-- ------------------------------------------------------------
-- 2. TABLA: reportes_fugas (reportes públicos de fugas)
-- ------------------------------------------------------------
create table reportes_fugas (
  id              uuid primary key default gen_random_uuid(),
  codigo          text unique not null,               -- YAK-001, YAK-002...
  pin_verificacion text not null,                     -- PIN de 4 dígitos (sistema)
  nombre_vecino   text not null,
  sector          sector_qollana not null,
  lat             double precision not null,
  lng             double precision not null,
  descripcion     text not null,
  referencia      text,                               -- punto de referencia físico
  estado          estado_reporte not null default 'Pendiente',
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index idx_reportes_estado on reportes_fugas (estado);
create index idx_reportes_sector on reportes_fugas (sector);

-- ------------------------------------------------------------
-- 3. TABLA: historial_auditoria (trazabilidad de cambios)
-- ------------------------------------------------------------
create table historial_auditoria (
  id                  uuid primary key default gen_random_uuid(),
  reporte_id          uuid not null references reportes_fugas (id) on delete cascade,
  estado_anterior     estado_reporte not null,
  estado_nuevo        estado_reporte not null,
  accion_realizada    text not null,
  usuario_responsable text not null,
  rol_responsable     rol_sistema not null,
  codigo_usado        text not null,                  -- PIN ingresado al momento del cambio
  creado_en           timestamptz not null default now()
);

create index idx_auditoria_reporte on historial_auditoria (reporte_id);

-- ------------------------------------------------------------
-- 4. TABLA: avisos_cortes (mantenimientos programados)
-- ------------------------------------------------------------
create table avisos_cortes (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  sector      sector_qollana not null,
  fecha_inicio timestamptz not null,
  fecha_fin    timestamptz not null,
  descripcion text not null,
  creado_en   timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5. SECUENCIA Y FUNCIÓN: generación de código YAK-### y PIN
-- ------------------------------------------------------------
create sequence codigo_fuga_seq start 1;

create or replace function generar_codigo_fuga()
returns trigger
language plpgsql
as $$
begin
  if new.codigo is null or new.codigo = '' then
    new.codigo := 'YAK-' || lpad(nextval('codigo_fuga_seq')::text, 3, '0');
  end if;
  if new.pin_verificacion is null or new.pin_verificacion = '' then
    new.pin_verificacion := lpad((floor(random() * 9000) + 1000)::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger trg_generar_codigo
  before insert on reportes_fugas
  for each row execute function generar_codigo_fuga();

create or replace function marcar_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger trg_actualizado
  before update on reportes_fugas
  for each row execute function marcar_actualizado();

-- ------------------------------------------------------------
-- 6. RLS: acceso público de lectura e INSERT de reportes
-- ------------------------------------------------------------
alter table reportes_fugas enable row level security;
alter table historial_auditoria enable row level security;
alter table avisos_cortes enable row level security;

-- Cualquiera (rol anon) puede VER reportes y avisos
create policy "reportes_select_publico"
  on reportes_fugas for select
  to anon, authenticated
  using (true);

create policy "avisos_select_publico"
  on avisos_cortes for select
  to anon, authenticated
  using (true);

-- Cualquiera puede CREAR reportes, pero SIEMPRE como Pendiente
-- (el cliente no puede forzar otro estado ni elegir código)
create policy "reportes_insert_publico"
  on reportes_fugas for insert
  to anon, authenticated
  with check (estado = 'Pendiente');

-- El historial es visible (trazabilidad) pero NO editable desde el cliente
create policy "auditoria_select_publico"
  on historial_auditoria for select
  to anon, authenticated
  using (true);

-- SIN políticas de UPDATE/DELETE para anon: los estados solo cambian vía RPC.

-- ------------------------------------------------------------
-- 7. RPC: cambiar_estado_reporte (valida PIN + auditoría atómica)
-- ------------------------------------------------------------
create or replace function cambiar_estado_reporte(
  p_reporte_id uuid,
  p_estado_nuevo estado_reporte,
  p_usuario text,
  p_rol rol_sistema,
  p_codigo text
)
returns table (codigo_resultante text, estado_final estado_reporte)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reporte reportes_fugas%rowtype;
begin
  select * into v_reporte from reportes_fugas where id = p_reporte_id for update;
  if not found then
    raise exception 'Reporte no encontrado';
  end if;

  -- El rol debe ser autorizado del sistema
  if p_rol not in ('Gasfitero Comunal', 'Presidente JASS') then
    raise exception 'Rol no autorizado para cambiar estados';
  end if;

  -- Validación del PIN de verificación EN SERVIDOR
  if v_reporte.pin_verificacion <> p_codigo then
    raise exception 'PIN de verificación incorrecto';
  end if;

  -- Transición válida: Pendiente -> En proceso -> Atendido
  if not (
    (v_reporte.estado = 'Pendiente' and p_estado_nuevo = 'En proceso') or
    (v_reporte.estado = 'En proceso' and p_estado_nuevo = 'Atendido')
  ) then
    raise exception 'Transición de estado no permitida: % -> %', v_reporte.estado, p_estado_nuevo;
  end if;

  update reportes_fugas set estado = p_estado_nuevo where id = p_reporte_id;

  -- Registro de auditoría (obligatorio en la misma transacción)
  insert into historial_auditoria (
    reporte_id, estado_anterior, estado_nuevo,
    accion_realizada, usuario_responsable, rol_responsable, codigo_usado
  ) values (
    p_reporte_id, v_reporte.estado, p_estado_nuevo,
    'Cambio de estado ' || v_reporte.estado || ' -> ' || p_estado_nuevo,
    p_usuario, p_rol, p_codigo
  );

  return query select v_reporte.codigo, p_estado_nuevo;
end;
$$;

-- ------------------------------------------------------------
-- 8. DATOS DE MUESTRA: 5 reportes + 2 avisos de corte
-- Coordenadas aproximadas del altiplano (La Paz/El Alto, Bolivia)
-- ------------------------------------------------------------
insert into reportes_fugas (codigo, pin_verificacion, nombre_vecino, sector, lat, lng, descripcion, referencia, estado) values
  ('YAK-001', '7842', 'Rosa Mamani Quispe',    'Alto Qollana', -16.5012, -68.1520, 'Fuga de agua en la cañería principal del tanque comunal; el agua sale a chorros desde la conexión.', 'Esquina superior de la Plaza Qollana, junto al tanque elevado', 'Pendiente'),
  ('YAK-002', '3105', 'Juan Carlos Flores',    'Centro',       -16.5045, -68.1487, 'Canilla de la red interna gotea de forma continua en el patio comunitario.', 'Frente a la tienda de doña Elena, calle central', 'En proceso'),
  ('YAK-003', '9264', 'María Elena Condori',   'Bajo Qollana', -16.5089, -68.1452, 'Rotura de tubería enterrada bajo el camino de acceso; hay encharcamiento permanente.', 'Después del puente peatonal, camino a las chacras', 'Atendido'),
  ('YAK-004', '4518', 'Pedro Aguilar Ticona',  'Alto Qollana', -16.4998, -68.1541, 'Válvula de control del acueducto con fuga en la roscada; pierde presión del sector alto.', 'Poste 12 del camino alto, junto a la capilla', 'Pendiente'),
  ('YAK-005', '6037', 'Lucía Mamani Aura',     'Centro',       -16.5051, -68.1495, 'Desagüe del depósito comunal desconectado; el agua escurre por la calle.', 'Depósito comunal de Centro Qollana, puerta lateral', 'Pendiente');

insert into avisos_cortes (titulo, sector, fecha_inicio, fecha_fin, descripcion) values
  ('Mantenimiento de la válvula de control principal',
   'Alto Qollana',
   now() + interval '2 days',
   now() + interval '2 days' + interval '5 hours',
   'Se realizarán trabajos de mantenimiento preventivo en la válvula principal del acueducto. El servicio de agua será suspendido en todo el sector Alto Qollana durante la jornada. Recomendamos almacenar agua el día anterior.'),

  ('Limpieza y cloración del tanque comunal',
   'Centro',
   now() + interval '7 days',
   now() + interval '7 days' + interval '3 hours',
   'Limpieza programada del tanque de almacenamiento comunal y cloración de la red. Habrá interrupción del servicio en el sector Centro desde la madrugada hasta finalizar los trabajos. El agua volverá con ligeramente clorada, apta para consumo tras reposar.');
