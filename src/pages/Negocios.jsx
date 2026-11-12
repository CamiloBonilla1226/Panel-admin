import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { usePlataforma } from '../hooks/usePlataforma'
import { estadoPago } from '../lib/estadoPago'
import { urlApp, urlCorta } from '../lib/enlaces'
import { formatoFecha, formatoNumero, formatoPesos, hace } from '../lib/formato'
import { Aviso, Encabezado, InsigniaPago } from '../components/ui'
import { IconoAbrir, IconoActualizar, IconoBuscar, IconoDescargar } from '../components/Iconos'

const sinTildes = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const clavePago = (n) => estadoPago(n.fecha_proximo_pago).clave

// Pocos filtros y con nombres claros. "Activos" agrupa a todos los que están
// funcionando; el estado de pago se ve en cada fila.
export const FILTROS = [
  { clave: 'activos', texto: 'Activos', prueba: (n) => n.activo },
  { clave: 'vencidos', texto: 'Vencidos', prueba: (n) => n.activo && clavePago(n) === 'vencido' },
  { clave: 'por_vencer', texto: 'Por vencer', prueba: (n) => n.activo && clavePago(n) === 'por_vencer' },
  { clave: 'sin_enlace', texto: 'Sin enlace', prueba: (n) => !urlApp(n) },
  { clave: 'inactivos', texto: 'Inactivos', prueba: (n) => !n.activo },
  { clave: 'todos', texto: 'Todos', prueba: () => true },
]

