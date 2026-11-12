-- =====================================================================
-- PANEL MAESTRO — MIGRACIÓN (correr UNA vez en Supabase → SQL Editor)
-- =====================================================================
-- Qué hace:
--   1. Función es_superadmin(): true solo si la sesión tiene rol "superadmin"
--      en app_metadata (NUNCA user_metadata: ese lo puede reescribir el propio
--      usuario desde el navegador).
--   2. Tabla plataforma_suscripciones: plan, valor mensual, URL y notas de
--      cada negocio cliente (datos comerciales tuyos, no del negocio).
--   3. Tabla plataforma_pagos: historial de pagos de mensualidad.
--   4. Políticas en negocios para que el superadmin vea TODOS (también los
--      inactivos), cree negocios y los edite. No hay política de borrado a
--      propósito: borrar un negocio borra en cascada todo su catálogo y pedidos.
--   5. Funciones sa_* (security definer) que arman los resúmenes con datos de
--      todas las tablas sin tener que abrir el RLS de cada una.
--
-- No cambia nada para las apps de los negocios: sus políticas siguen igual.
-- Es idempotente en las funciones (create or replace); las tablas usan
-- "if not exists" y las políticas se borran y recrean.
-- =====================================================================

begin;

-- 1. ¿La sesión actual es el superadmin de la plataforma? -------------------
create or replace function public.es_superadmin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'rol') = 'superadmin', false);
$$;

-- 2. Suscripción comercial de cada negocio ---------------------------------
create table if not exists public.plataforma_suscripciones (
  negocio_id     uuid primary key references public.negocios(id) on delete cascade,
  plan           text not null default 'Básico',
  valor_mensual  numeric(12,2) not null default 0 check (valor_mensual >= 0),
  url_sitio      text,
  notas          text,
  actualizado_en timestamptz not null default now()
);

alter table public.plataforma_suscripciones enable row level security;

drop policy if exists "Superadmin gestiona suscripciones" on public.plataforma_suscripciones;
create policy "Superadmin gestiona suscripciones"
on public.plataforma_suscripciones
for all to authenticated
using (public.es_superadmin())
with check (public.es_superadmin());

-- 3. Pagos de mensualidad ---------------------------------------------------
create table if not exists public.plataforma_pagos (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocios(id) on delete cascade,
  monto       numeric(12,2) not null check (monto >= 0),
  fecha_pago  date not null default current_date,
  meses       int not null default 1 check (meses between 1 and 24),
  metodo      text,
  nota        text,
  creado_en   timestamptz not null default now()
);

create index if not exists plataforma_pagos_negocio_idx
  on public.plataforma_pagos (negocio_id, fecha_pago desc);

alter table public.plataforma_pagos enable row level security;

drop policy if exists "Superadmin gestiona pagos" on public.plataforma_pagos;
create policy "Superadmin gestiona pagos"
on public.plataforma_pagos
for all to authenticated
using (public.es_superadmin())
with check (public.es_superadmin());

-- 4. Superadmin sobre negocios (se SUMAN con OR a las políticas existentes) -
drop policy if exists "Superadmin lee todos los negocios" on public.negocios;
create policy "Superadmin lee todos los negocios"
on public.negocios for select to authenticated
using (public.es_superadmin());

drop policy if exists "Superadmin crea negocios" on public.negocios;
create policy "Superadmin crea negocios"
on public.negocios for insert to authenticated
with check (public.es_superadmin());

drop policy if exists "Superadmin edita negocios" on public.negocios;
create policy "Superadmin edita negocios"
on public.negocios for update to authenticated
using (public.es_superadmin())
with check (public.es_superadmin());

-- 5a. Resumen de todos los negocios (pantalla principal) --------------------
-- Los usuarios de Auth se cruzan por el correo interno que usan las apps:
--   numero.negocio_id@interno.local  (ver src/lib/phoneAuth.js de cada app)
create or replace function public.sa_resumen_negocios()
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_resultado jsonb;
begin
  if not public.es_superadmin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(fila order by (fila ->> 'creado_en') desc), '[]'::jsonb)
  into v_resultado
  from (
    select jsonb_build_object(
      'id', n.id,
      'nombre', n.nombre,
      'slug', n.slug,
      'dominio_propio', n.dominio_propio,
      'activo', n.activo,
      'fecha_proximo_pago', n.fecha_proximo_pago,
      'whatsapp_contacto', n.whatsapp_contacto,
      'creado_en', n.creado_en,
      'plan', s.plan,
      'valor_mensual', coalesce(s.valor_mensual, 0),
      'url_sitio', s.url_sitio,
      'duenos', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'nombre', ua.nombre, 'numero', ua.numero, 'activo', ua.activo)
                 order by ua.creado_en), '[]'::jsonb)
        from usuarios_admin ua
        where ua.negocio_id = n.id and ua.rol = 'dueño'
      ),
      'empleados', (
        select count(*) from usuarios_admin ua
        where ua.negocio_id = n.id and ua.rol = 'empleado'
      ),
      'productos', (select count(*) from productos p where p.negocio_id = n.id),
      'pedidos_total', (select count(*) from pedidos pe where pe.negocio_id = n.id),
      'pedidos_30d', (
        select count(*) from pedidos pe
        where pe.negocio_id = n.id and pe.creado_en >= now() - interval '30 days'
      ),
      'ventas_30d', (
        select coalesce(sum(pe.total), 0) from pedidos pe
        where pe.negocio_id = n.id
          and pe.creado_en >= now() - interval '30 days'
          and pe.estado <> 'rechazado'
      ),
      'ultimo_pedido', (select max(pe.creado_en) from pedidos pe where pe.negocio_id = n.id),
      'ultimo_acceso', (
        select max(u.last_sign_in_at) from auth.users u
        where u.email like '%.' || n.id::text || '@interno.local'
      ),
      'ultimo_pago', (
        select max(pp.fecha_pago) from plataforma_pagos pp where pp.negocio_id = n.id
      )
    ) as fila
    from negocios n
    left join plataforma_suscripciones s on s.negocio_id = n.id
  ) t;

  return v_resultado;
