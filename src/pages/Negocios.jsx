import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { rpc } from '../lib/api'
import { useDatos } from '../hooks/useDatos'
import { estadoPago } from '../lib/estadoPago'
import { formatoFecha, formatoNumero, formatoPesos, hace } from '../lib/formato'
import { Aviso, InsigniaActivo, InsigniaPago } from '../components/ui'

const FILTROS = [
  { clave: 'todos', texto: 'Todos', prueba: () => true },
  { clave: 'activos', texto: 'Activos', prueba: (n) => n.activo },
  { clave: 'inactivos', texto: 'Inactivos', prueba: (n) => !n.activo },
  { clave: 'vencidos', texto: 'Vencidos', prueba: (n) => estadoPago(n.fecha_proximo_pago).clave === 'vencido' },
  { clave: 'por_vencer', texto: 'Por vencer', prueba: (n) => estadoPago(n.fecha_proximo_pago).clave === 'por_vencer' },
  { clave: 'sin_fecha', texto: 'Sin fecha de pago', prueba: (n) => !n.fecha_proximo_pago },
]

const ORDENES = {
  recientes: { texto: 'Más recientes', fn: (a, b) => (b.creado_en || '').localeCompare(a.creado_en || '') },
  nombre: { texto: 'Nombre', fn: (a, b) => a.nombre.localeCompare(b.nombre, 'es') },
  pago: {
    texto: 'Próximo pago',
    fn: (a, b) => (a.fecha_proximo_pago || '9999').localeCompare(b.fecha_proximo_pago || '9999'),
  },
  pedidos: { texto: 'Más pedidos (30 días)', fn: (a, b) => b.pedidos_30d - a.pedidos_30d },
}

