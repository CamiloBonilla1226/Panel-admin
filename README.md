# Panel maestro

Panel privado del dueño de la plataforma para ver y controlar **todos los negocios** que usan el servicio (ZÉRO, PAR CHAOS, etc.). Es un proyecto independiente de los negocios, pero se conecta a la **misma base de datos de Supabase**. Se puede **instalar en el inicio del celular** como una app.

## Qué hace

- **Inicio**: cobrado este mes frente al ingreso esperado, lo que falta por cobrar, negocios activos, pedidos de 30 días, gráfico de lo cobrado por mes y la lista de **pendientes** (cobros vencidos o por vencer con recordatorio por WhatsApp ya escrito, negocios sin enlace de la app, sin dueño, sin pedidos recientes o cuyo dueño no entra al panel).
- **Negocios**: cada negocio con su **enlace de la app de domicilios**, dueño, estado de pago, mensualidad y pedidos. Búsqueda por negocio, dueño o número; filtros (activos, vencidos, por vencer, sin enlace, inactivos, todos); orden; **exportar a CSV**.
- **Cobros**: vencidos y lo que vence en los próximos 30 días, con botón de recordatorio por WhatsApp y de registrar el pago; negocios sin fecha de pago; historial de pagos recibidos.
- **Ficha de cada negocio**:
  - **App de domicilios**: abrir, copiar, enviar el enlace al dueño por WhatsApp y entrar a su panel `/admin`.
  - **Activar / desactivar** el negocio (su app muestra el aviso de inactivo; no se borra nada) y WhatsApp directo al dueño.
  - **Resumen**: pedidos y ventas del mes y totales, pedidos por mes y por estado, catálogo, ID del negocio para copiarlo al proyecto clonado e información pública (horario, dirección, redes).
  - **Pagos**: registrar mensualidades (mueve la fecha de próximo pago y reactiva el negocio), historial, total pagado y recordatorio de cobro.
  - **Usuarios**: dueños y empleados con su número, estado y último acceso al panel. **Crear dueños** y **restablecer contraseñas** sin entrar a Supabase.
  - **Datos**: enlace de la app y dominio propio, plan, valor mensual, próximo pago, notas privadas, nombre, slug y WhatsApp.

Los negocios **no se crean desde aquí**: nacen con su propio proyecto (clon del proyecto base). El script `03` quita también el permiso en la base.

## Instalar en el celular

- **Android (Chrome)**: abre el panel y toca **Instalar** arriba a la derecha (o menú ⋮ → *Instalar app*).
- **iPhone (Safari)**: toca **Instalar** y sigue los pasos: *Compartir* → *Agregar a inicio*.
- **PC (Chrome/Edge)**: botón **Instalar app** en la barra lateral.

Queda con su ícono y a pantalla completa. Al volver a abrirla recarga los datos sola si pasó más de un minuto; el botón con la hora en cada pantalla recarga a mano.

## Cómo funciona la seguridad

- Entras con **tu correo y contraseña** (cuenta normal de Supabase Auth) que tiene `rol: "superadmin"` en **`app_metadata`**. Nunca en `user_metadata`: ese lo puede cambiar el propio usuario desde el navegador.
- Este proyecto usa la **anon key** pública, igual que los negocios. Lo que puede ver lo decide Supabase:
  - Las funciones `sa_resumen_negocios`, `sa_detalle_negocio` y `sa_registrar_pago` revisan el rol superadmin antes de devolver nada.
  - Las políticas `Superadmin ...` en `negocios`, `plataforma_suscripciones` y `plataforma_pagos` exigen el mismo rol.
  - Las políticas de las apps de los negocios **no cambian**.
- Crear dueños y cambiar contraseñas requiere la **service_role key**, que solo vive en las funciones de `/api` (servidor de Vercel), nunca en el navegador. Cada llamada verifica tu sesión y tu rol antes de usarla.
- El service worker nunca guarda respuestas de Supabase ni de `/api`: los datos siempre son en vivo.
- El sitio tiene `noindex` y `robots.txt` para que no aparezca en Google.

## Instalación (una sola vez)

### 1. Base de datos

En Supabase → **SQL Editor**:

1. Corre [`supabase/01-migracion-panel-maestro.sql`](supabase/01-migracion-panel-maestro.sql).
2. Crea tu cuenta en **Authentication → Users → Add user** (tu correo real, una contraseña fuerte, "Auto Confirm User").
3. Corre [`supabase/02-crear-superadmin.sql`](supabase/02-crear-superadmin.sql) cambiando `TU_CORREO`.
4. Corre [`supabase/03-quitar-creacion-negocios.sql`](supabase/03-quitar-creacion-negocios.sql).

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

Repo **privado**. `.env.local` está en `.gitignore`, así que las llaves no se suben.

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
public/                   manifest, service worker (sw.js) e íconos de la app
supabase/                 Scripts SQL para correr en Supabase
src/
  pages/                  Login, Inicio, Negocios (lista), Negocio (ficha), Cobros
  components/             Layout, íconos, pendientes, instalar y piezas de interfaz
  hooks/                  Sesión, datos compartidos de la plataforma, instalar app
  lib/                    Cliente Supabase, llamadas, formatos, estado de pago,
                          enlaces de la app y mensajes de WhatsApp, alertas
  styles/                 base, estructura, componentes y páginas
```

## Notas

- El enlace de la app de domicilios es el **dominio propio** si el negocio tiene uno; si no, el link de Vercel (`url_sitio`). Se decide en `src/lib/enlaces.js`.
- El correo interno de los dueños (`numero.negocioId@interno.local`) debe coincidir con `src/lib/phoneAuth.js` de los negocios. Si ese formato cambia allá, hay que cambiarlo en `api/_lib/supabaseAdmin.js` y en las funciones SQL.
- No hay botón para **borrar** negocios a propósito: borrar un negocio elimina en cascada su catálogo, usuarios y pedidos. Para dar de baja a un cliente, desactívalo.
- Eliminar un pago no devuelve la fecha de próximo pago: corrígela a mano en la pestaña **Datos**.
