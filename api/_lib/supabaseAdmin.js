// Utilidades compartidas por las funciones de /api (Vercel no publica como
// endpoint los archivos dentro de carpetas que empiezan con "_").
//
// Este es el ÚNICO lugar del panel maestro que usa la service_role key. Corre en
// el servidor de Vercel, nunca en el navegador. Toda función que la use debe
// llamar primero a verificarSuperadmin().
import { createClient } from '@supabase/supabase-js'

export const DOMINIO_INTERNO = 'interno.local'

// Debe coincidir exactamente con numeroACorreoInterno de src/lib/phoneAuth.js en
// las apps de los negocios y con la Edge Function crear-usuario-admin: si el
// formato cambia allá, hay que cambiarlo aquí, o los dueños creados desde el
// panel maestro no podrán iniciar sesión.
export function numeroACorreoInterno(numero, negocioId) {
  const numeroLimpio = String(numero).replace(/\D/g, '')
  return `${numeroLimpio}.${negocioId}@${DOMINIO_INTERNO}`
}

export function clienteAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !llave) {
    throw new ErrorHttp(500, 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno de Vercel.')
  }
  return createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } })
}

export class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje)
    this.status = status
  }
}

// Verifica el token de quien llama contra Supabase Auth (no se confía en nada
// del body) y exige rol superadmin en app_metadata.
export async function verificarSuperadmin(req, admin) {
  const encabezado = req.headers.authorization || ''
  const token = encabezado.startsWith('Bearer ') ? encabezado.slice(7) : null
  if (!token) throw new ErrorHttp(401, 'No autenticado.')

  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) throw new ErrorHttp(401, 'Sesión inválida o vencida. Vuelve a iniciar sesión.')
  if (data.user.app_metadata?.rol !== 'superadmin') throw new ErrorHttp(403, 'Esta cuenta no es superadmin.')
  return data.user
}

export function manejador(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: 'Método no permitido.' })
    }
    try {
      const admin = clienteAdmin()
      await verificarSuperadmin(req, admin)
      const resultado = await fn({ body: req.body || {}, admin })
      return res.status(200).json(resultado ?? { ok: true })
    } catch (error) {
      const status = error instanceof ErrorHttp ? error.status : 500
      return res.status(status).json({ error: error.message || 'Error inesperado.' })
    }
  }
}
