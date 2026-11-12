import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlataforma } from '../hooks/usePlataforma'
import { useTitulo } from '../hooks/useTitulo'
import { estadoPago } from '../lib/estadoPago'
import { whatsappCobro } from '../lib/enlaces'
import { formatoFecha, formatoPesos } from '../lib/formato'
import { Aviso, Encabezado, Indicador } from '../components/ui'
import { IconoWhatsapp } from '../components/Iconos'
import Cargando from '../components/Cargando'
import { calcularResumen } from './Inicio'

const HORIZONTE_DIAS = 30
const PAGOS_VISIBLES = 12

// Todo lo de plata en una pantalla: qué se debe, qué viene en los próximos
// 30 días y qué se ha cobrado. Registrar el pago se hace en la ficha del
// negocio (pestaña Pagos), que ya calcula la nueva fecha.
export default function Cobros() {
  useTitulo('Cobros')
  const { datos, cargando, error } = usePlataforma()
  const negocios = useMemo(() => datos?.negocios || [], [datos])
  const pagos = useMemo(() => datos?.pagos || [], [datos])
  const r = useMemo(() => calcularResumen(negocios, pagos), [negocios, pagos])
  const [verTodosPagos, setVerTodosPagos] = useState(false)

  const porCobrar = useMemo(() => negocios
    .filter((n) => n.activo && n.fecha_proximo_pago)
    .map((n) => ({ negocio: n, estado: estadoPago(n.fecha_proximo_pago) }))
    .filter(({ estado }) => estado.dias <= HORIZONTE_DIAS)
    .sort((a, b) => a.estado.dias - b.estado.dias), [negocios])

  const nombres = useMemo(() => Object.fromEntries(negocios.map((n) => [n.id, n.nombre])), [negocios])
  const sinFecha = negocios.filter((n) => n.activo && !n.fecha_proximo_pago)

  if (cargando && !datos) return <Cargando />

  return (
    <>
      <Encabezado titulo="Cobros" sub={<span>Mensualidades de los negocios</span>} />

      {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error">{error}</Aviso></div>}

      <div className="kpis kpis--3">
        <Indicador etiqueta="Cobrado este mes" valor={formatoPesos(r.cobradoMes)} nota={`${r.pagosMes} pago${r.pagosMes === 1 ? '' : 's'}`} tono={r.cobradoMes ? 'ok' : undefined} />
        <Indicador
          etiqueta="Vencido"
          valor={formatoPesos(r.vencidos.reduce((s, n) => s + Number(n.valor_mensual || 0), 0))}
          nota={`${r.vencidos.length} negocio${r.vencidos.length === 1 ? '' : 's'}`}
          tono={r.vencidos.length ? 'error' : undefined}
        />
        <Indicador etiqueta="Ingreso esperado" valor={formatoPesos(r.ingresoMensual)} nota={`${r.activos} activos · al mes`} />
      </div>

      <div className="rejilla-detalle">
        <section className="seccion">
          <div className="seccion__cabeza">
            <h2>Por cobrar</h2>
            <span className="suave">Vencidos y próximos {HORIZONTE_DIAS} días</span>
          </div>
          {porCobrar.length === 0 ? (
            <div className="vacio"><strong>Nada por cobrar</strong>Ningún pago vence en los próximos {HORIZONTE_DIAS} días.</div>
          ) : porCobrar.map(({ negocio: n, estado }) => {
            const whatsapp = whatsappCobro(n)
            const tono = estado.clave === 'vencido' ? 'error' : estado.clave === 'por_vencer' ? 'aviso' : 'neutra'
            return (
              <div key={n.id} className="fila cobro">
                <Link to={`/negocios/${n.id}?pestana=pagos`} className="cobro__info">
                  <span className="fila__titulo">{n.nombre}</span>
                  <span className="cobro__meta">
                    <span className={`insignia insignia--${tono}`}>{estado.clave === 'al_dia' ? `En ${estado.dias} días` : estado.texto}</span>
                    <span className="suave chico">{formatoFecha(n.fecha_proximo_pago)}</span>
                  </span>
                </Link>
                <div className="cobro__lado">
                  <span className="cobro__valor num">{Number(n.valor_mensual) ? formatoPesos(n.valor_mensual) : '—'}</span>
                  <div className="fila__acciones">
                    {whatsapp && (
                      <a className="boton boton--chico boton--whatsapp boton--icono" href={whatsapp} target="_blank" rel="noreferrer" title="Enviar recordatorio" aria-label={`Enviar recordatorio a ${n.nombre}`}>
                        <IconoWhatsapp />
                      </a>
                    )}
                    <Link className="boton boton--chico" to={`/negocios/${n.id}?pestana=pagos&registrar=1`}>Registrar</Link>
                  </div>
                </div>
              </div>
            )
          })}
          {sinFecha.length > 0 && (
            <div className="seccion__pie suave">
              {sinFecha.length} negocio{sinFecha.length === 1 ? '' : 's'} activo{sinFecha.length === 1 ? '' : 's'} sin fecha de pago:{' '}
              {sinFecha.map((n, i) => (
                <span key={n.id}>{i > 0 && ', '}<Link className="enlace" to={`/negocios/${n.id}?pestana=datos`}>{n.nombre}</Link></span>
              ))}
            </div>
          )}
        </section>

        <section className="seccion">
          <div className="seccion__cabeza">
            <h2>Pagos recibidos</h2>
            <span className="suave">Últimos 6 meses</span>
          </div>
          {pagos.length === 0 ? (
            <div className="vacio">Sin pagos registrados en los últimos 6 meses.</div>
          ) : (verTodosPagos ? pagos : pagos.slice(0, PAGOS_VISIBLES)).map((p) => (
            <Link key={p.id} to={`/negocios/${p.negocio_id}?pestana=pagos`} className="fila">
              <div style={{ minWidth: 0 }}>
                <div className="fila__titulo">{nombres[p.negocio_id] || 'Negocio'}</div>
                <div className="fila__sub">{formatoFecha(p.fecha_pago)} · {p.meses} mes{p.meses === 1 ? '' : 'es'}{p.metodo ? ` · ${p.metodo}` : ''}</div>
              </div>
              <span className="cobro__valor num">{formatoPesos(p.monto)}</span>
            </Link>
          ))}
          {pagos.length > PAGOS_VISIBLES && (
            <div className="seccion__pie">
              <button className="boton boton--fantasma boton--chico" onClick={() => setVerTodosPagos((v) => !v)}>
                {verTodosPagos ? 'Ver menos' : `Ver los ${pagos.length}`}
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
