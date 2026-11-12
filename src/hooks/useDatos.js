import { useCallback, useEffect, useRef, useState } from 'react'

// Carga asíncrona con estado de carga/error y recarga manual. `clave` cambia
// cuando hay que volver a cargar (ej. el id del negocio).
export function useDatos(cargar, clave) {
  const [estado, setEstado] = useState({ datos: null, cargando: true, error: null })
  const cargarRef = useRef(cargar)
  cargarRef.current = cargar

  const recargar = useCallback(async ({ silencioso = false } = {}) => {
    if (!silencioso) setEstado((e) => ({ ...e, cargando: true, error: null }))
    try {
      const datos = await cargarRef.current()
      setEstado({ datos, cargando: false, error: null })
    } catch (error) {
      setEstado((e) => ({ ...e, cargando: false, error: error.message }))
    }
  }, [])

  useEffect(() => { recargar() }, [recargar, clave])

  return { ...estado, recargar }
}
