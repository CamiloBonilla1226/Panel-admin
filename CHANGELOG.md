# Changelog

Decisiones técnicas y funcionalidades del panel maestro, en orden cronológico.

## 2026-11-11
- **Proyecto creado**: panel privado del dueño de la plataforma para ver y controlar todos los negocios que comparten la base de Supabase. Proyecto aparte (repo y deploy propios) para que ningún negocio cargue código del superadmin.
- **Acceso por rol `superadmin` en `app_metadata`**, no en `user_metadata` (el usuario puede reescribir user_metadata desde el navegador; error ya documentado dos veces en el proyecto base). Login con correo real + contraseña, no con el número de teléfono de los negocios.
- **Lecturas globales por funciones `security definer` (`sa_resumen_negocios`, `sa_detalle_negocio`)** en vez de agregar una política de superadmin a cada tabla (`productos`, `pedidos`, `usuarios_admin`, etc.): así no se toca el RLS que protege a los negocios, la lectura de `auth.users` (último acceso) queda dentro de la base y los conteos se calculan en una sola consulta en vez de bajar todos los pedidos al navegador. Cada función revisa `es_superadmin()` al empezar; se les quitó `EXECUTE` a `anon`.
- **Tablas propias `plataforma_suscripciones` y `plataforma_pagos`** (plan, valor mensual, notas, historial de pagos) en vez de columnas nuevas en `negocios`: `negocios` tiene lectura pública, y el valor que cobras o tus notas no deben verse desde la carta de un negocio. RLS con políticas creadas en el mismo script.
- **`sa_registrar_pago`** inserta el pago y mueve `negocios.fecha_proximo_pago` en una sola transacción, para que no quede un pago sin fecha actualizada ni al revés. La nueva fecha la propone el panel (próximo pago pendiente + meses pagados, o desde el día del pago si llevaba más de un mes vencido) y se puede editar.
- **Crear dueños y restablecer contraseñas con funciones serverless de Vercel (`/api`)** en vez de una Edge Function de Supabase: se despliegan solas con el repo, sin CLI de Supabase. Son el único lugar con la service_role key (variable sin prefijo `VITE_`, así Vite nunca la incluye en el navegador). Verifican el token con `auth.getUser` y exigen superadmin. `crear-dueno` replica `crear-usuario-admin` del proyecto base (mismo correo interno, mismo id en Auth y en `usuarios_admin`, revierte la cuenta si falla el insert) y pone el `app_metadata` en el mismo `createUser`.
- **Sin opción de borrar negocios**: el borrado es en cascada (catálogo, usuarios, pedidos). Para dar de baja se desactiva.
- Interfaz: mobile-first (tabla que se vuelve tarjetas en el celular, navegación inferior), esquinas rectas en todo, tema oscuro, `noindex`.

### Rediseño del panel (v2)
- **Ya no se crean negocios desde el panel maestro**: se quitó la pantalla "Nuevo negocio", su ruta y sus botones. Los negocios nacen con su propio proyecto (clon del base) y el panel solo los administra; así se evita registrar por error un negocio sin proyecto detrás.
