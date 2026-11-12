import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { estadoPago } from '../lib/estadoPago'
import { formatoFecha } from '../lib/formato'
import { urlAdmin, urlApp, urlCorta, whatsappEnlaceApp } from '../lib/enlaces'
import { IconoAbrir, IconoAtras, IconoCopiar, IconoWhatsapp } from './Iconos'

// Encabezado de cada pantalla: título, línea secundaria y acciones.
export function Encabezado({ titulo, sub, acciones, volver }) {
  return (
    <>
      {volver && <Link to={volver.a} className="volver"><IconoAtras />{volver.texto}</Link>}
      <div className="encabezado">
        <div className="encabezado__titulos">
          <h1>{titulo}</h1>
          {sub && <div className="encabezado__sub">{sub}</div>}
        </div>
        {acciones && <div className="encabezado__acciones">{acciones}</div>}
      </div>
    </>
  )
}

// Una cifra con su etiqueta. `a` la vuelve enlace (ej. "3 vencidos" → Cobros).
export function Indicador({ etiqueta, valor, nota, tono, a }) {
  const contenido = (
    <>
      <div className="kpi__etiqueta">{etiqueta}</div>
      <div className="kpi__valor">{valor}</div>
      {nota && <div className="kpi__nota">{nota}</div>}
    </>
  )
  const clase = `kpi ${tono ? `kpi--${tono}` : ''}`
  return a ? <Link to={a} className={clase}>{contenido}</Link> : <div className={clase}>{contenido}</div>
}

// Botón de copiar con confirmación breve.
export function BotonCopiar({ texto, etiqueta = 'Copiar', className = 'boton boton--chico' }) {
  const [copiado, setCopiado] = useState(false)
  useEffect(() => {
    if (!copiado) return
    const t = setTimeout(() => setCopiado(false), 1500)
    return () => clearTimeout(t)
  }, [copiado])
  return (
    <button type="button" className={className} onClick={() => navigator.clipboard?.writeText(texto).then(() => setCopiado(true))}>
      <IconoCopiar />{copiado ? 'Copiado' : etiqueta}
    </button>
  )
}

// Enlace de la app de domicilios del negocio con sus acciones: abrir, copiar,
// enviárselo al dueño por WhatsApp y entrar a su panel /admin.
export function EnlaceApp({ negocio, duenos, onAgregar }) {
  const app = urlApp(negocio)
  if (!app) {
    return (
      <div className="enlace-app__falta">
        <span>Este negocio no tiene el enlace de su app.</span>
        {onAgregar && <button className="boton boton--chico" onClick={onAgregar}>Agregar enlace</button>}
      </div>
    )
  }
  const whatsapp = whatsappEnlaceApp(negocio, duenos)
  return (
    <div className="enlace-app">
      <a className="enlace-app__url" href={app} target="_blank" rel="noreferrer">
        <span>{urlCorta(app)}</span><IconoAbrir />
      </a>
      <div className="enlace-app__acciones">
        <a className="boton boton--chico boton--primario" href={app} target="_blank" rel="noreferrer"><IconoAbrir />Abrir app</a>
        <BotonCopiar texto={app} />
        {whatsapp && <a className="boton boton--chico boton--whatsapp" href={whatsapp} target="_blank" rel="noreferrer"><IconoWhatsapp />Enviar</a>}
        <a className="boton boton--chico boton--fantasma" href={urlAdmin(negocio)} target="_blank" rel="noreferrer">Panel del dueño</a>
      </div>
    </div>
  )
}

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
    <span className="apilado">
      <span className={`insignia insignia--${TIPO_PAGO[estado.clave]}`}>{estado.texto}</span>
      {conFecha && fecha && <span className="apilado__sub">{formatoFecha(fecha)}</span>}
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
