// POST /api/restablecer-contrasena  { authId, contrasena }
//
// Cambia la contraseña de un dueño o empleado de cualquier negocio (para cuando
// la olvidan). Solo cuentas de negocios: no permite tocar otra cuenta superadmin.
import { DOMINIO_INTERNO, ErrorHttp, manejador } from './_lib/supabaseAdmin.js'

export default manejador(async ({ body, admin }) => {
  const authId = String(body.authId || '').trim()
  const contrasena = String(body.contrasena || '')

  if (!/^[0-9a-f-]{36}$/i.test(authId)) throw new ErrorHttp(400, 'Usuario inválido.')
  if (contrasena.length < 6) throw new ErrorHttp(400, 'La contraseña debe tener al menos 6 caracteres.')

  const { data, error } = await admin.auth.admin.getUserById(authId)
  if (error || !data?.user) throw new ErrorHttp(404, 'No se encontró la cuenta.')

  const usuario = data.user
  const esDeNegocio = usuario.email?.endsWith(`@${DOMINIO_INTERNO}`) && usuario.app_metadata?.negocio_id
  if (!esDeNegocio || usuario.app_metadata?.rol === 'superadmin') {
    throw new ErrorHttp(403, 'Solo se pueden restablecer cuentas de dueños o empleados.')
  }

  const { error: errorActualizar } = await admin.auth.admin.updateUserById(authId, { password: contrasena })
  if (errorActualizar) throw new ErrorHttp(500, errorActualizar.message)

  return { ok: true }
})
