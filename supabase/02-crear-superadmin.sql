-- =====================================================================
-- PANEL MAESTRO — DARTE EL ROL SUPERADMIN (correr después de 01)
-- =====================================================================
-- PASO 1 (en el dashboard, no aquí):
--   Authentication → Users → Add user → Create new user
--   - Email: tu correo REAL (ej. acbonilla1226@gmail.com). Es con el que vas
--     a entrar al panel maestro. No uses el formato numero.negocio@interno.local.
--   - Password: una contraseña larga y única (esta cuenta ve TODOS los negocios).
--   - Marca "Auto Confirm User".
--
-- PASO 2: reemplaza TU_CORREO y corre esto.
--   Va en raw_app_meta_data (app_metadata), NUNCA en user_metadata: ese lo
--   puede reescribir el propio usuario desde el navegador y cualquiera se
--   podría auto-asignar superadmin. Se quita negocio_id por si la cuenta lo
--   tuviera, para que no sea a la vez dueño de un negocio.
-- =====================================================================

update auth.users
set raw_app_meta_data = (raw_app_meta_data - 'negocio_id') || '{"rol": "superadmin"}'::jsonb
where email = 'TU_CORREO';

-- Verificación: debe mostrar "rol": "superadmin" y ningún negocio_id.
select email, raw_app_meta_data
from auth.users
where email = 'TU_CORREO';

-- Si ya tenías una sesión abierta en el panel maestro, cierra sesión y vuelve
-- a entrar: el rol viaja dentro del token y solo se actualiza al iniciar sesión.
