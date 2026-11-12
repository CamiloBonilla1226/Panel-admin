import { useState } from 'react'
import { useInstalar } from '../hooks/useInstalar'
import { IconoCompartir, IconoInstalar } from './Iconos'

// Botón "Instalar app". No se muestra si el navegador no lo permite o si el
// panel ya está instalado. En iPhone abre los pasos para agregarlo al inicio.
export default function BotonInstalar({ className = 'boton boton--chico', texto = 'Instalar app' }) {
  const { disponible, ios, instalar } = useInstalar()
  const [pasosIOS, setPasosIOS] = useState(false)

  if (!disponible) return null

  return (
    <>
      <button type="button" className={className} onClick={() => (ios ? setPasosIOS(true) : instalar())}>
        <IconoInstalar />{texto}
      </button>

      {pasosIOS && (
        <div className="capa" onClick={() => setPasosIOS(false)}>
          <div className="dialogo" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar al inicio del iPhone</h3>
            <ol className="pasos">
              <li>Abre este panel en <strong>Safari</strong>.</li>
              <li>Toca <strong>Compartir</strong> <IconoCompartir className="pasos__icono" /> en la barra de abajo.</li>
              <li>Elige <strong>Agregar a inicio</strong> y toca <strong>Agregar</strong>.</li>
            </ol>
            <div className="acciones-form">
              <button className="boton boton--primario" onClick={() => setPasosIOS(false)} autoFocus>Entendido</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
