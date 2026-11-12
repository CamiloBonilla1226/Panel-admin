# Instrucciones para Claude en este proyecto

Panel maestro (superadmin) de la plataforma multi-negocio. Comparte la base de Supabase con los proyectos de cada negocio (ej. `Desktop/acbonilla/Zero`), cuyo `explicacion-script-bd.txt` es la fuente de verdad del esquema.

## Flujo por cambio
1. Entrada en [`CHANGELOG.md`](./CHANGELOG.md) (fecha + qué + por qué).
2. Commit descriptivo (qué y por qué) por cambio.
3. Todo cambio de esquema va en un script nuevo numerado en `supabase/` y se documenta también en `explicacion-script-bd.txt` del proyecto base, porque la base es la misma.

## Convenciones
- El rol superadmin se lee SIEMPRE de `app_metadata` (nunca `user_metadata`), en SQL (`es_superadmin()`) y en `/api`.
- Toda tabla nueva con RLS crea sus políticas en el mismo script.
- Funciones `sa_*`: `security definer`, `set search_path`, revisan `es_superadmin()` al empezar y se les quita `EXECUTE` a `anon`.
- La service_role key solo se usa en `api/` (servidor). Nunca con prefijo `VITE_`.
- El correo interno de los usuarios de negocios es `numero.negocioId@interno.local` (igual que `src/lib/phoneAuth.js` de los negocios).
- Sin bordes redondeados. Mobile-first.
