# Panel maestro

Panel privado del dueño de la plataforma para ver y controlar **todos los negocios** que usan el servicio (ZÉRO, PAR CHAOS, etc.). Es un proyecto independiente de los negocios, pero se conecta a la **misma base de datos de Supabase**.

## Qué hace

- **Lista de negocios** con indicadores: cuántos hay, cuántos activos, ingreso mensual esperado, vencidos, por vencer, pedidos y ventas de los últimos 30 días.
- Búsqueda por negocio, dueño o número; filtros (activos, inactivos, vencidos, por vencer, sin fecha); orden; **exportar a CSV**.
- **Ficha de cada negocio**:
  - Datos editables: nombre, slug, WhatsApp, dominio, fecha de próximo pago, plan, valor mensual, URL y notas privadas.
  - **Activar / desactivar** el negocio (su sitio muestra el aviso de inactivo; no se borra nada).
  - **Dueños y empleados** con su número, estado y último acceso al panel. **Crear dueños** y **restablecer contraseñas** sin entrar a Supabase.
  - **Pagos**: registrar mensualidades (mueve la fecha de próximo pago y reactiva el negocio), historial y total pagado.
  - **Actividad**: productos, categorías, adiciones, ofertas, pedidos por mes y por estado.
  - **Identificación**: el ID del negocio para copiarlo al proyecto clonado, e información pública (horario, dirección, redes).
- **Nuevo negocio**: registra el negocio, su suscripción y su primer dueño en un solo paso, y te da el bloque para pegar en `src/config/negocio.config.js` del proyecto clonado.

## Cómo funciona la seguridad

- Entras con **tu correo y contraseña** (cuenta normal de Supabase Auth) que tiene `rol: "superadmin"` en **`app_metadata`**. Nunca en `user_metadata`: ese lo puede cambiar el propio usuario desde el navegador.
- Este proyecto usa la **anon key** pública, igual que los negocios. Lo que puede ver lo decide Supabase:
  - Las funciones `sa_resumen_negocios`, `sa_detalle_negocio` y `sa_registrar_pago` revisan el rol superadmin antes de devolver nada.
  - Las políticas `Superadmin ...` en `negocios`, `plataforma_suscripciones` y `plataforma_pagos` exigen el mismo rol.
  - Las políticas de las apps de los negocios **no cambian**.
- Crear dueños y cambiar contraseñas requiere la **service_role key**, que solo vive en las funciones de `/api` (servidor de Vercel), nunca en el navegador. Cada llamada verifica tu sesión y tu rol antes de usarla.
- El sitio tiene `noindex` y `robots.txt` para que no aparezca en Google.

## Instalación (una sola vez)

### 1. Base de datos

En Supabase → **SQL Editor**:

1. Corre [`supabase/01-migracion-panel-maestro.sql`](supabase/01-migracion-panel-maestro.sql).
2. Crea tu cuenta en **Authentication → Users → Add user** (tu correo real, una contraseña fuerte, "Auto Confirm User").
3. Corre [`supabase/02-crear-superadmin.sql`](supabase/02-crear-superadmin.sql) cambiando `TU_CORREO`.

### 2. Probar en tu computador

```bash
npm install
npm run dev            # solo la interfaz (crear dueños y cambiar contraseñas no funcionan)
npm run dev:completo   # interfaz + /api (requiere: npm i -g vercel, y la service_role en .env.local)
```

Variables en `.env.local` (ver `.env.example`):

| Variable | Dónde se usa | De dónde sale |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | navegador y /api | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | navegador | igual |
| `SUPABASE_SERVICE_ROLE_KEY` | **solo** /api | igual (la "service_role", secreta) |

### 3. GitHub

```bash
git remote add origin https://github.com/TU_USUARIO/panel-maestro.git
git push -u origin main
```

Hazlo **privado**. `.env.local` está en `.gitignore`, así que las llaves no se suben.

### 4. Vercel

1. **Add New → Project** e importa el repo. Vercel detecta Vite solo.
2. En **Environment Variables** agrega las tres variables de la tabla.
3. Deploy. Las funciones de `/api` se publican automáticamente.

## Estructura

```
api/                      Funciones serverless de Vercel (usan la service_role)
  _lib/supabaseAdmin.js   Cliente admin + verificación de superadmin
  crear-dueno.js          Crea la cuenta de un dueño (Auth + usuarios_admin)
  restablecer-contrasena.js
supabase/                 Scripts SQL para correr en Supabase
src/
  pages/                  Login, Negocios (lista), Negocio (ficha), NuevoNegocio
  components/             Layout y piezas de interfaz
  lib/                    Cliente Supabase, llamadas, formatos, estado de pago
```

## Notas

- El correo interno de los dueños (`numero.negocioId@interno.local`) debe coincidir con `src/lib/phoneAuth.js` de los negocios. Si ese formato cambia allá, hay que cambiarlo en `api/_lib/supabaseAdmin.js` y en las funciones SQL.
- No hay botón para **borrar** negocios a propósito: borrar un negocio elimina en cascada su catálogo, usuarios y pedidos. Para dar de baja a un cliente, desactívalo.
- Eliminar un pago no devuelve la fecha de próximo pago: corrígela a mano en "Datos del negocio".