end;
$$;

-- 5b. Detalle completo de un negocio ----------------------------------------
create or replace function public.sa_detalle_negocio(p_negocio_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, auth
as $$
declare
  v_resultado jsonb;
  v_mes_actual timestamp := date_trunc('month', now() at time zone 'America/Bogota');
begin
  if not public.es_superadmin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'negocio', to_jsonb(n),
    'suscripcion', (
      select to_jsonb(s) from plataforma_suscripciones s where s.negocio_id = n.id
    ),
    'config', (
      select jsonb_build_object(
        'descripcion', c.descripcion,
        'direccion', c.direccion,
        'horario', c.horario,
        'redes_sociales', c.redes_sociales,
        'actualizado_en', c.actualizado_en)
      from negocio_config c where c.negocio_id = n.id
      limit 1
    ),
    'usuarios', (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', ua.id,
               'auth_id', u.id,
               'nombre', ua.nombre,
               'numero', ua.numero,
               'rol', ua.rol,
               'activo', ua.activo,
               'creado_en', ua.creado_en,
               'ultimo_acceso', u.last_sign_in_at)
               order by (ua.rol = 'dueño') desc, ua.creado_en), '[]'::jsonb)
      from usuarios_admin ua
      left join auth.users u
        on u.email = ua.numero || '.' || ua.negocio_id::text || '@interno.local'
      where ua.negocio_id = n.id
    ),
    'catalogo', jsonb_build_object(
      'productos', (select count(*) from productos p where p.negocio_id = n.id),
      'productos_disponibles', (
        select count(*) from productos p where p.negocio_id = n.id and p.disponible
      ),
      'categorias', (select count(*) from categorias c where c.negocio_id = n.id),
      'adiciones', (select count(*) from adiciones a where a.negocio_id = n.id),
      'ofertas_activas', (
        select count(*) from ofertas o where o.negocio_id = n.id and o.activa
      )
    ),
    'pedidos', jsonb_build_object(
      'total', (select count(*) from pedidos pe where pe.negocio_id = n.id),
      'ventas_total', (
        select coalesce(sum(pe.total), 0) from pedidos pe
        where pe.negocio_id = n.id and pe.estado <> 'rechazado'
      ),
      'ultimo', (select max(pe.creado_en) from pedidos pe where pe.negocio_id = n.id),
      'por_estado', (
        select coalesce(jsonb_object_agg(x.estado, x.cantidad), '{}'::jsonb)
        from (
          select pe.estado, count(*) as cantidad
          from pedidos pe where pe.negocio_id = n.id
          group by pe.estado
        ) x
      ),
      'por_mes', (
        select jsonb_agg(jsonb_build_object(
                 'mes', to_char(m.mes, 'YYYY-MM'),
                 'pedidos', coalesce(x.cantidad, 0),
                 'ventas', coalesce(x.ventas, 0))
                 order by m.mes)
        from generate_series(v_mes_actual - interval '5 months', v_mes_actual, interval '1 month') as m(mes)
        left join (
          select date_trunc('month', pe.creado_en at time zone 'America/Bogota') as mes,
                 count(*) as cantidad,
                 coalesce(sum(pe.total) filter (where pe.estado <> 'rechazado'), 0) as ventas
          from pedidos pe
          where pe.negocio_id = n.id
            and pe.creado_en >= (v_mes_actual - interval '5 months') at time zone 'America/Bogota'
          group by 1
        ) x on x.mes = m.mes
      )
    ),
    'pagos', (
      select coalesce(jsonb_agg(to_jsonb(pp) order by pp.fecha_pago desc, pp.creado_en desc), '[]'::jsonb)
      from plataforma_pagos pp where pp.negocio_id = n.id
    )
  )
  into v_resultado
  from negocios n
  where n.id = p_negocio_id;

  return v_resultado;
end;
$$;

-- 5c. Registrar un pago y mover la fecha de próximo pago (todo o nada) ------
create or replace function public.sa_registrar_pago(
  p_negocio_id uuid,
  p_monto numeric,
  p_fecha_pago date,
  p_meses int,
  p_metodo text,
  p_nota text,
  p_nueva_fecha date,
  p_activar boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.es_superadmin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  insert into plataforma_pagos (negocio_id, monto, fecha_pago, meses, metodo, nota)
  values (p_negocio_id, p_monto, coalesce(p_fecha_pago, current_date),
          coalesce(p_meses, 1), nullif(trim(p_metodo), ''), nullif(trim(p_nota), ''));

  update negocios
  set fecha_proximo_pago = p_nueva_fecha,
      activo = case when p_activar then true else activo end
  where id = p_negocio_id;

  if not found then
    raise exception 'El negocio no existe';
  end if;
end;
$$;

-- Solo usuarios con sesión pueden llamar las funciones sa_* (y adentro se
-- exige además el rol superadmin). Supabase da EXECUTE a anon por defecto.
revoke all on function public.sa_resumen_negocios() from public, anon;
revoke all on function public.sa_detalle_negocio(uuid) from public, anon;
revoke all on function public.sa_registrar_pago(uuid, numeric, date, int, text, text, date, boolean) from public, anon;
grant execute on function public.sa_resumen_negocios() to authenticated;
grant execute on function public.sa_detalle_negocio(uuid) to authenticated;
grant execute on function public.sa_registrar_pago(uuid, numeric, date, int, text, text, date, boolean) to authenticated;

commit;
