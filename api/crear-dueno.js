// POST /api/crear-dueno  { negocioId, numero, nombre, contrasena }
//
// Crea el dueño de un negocio de punta a punta (lo que antes se hacía a mano con
// como-crear-usuario-admin-manual.txt): cuenta en Supabase Auth con el correo
// interno, app_metadata { negocio_id, rol: 'dueño' } y su fila en usuarios_admin
// con el MISMO id de Auth (igual que la Edge Function crear-usuario-admin, para
// que eliminar-usuario-admin pueda encontrarla). Si algo falla, se revierte.
import { ErrorHttp, manejador, numeroACorreoInterno } from './_lib/supabaseAdmin.js'

export default manejador(async ({ body, admin }) => {
  const negocioId = String(body.negocioId || '').trim()
  const numero = String(body.numero || '').replace(/\D/g, '')
  const nombre = String(body.nombre || '').trim()
  const contrasena = String(body.contrasena || '')

  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) throw new ErrorHttp(400, 'Negocio inválido.')
  if (numero.length < 7 || numero.length > 15) throw new ErrorHttp(400, 'El número debe tener entre 7 y 15 dígitos.')
  if (!nombre) throw new ErrorHttp(400, 'Falta el nombre del dueño.')
  if (contrasena.length < 6) throw new ErrorHttp(400, 'La contraseña debe tener al menos 6 caracteres.')

  const { data: negocio, error: errorNegocio } = await admin
    .from('negocios').select('id').eq('id', negocioId).maybeSingle()
  if (errorNegocio) throw new ErrorHttp(500, errorNegocio.message)
  if (!negocio) throw new ErrorHttp(404, 'El negocio no existe.')

  const { data: creado, error: errorCrear } = await admin.auth.admin.createUser({
    email: numeroACorreoInterno(numero, negocioId),
    password: contrasena,
    email_confirm: true,
    app_metadata: { negocio_id: negocioId, rol: 'dueño' },
  })
  if (errorCrear) {
    const yaExiste = /already (been )?registered|already exists/i.test(errorCrear.message)
    throw new ErrorHttp(400, yaExiste ? 'Ya existe un usuario con ese número en este negocio.' : errorCrear.message)
  }

  const { error: errorInsertar } = await admin.from('usuarios_admin').insert({
    id: creado.user.id,
    negocio_id: negocioId,
    numero,
    nombre,
    rol: 'dueño',
  })
  if (errorInsertar) {
    await admin.auth.admin.deleteUser(creado.user.id)
    throw new ErrorHttp(500, `No se pudo registrar en usuarios_admin: ${errorInsertar.message}`)
  }

  return { ok: true, id: creado.user.id }
})
