import { useEffect, useState } from 'react'
import { estadoPago } from '../lib/estadoPago'
import { formatoFecha } from '../lib/formato'

export function Campo({ etiqueta, ayuda, children }) {
  return (
    <label className="campo">
      <span className="campo__etiqueta">{etiqueta}</span>
      {children}
      {ayuda && <span className="campo__ayuda">{ayuda}</span>}
    </label>
  )
}

export function Seccion({ titulo, extra, children, sinRelleno = false }) {
  return (
    <section className="seccion">
      <div className="seccion__cabeza">
        <h2>{titulo}</h2>
        {extra}
      </div>
      {sinRelleno ? children : <div className="seccion__cuerpo">{children}</div>}
    </section>
  )
}

export function Aviso({ tipo = 'info', children }) {
  if (!children) return null
  return <div className={`aviso aviso--${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function InsigniaActivo({ activo }) {
  return activo
    ? <span className="insignia insignia--ok">Activo</span>
    : <span className="insignia insignia--neutra">Inactivo</span>
}

const TIPO_PAGO = { vencido: 'error', por_vencer: 'aviso', al_dia: 'ok', sin_fecha: 'neutra' }

export function InsigniaPago({ fecha, conFecha = false }) {
  const estado = estadoPago(fecha)
  return (
    <span className="tabla__apilado">
      <span className={`insignia insignia--${TIPO_PAGO[estado.clave]}`}>{estado.texto}</span>
      {conFecha && fecha && <span className="tabla__sub">{formatoFecha(fecha)}</span>}
    </span>
  )
}

export function Copiable({ texto }) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 1500)
    return () => clearTimeout(t)
  }, [copiado])

  return (
    <div className="copiable">
      <code>{texto}</code>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(texto).then(() => setCopiado(true))}
      >
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}

// Confirmación propia (en vez de window.confirm) para que funcione igual en el
// celular y se vea como el resto del panel.
export function Confirmar({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', peligro = false, onConfirmar, onCancelar }) {
  useEffect(() => {
    if (!abierto) return
    const alTeclear = (e) => { if (e.key === 'Escape') onCancelar() }
    window.addEventListener('keydown', alTeclear)
    return () => window.removeEventListener('keydown', alTeclear)
  }, [abierto, onCancelar])

  if (!abierto) return null
  return (
    <div className="capa" onClick={onCancelar}>
      <div className="dialogo" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{titulo}</h3>
        <p>{mensaje}</p>
        <div className="acciones-form">
          <button className="boton" onClick={onCancelar}>Cancelar</button>
          <button className={`boton ${peligro ? 'boton--peligro' : 'boton--primario'}`} onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
