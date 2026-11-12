import { useEffect } from 'react'

// Título de la pestaña del navegador / del selector de apps del celular, para
// distinguir en qué pantalla quedó abierto el panel.
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · Panel maestro` : 'Panel maestro'
  }, [titulo])
}
