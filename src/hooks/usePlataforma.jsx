import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { rpc, traducirError } from '../lib/api'
import { supabase } from '../lib/supabase'
import { hoyISO } from '../lib/formato'

// Datos de toda la plataforma que comparten Inicio, Negocios y Cobros: se cargan
// una vez y se reutilizan al cambiar de pestaña, en vez de pedirlos en cada una.
// Se refrescan solos al volver a la app (útil cuando está instalada en el
// celular y queda abierta en segundo plano).
const Contexto = createContext(null)
const REFRESCO_MINIMO_MS = 60_000

function inicioMes(mesesAtras = 0) {
  const [a, m] = hoyISO().split('-').map(Number)
  const fecha = new Date(a, m - 1 - mesesAtras, 1, 12)
  return fecha.toLocaleDateString('en-CA')
}

async function cargarTodo() {
  const [negocios, pagos] = await Promise.all([
    rpc('sa_resumen_negocios'),
    supabase
      .from('plataforma_pagos')
      .select('id, negocio_id, monto, fecha_pago, meses, metodo')
      .gte('fecha_pago', inicioMes(5))
      .order('fecha_pago', { ascending: false })
      .then(({ data, error }) => {
        if (error) throw new Error(traducirError(error))
        return data
      }),
  ])
  return { negocios: negocios || [], pagos: pagos || [] }
}

export function PlataformaProvider({ children }) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null, actualizado: null })
  const enCurso = useRef(null)

  const recargar = useCallback(({ silencioso = false } = {}) => {
    if (enCurso.current) return enCurso.current
    if (!silencioso) setEstado((e) => ({ ...e, cargando: true, error: null }))
    enCurso.current = cargarTodo()
      .then((datos) => setEstado({ datos, cargando: false, error: null, actualizado: Date.now() }))
      .catch((error) => setEstado((e) => ({ ...e, cargando: false, error: error.message })))
      .finally(() => { enCurso.current = null })
    return enCurso.current
  }, [])

  useEffect(() => { recargar() }, [recargar])

  const actualizado = estado.actualizado
  useEffect(() => {
    const alVolver = () => {
      if (document.visibilityState === 'visible' && (!actualizado || Date.now() - actualizado > REFRESCO_MINIMO_MS)) {
        recargar({ silencioso: true })
      }
    }
    document.addEventListener('visibilitychange', alVolver)
    return () => document.removeEventListener('visibilitychange', alVolver)
  }, [recargar, actualizado])

  const valor = useMemo(() => ({ ...estado, recargar }), [estado, recargar])
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function usePlataforma() {
  const valor = useContext(Contexto)
  if (!valor) throw new Error('usePlataforma debe usarse dentro de <PlataformaProvider>')
  return valor
}

export { inicioMes }