const ORDENES = {
  nombre: { texto: 'Nombre (A-Z)', fn: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
  pago: { texto: 'Próximo pago', fn: (a, b) => (a.fecha_proximo_pago || '9999').localeCompare(b.fecha_proximo_pago || '9999') },
  pedidos: { texto: 'Más pedidos', fn: (a, b) => b.pedidos_30d - a.pedidos_30d },
  recientes: { texto: 'Más recientes', fn: (a, b) => (b.creado_en || '').localeCompare(a.creado_en || '') },
}

function textoBusqueda(n) {
  const duenos = n.duenos.map((d) => `${d.nombre} ${d.numero}`).join(' ')
  return sinTildes(`${n.nombre} ${n.slug} ${n.whatsapp_contacto || ''} ${n.dominio_propio || ''} ${n.url_sitio || ''} ${duenos}`)
}

function exportarCsv(negocios) {
  const columnas = [
    ['Negocio', (n) => n.nombre],
    ['Enlace app', (n) => urlApp(n) || ''],
    ['Activo', (n) => (n.activo ? 'Sí' : 'No')],
    ['Dueños', (n) => n.duenos.map((d) => d.nombre).join(' / ')],
    ['Números dueños', (n) => n.duenos.map((d) => d.numero).join(' / ')],
    ['WhatsApp negocio', (n) => n.whatsapp_contacto],
    ['Plan', (n) => n.plan || ''],
    ['Valor mensual', (n) => n.valor_mensual],
    ['Próximo pago', (n) => n.fecha_proximo_pago || ''],
    ['Último pago', (n) => n.ultimo_pago || ''],
    ['Productos', (n) => n.productos],
    ['Pedidos 30 días', (n) => n.pedidos_30d],
    ['Ventas 30 días', (n) => n.ventas_30d],
    ['Último pedido', (n) => n.ultimo_pedido || ''],
    ['Último acceso al panel', (n) => n.ultimo_acceso || ''],
    ['ID', (n) => n.id],
    ['Registrado', (n) => n.creado_en],
  ]
  const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const filas = [columnas.map(([c]) => escapar(c)).join(';'), ...negocios.map((n) => columnas.map(([, f]) => escapar(f(n))).join(';'))]
  const blob = new Blob(['﻿' + filas.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `negocios-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Negocios() {
  const navigate = useNavigate()
  const { datos, cargando, error, recargar } = usePlataforma()
  const [parametros, setParametros] = useSearchParams()
  const filtro = FILTROS.some((f) => f.clave === parametros.get('filtro')) ? parametros.get('filtro') : 'activos'
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('nombre')

  const negocios = useMemo(() => datos?.negocios || [], [datos])

  const visibles = useMemo(() => {
    const termino = sinTildes(busqueda).trim()
    // Al buscar se busca en todos, para no "perder" un negocio por el filtro.
    const prueba = termino ? () => true : FILTROS.find((f) => f.clave === filtro).prueba
    return negocios
      .filter(prueba)
      .filter((n) => !termino || textoBusqueda(n).includes(termino))
      .sort(ORDENES[orden].fn)
  }, [negocios, filtro, busqueda, orden])

  const cambiarFiltro = (clave) => setParametros(clave === 'activos' ? {} : { filtro: clave }, { replace: true })

  return (
    <>
      <Encabezado
        titulo="Negocios"
        sub={<span>{negocios.length} en la plataforma · {negocios.filter((n) => n.activo).length} activos</span>}
        acciones={<>
          <button className="boton boton--chico" onClick={() => recargar()} disabled={cargando}><IconoActualizar />Actualizar</button>
          <button className="boton boton--chico" onClick={() => exportarCsv(visibles)} disabled={!visibles.length}><IconoDescargar />Exportar</button>
        </>}
      />

      {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error">{error}</Aviso></div>}

      <div className="herramientas">
        <label className="buscador">
          <IconoBuscar />
          <input
            type="search"
            placeholder="Buscar negocio, dueño o número"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar"
          />
        </label>
        <select className="campo__control herramientas__orden" value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar">
          {Object.entries(ORDENES).map(([clave, o]) => <option key={clave} value={clave}>{o.texto}</option>)}
        </select>
      </div>

      {!busqueda && (
        <div className="filtros" role="tablist" style={{ marginBottom: 12 }}>
          {FILTROS.map((f) => (
            <button
              key={f.clave}
              className={`filtro ${filtro === f.clave ? 'filtro--activo' : ''}`}
              onClick={() => cambiarFiltro(f.clave)}
              role="tab"
              aria-selected={filtro === f.clave}
            >
              {f.texto}<span className="cuenta">{negocios.filter(f.prueba).length}</span>
            </button>
          ))}
        </div>
      )}

      <section className="lista">
        <div className="nfila nfila--cabeza" aria-hidden="true">
          <span>Negocio</span><span>App de domicilios</span><span>Pago</span><span>Mensualidad</span><span>Pedidos 30 d</span><span />
        </div>
        {cargando && !datos ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="esqueleto" />)
        ) : visibles.length === 0 ? (
          <div className="vacio">
            <strong>{negocios.length ? 'Ningún negocio coincide' : 'Todavía no hay negocios'}</strong>
            {negocios.length ? 'Prueba con otro filtro o búsqueda.' : 'Los negocios se registran desde su propio proyecto.'}
          </div>
        ) : (
          visibles.map((n) => <FilaNegocio key={n.id} negocio={n} onAbrir={() => navigate(`/negocios/${n.id}`)} />)
        )}
      </section>
    </>
  )
}

function FilaNegocio({ negocio: n, onAbrir }) {
  const app = urlApp(n)
  const dueno = n.duenos[0]
  const detener = (e) => e.stopPropagation()

  return (
    <div className="nfila" onClick={onAbrir} role="link" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onAbrir()}>
      <div className="nfila__negocio">
        <Link to={`/negocios/${n.id}`} className="nfila__nombre" onClick={detener}>{n.nombre}</Link>
        <div className="nfila__sub">
          {!n.activo && <span className="insignia insignia--neutra">Inactivo</span>}
          {dueno ? <span>{dueno.nombre}</span> : <span className="texto-aviso">Sin dueño</span>}
        </div>
      </div>

      <div className="nfila__app">
        {app
          ? <a href={app} target="_blank" rel="noreferrer" className="enlace" onClick={detener}>{urlCorta(app)}</a>
          : <span className="texto-aviso">Sin enlace</span>}
      </div>

      <div className="nfila__pago">
        <InsigniaPago fecha={n.fecha_proximo_pago} />
        {n.fecha_proximo_pago && <span className="nfila__dato">{formatoFecha(n.fecha_proximo_pago)}</span>}
      </div>

      <div className="nfila__valor num">
        {Number(n.valor_mensual) ? formatoPesos(n.valor_mensual) : <span className="tenue">—</span>}
        <span className="nfila__dato">{n.plan || 'Sin plan'}</span>
      </div>

      <div className="nfila__pedidos num">
        {formatoNumero(n.pedidos_30d)}
        <span className="nfila__dato" title="Último pedido">{n.ultimo_pedido ? hace(n.ultimo_pedido) : 'sin pedidos'}</span>
      </div>

      <div className="nfila__abrir">
        {app && (
          <a href={app} target="_blank" rel="noreferrer" className="boton boton--fantasma boton--chico boton--icono" onClick={detener} title="Abrir app" aria-label={`Abrir la app de ${n.nombre}`}>
            <IconoAbrir />
          </a>
        )}
      </div>
    </div>
  )
}
