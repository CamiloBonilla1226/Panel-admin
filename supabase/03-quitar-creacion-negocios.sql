-- =====================================================================
-- PANEL MAESTRO — 03: el superadmin ya no crea negocios
-- (correr UNA vez en Supabase → SQL Editor, después del 01)
-- =====================================================================
-- Qué hace:
--   Borra la política "Superadmin crea negocios" (insert en negocios) que
--   creó el script 01. El panel maestro dejó de tener la pantalla "Nuevo
--   negocio": los negocios se registran junto con su propio proyecto. Sin
--   esta política, aunque alguien llame la API con la sesión del
--   superadmin, la base rechaza el insert.
--
-- Lo que NO cambia:
--   - "Superadmin lee todos los negocios" y "Superadmin edita negocios"
--     siguen igual (ver, activar/desactivar, editar datos y pagos).
--   - Las políticas de los negocios no se tocan.
--
-- Es idempotente: se puede correr varias veces.
-- =====================================================================

begin;

drop policy if exists "Superadmin crea negocios" on public.negocios;

commit;
