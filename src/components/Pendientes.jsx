import { useState } from 'react'
import { Link } from 'react-router-dom'
import { pendientes } from '../lib/alertas'
import { whatsappCobro } from '../lib/enlaces'
import { IconoFlecha, IconoWhatsapp } from './Iconos'

const VISIBLES = 6

// Lista de "qué hacer hoy": un negocio por fila con su asunto más urgente. Los
// cobros traen el botón de WhatsApp con el recordatorio ya escrito.
export default function Pendientes({ negocios }) {
  const [verTodos, setVerTodos] = useState(false)
  const lista = pendientes(negocios)
  const mostrados = verTodos ? lista : lista.slice(0, VISIBLES)

  return (
    <section className="seccion">
      <div className="seccion__cabeza">
        <h2>Pendientes</h2>
        <span className="suave">{lista.length ? `${lista.length} negocio${lista.length === 1 ? '' : 's'}` : ''}</span>
      </div>

      {lista.length === 0 ? (
        <div className="vacio">
          <strong>Todo en orden</strong>
          Ningún cobro vencido ni negocio por revisar.
        </div>
      ) : (
        mostrados.map(({ negocio: n, principal, extra }) => {
          const whatsapp = principal.tipo === 'cobro' ? whatsappCobro(n) : null
          return (
            <div key={n.id} className="fila pendiente">
              <Link to={`/negocios/${n.id}`} className="pendiente__info">
                <span className="fila__titulo">{n.nombre}</span>
                <span className="pendiente__motivo">
                  <span className={`insignia insignia--${principal.tono}`}>{principal.texto}</span>
                  {extra.length > 0 && <span className="tenue chico">+{extra.length} más</span>}
                </span>
              </Link>
              <div className="fila__acciones">
                {whatsapp && (
                  <a className="boton boton--chico boton--whatsapp" href={whatsapp} target="_blank" rel="noreferrer" title="Enviar recordatorio de pago">
                    <IconoWhatsapp /><span className="oculto-movil">Cobrar</span>
                  </a>
                )}
                <Link to={`/negocios/${n.id}`} className="boton boton--fantasma boton--chico boton--icono" aria-label={`Ver ${n.nombre}`}>
                  <IconoFlecha />
                </Link>
              </div>
            </div>
          )
        })
      )}

      {lista.length > VISIBLES && (
        <div className="seccion__pie">
          <button className="boton boton--fantasma boton--chico" onClick={() => setVerTodos((v) => !v)}>
            {verTodos ? 'Ver menos' : `Ver los ${lista.length}`}
          </button>
        </div>
      )}
    </section>
  )
}
