import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Sesión de Supabase Auth. El rol sale de app_metadata (lo firma el servidor; el
// usuario no lo puede cambiar). Esta revisión es solo para la interfaz: la barrera
// real son las funciones y políticas de Supabase.
export function useSesion() {
  const [sesion, setSesion] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSesion(data.session ?? null))
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva ?? null))
    return () => data.subscription.unsubscribe()
  }, [])

  return {
    cargando: sesion === undefined,
    usuario: sesion?.user ?? null,
    esSuperadmin: sesion?.user?.app_metadata?.rol === 'superadmin',
  }
}