function textoBusqueda(n) {
  const duenos = n.duenos.map((d) => `${d.nombre} ${d.numero}`).join(' ')
  return `${n.nombre} ${n.slug} ${n.whatsapp_contacto || ''} ${n.dominio_propio || ''} ${duenos}`
    .normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

function exportarCsv(negocios) {
  const columnas = [
    ['Negocio', (n) => n.nombre],
    ['Slug', (n) => n.slug],
    ['ID', (n) => n.id],
    ['Activo', (n) => (n.activo ? 'Sí' : 'No')],
    ['Dueños', (n) => n.duenos.map((d) => d.nombre).join(' / ')],
    ['Números dueños', (n) => n.duenos.map((d) => d.numero).join(' / ')],
    ['WhatsApp negocio', (n) => n.whatsapp_contacto],
    ['Plan', (n) => n.plan || ''],
    ['Valor mensual', (n) => n.valor_mensual],
    ['Próximo pago', (n) => n.fecha_proximo_pago || ''],
    ['Último pago', (n) => n.ultimo_pago || ''],
    ['Sitio', (n) => n.url_sitio || n.dominio_propio || ''],
    ['Productos', (n) => n.productos],
    ['Pedidos 30 días', (n) => n.pedidos_30d],
    ['Ventas 30 días', (n) => n.ventas_30d],
    ['Último acceso al panel', (n) => n.ultimo_acceso || ''],
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
  const { datos, cargando, error, recargar } = useDatos(() => rpc('sa_resumen_negocios'), 'resumen')
  const [filtro, setFiltro] = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes')

  const negocios = useMemo(() => datos || [], [datos])

  const kpis = useMemo(() => {
    const activos = negocios.filter((n) => n.activo)
    return {
      total: negocios.length,
      activos: activos.length,
      ingreso: activos.reduce((s, n) => s + Number(n.valor_mensual || 0), 0),
      vencidos: activos.filter((n) => estadoPago(n.fecha_proximo_pago).clave === 'vencido').length,
      porVencer: activos.filter((n) => estadoPago(n.fecha_proximo_pago).clave === 'por_vencer').length,
      pedidos: negocios.reduce((s, n) => s + n.pedidos_30d, 0),
      ventas: negocios.reduce((s, n) => s + Number(n.ventas_30d || 0), 0),
    }
  }, [negocios])

  const visibles = useMemo(() => {
    const prueba = FILTROS.find((f) => f.clave === filtro).prueba
    const termino = busqueda.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
    return negocios
      .filter(prueba)
      .filter((n) => !termino || textoBusqueda(n).includes(termino))
      .sort(ORDENES[orden].fn)
  }, [negocios, filtro, busqueda, orden])

  return (
    <>
      <div className="encabezado">
        <div className="encabezado__titulos">
          <h1>Negocios</h1>
          <p>Todos los negocios conectados a la plataforma.</p>
        </div>
        <div className="encabezado__acciones">
          <button className="boton" onClick={() => recargar()} disabled={cargando}>Actualizar</button>
          <button className="boton" onClick={() => exportarCsv(visibles)} disabled={!visibles.length}>Exportar CSV</button>
          <Link className="boton boton--primario" to="/negocios/nuevo">Nuevo negocio</Link>
        </div>
      </div>

      {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error">{error}</Aviso></div>}

      <div className="kpis">
        <div className="kpi">
          <div className="kpi__etiqueta">Negocios</div>
          <div className="kpi__valor">{cargando && !datos ? '—' : kpis.total}</div>
          <div className="kpi__nota">{kpis.activos} activos</div>
        </div>
        <div className="kpi">
          <div className="kpi__etiqueta">Ingreso mensual</div>
          <div className="kpi__valor">{formatoPesos(kpis.ingreso)}</div>
          <div className="kpi__nota">Suma de activos</div>
        </div>
        <div className={`kpi ${kpis.vencidos ? 'kpi--alerta' : ''}`}>
          <div className="kpi__etiqueta">Vencidos</div>
          <div className="kpi__valor">{kpis.vencidos}</div>
          <div className="kpi__nota">Activos sin pagar</div>
        </div>
        <div className={`kpi ${kpis.porVencer ? 'kpi--aviso' : ''}`}>
          <div className="kpi__etiqueta">Por vencer</div>
          <div className="kpi__valor">{kpis.porVencer}</div>
          <div className="kpi__nota">Próximos 7 días</div>
        </div>
        <div className="kpi">
          <div className="kpi__etiqueta">Pedidos 30 días</div>
          <div className="kpi__valor">{formatoNumero(kpis.pedidos)}</div>
          <div className="kpi__nota">Todos los negocios</div>
        </div>
        <div className="kpi">
          <div className="kpi__etiqueta">Ventas 30 días</div>
          <div className="kpi__valor">{formatoPesos(kpis.ventas)}</div>
          <div className="kpi__nota">Sin rechazados</div>
        </div>
      </div>

      <div className="herramientas">
        <div className="herramientas__fila">
          <input
            className="campo__control"
            type="search"
            placeholder="Buscar negocio, dueño o número"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select className="campo__control" style={{ flex: '0 0 auto', width: 'auto' }} value={orden} onChange={(e) => setOrden(e.target.value)} aria-label="Ordenar">
            {Object.entries(ORDENES).map(([clave, o]) => <option key={clave} value={clave}>{o.texto}</option>)}
          </select>
        </div>
        <div className="filtros" role="tablist">
          {FILTROS.map((f) => (
            <button
              key={f.clave}
              className={`filtro ${filtro === f.clave ? 'filtro--activo' : ''}`}
              onClick={() => setFiltro(f.clave)}
              role="tab"
              aria-selected={filtro === f.clave}
            >
              {f.texto}<span className="cuenta">{negocios.filter(f.prueba).length}</span>
            </button>
          ))}
        </div>
      </div>

      <section className="seccion">
        {cargando && !datos ? (
          <>{[0, 1, 2, 3].map((i) => <div key={i} className="esqueleto" />)}</>
        ) : visibles.length === 0 ? (
          <div className="vacio">
            <strong>{negocios.length ? 'Ningún negocio coincide' : 'Todavía no hay negocios'}</strong>
            {negocios.length ? 'Prueba con otro filtro o búsqueda.' : 'Crea el primero con "Nuevo negocio".'}
          </div>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Negocio</th>
                <th>Dueño</th>
                <th>Estado</th>
                <th>Pago</th>
                <th>Plan</th>
                <th>Actividad</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((n) => (
                <tr key={n.id} onClick={() => navigate(`/negocios/${n.id}`)}>
                  <td data-label="" data-ancho="completo">
                    <Link to={`/negocios/${n.id}`} className="tabla__nombre" style={{ textDecoration: 'none' }} onClick={(e) => e.stopPropagation()}>
                      {n.nombre}
                    </Link>
                    <div className="tabla__sub">
                      {n.url_sitio || n.dominio_propio || n.slug} · desde {formatoFecha(n.creado_en)}
                    </div>
                  </td>
                  <td data-label="Dueño" data-ancho="completo">
                    {n.duenos.length === 0 ? (
                      <span className="insignia insignia--aviso">Sin dueño</span>
                    ) : (
                      n.duenos.map((d) => (
                        <div key={d.numero}>
                          {d.nombre} <span className="mono suave">{d.numero}</span>
                        </div>
                      ))
                    )}
                    {n.empleados > 0 && <div className="tabla__sub">+{n.empleados} empleado{n.empleados === 1 ? '' : 's'}</div>}
                  </td>
                  <td data-label="Estado"><InsigniaActivo activo={n.activo} /></td>
                  <td data-label="Pago"><InsigniaPago fecha={n.fecha_proximo_pago} conFecha /></td>
                  <td data-label="Plan">
                    <div>{n.plan || '—'}</div>
                    <div className="tabla__sub num">{n.valor_mensual ? `${formatoPesos(n.valor_mensual)}/mes` : 'Sin valor'}</div>
                  </td>
                  <td data-label="Actividad">
                    <div className="num">{formatoNumero(n.pedidos_30d)} pedidos · 30 d</div>
                    <div className="tabla__sub">Panel: {hace(n.ultimo_acceso)}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  )
}
