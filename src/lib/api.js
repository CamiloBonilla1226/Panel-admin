import { supabase } from './supabase'

// Llama una función de /api (Vercel) con el token de la sesión actual. El servidor
// verifica el token y el rol superadmin antes de usar la service_role key.
export async function llamarApi(ruta, cuerpo) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Tu sesión venció. Vuelve a iniciar sesión.')

  let respuesta
  try {
    respuesta = await fetch(`/api/${ruta}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(cuerpo),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor.')
  }

  const json = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    if (!json) {
      throw new Error('Las funciones /api no respondieron. En local usa "npm run dev:completo" (vercel dev); en Vercel revisa el despliegue.')
    }
    throw new Error(json.error || `Error ${respuesta.status}`)
  }
  return json
}

export async function rpc(nombre, parametros) {
  const { data, error } = await supabase.rpc(nombre, parametros)
  if (error) throw new Error(traducirError(error))
  return data
}

export function traducirError(error) {
  const mensaje = error?.message || String(error)
  if (error?.code === '42501' || /No autorizado|permission denied/i.test(mensaje)) {
    return 'Esta cuenta no tiene permiso de superadmin, o la migración no se ha corrido.'
  }
  if (/Could not find the function|function .* does not exist|schema cache/i.test(mensaje)) {
    return 'Falta correr supabase/01-migracion-panel-maestro.sql en Supabase.'
  }
  if (/duplicate key.*slug/i.test(mensaje)) return 'Ya existe otro negocio con ese slug.'
  return mensaje
}
