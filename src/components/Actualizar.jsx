import { useEffect, useState } from 'react'
import { usePlataforma } from '../hooks/usePlataforma'
import { IconoActualizar } from './Iconos'

function horaCorta(ms) {
  return new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Bogota' })
}

// Botón de recargar los datos de la plataforma con la hora de la última carga,
// para saber si lo que se ve está al día (sobre todo con la app instalada).
export default function BotonActualizar() {
  const { cargando, actualizado, recargar } = usePlataforma()
  const [girando, setGirando] = useState(false)

  useEffect(() => {
    if (!cargando) setGirando(false)
  }, [cargando])

  return (
    <button
      className="boton boton--chico boton--actualizar"
      onClick={() => { setGirando(true); recargar() }}
      disabled={cargando}
      title="Volver a cargar los datos"
    >
      <IconoActualizar className={girando ? 'girando-icono' : undefined} />
      {actualizado ? horaCorta(actualizado) : 'Actualizar'}
    </button>
  )
}
