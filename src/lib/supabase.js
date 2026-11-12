import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa .env.local (o las variables de entorno en Vercel).')
}

// Misma base de datos que las apps de los negocios, con la anon key pública. Lo que
// este panel puede ver no lo decide este código sino Supabase: las funciones sa_* y
// las políticas "Superadmin ..." exigen rol superadmin en app_metadata.
export const supabase = createClient(url, anonKey, {
  auth: { storageKey: 'panel-maestro-sesion' },
})
