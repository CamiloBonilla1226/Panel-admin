import { useMemo } from 'react'
import { inicioMes, usePlataforma } from '../hooks/usePlataforma'
import { useTitulo } from '../hooks/useTitulo'
import { estadoPago } from '../lib/estadoPago'
import { formatoNumero, formatoPesos, hoyISO, nombreMes } from '../lib/formato'
import { Aviso, Encabezado, Indicador } from '../components/ui'
import Cargando from '../components/Cargando'
import Pendientes from '../components/Pendientes'
import BotonActualizar from '../components/Actualizar'

function saludo() {
  const hora = Number(new Date().toLocaleString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Bogota' }))
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function fechaLarga() {
  const texto = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Bogota' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Resumen de la plataforma para revisar en 10 segundos: cuánto entra al mes,
// cuánto ya se cobró, qué falta por cobrar y cómo van los negocios.
export function calcularResumen(negocios, pagos) {
  const activos = negocios.filter((n) => n.activo)
  const mesActual = inicioMes(0)
  const vencidos = activos.filter((n) => estadoPago(n.fecha_proximo_pago).clave === 'vencido')
  const porVencer = activos.filter((n) => estadoPago(n.fecha_proximo_pago).clave === 'por_vencer')
  const valor = (lista) => lista.reduce((s, n) => s + Number(n.valor_mensual || 0), 0)

  return {
    activos: activos.length,
    inactivos: negocios.length - activos.length,
    ingresoMensual: valor(activos),
    cobradoMes: pagos.filter((p) => p.fecha_pago >= mesActual).reduce((s, p) => s + Number(p.monto), 0),
    pagosMes: pagos.filter((p) => p.fecha_pago >= mesActual).length,
    vencidos,
    porVencer,
    porCobrar: valor(vencidos) + valor(porVencer),
    pedidos30: negocios.reduce((s, n) => s + n.pedidos_30d, 0),
    ventas30: negocios.reduce((s, n) => s + Number(n.ventas_30d || 0), 0),
  }
}

// Cobrado por mes (últimos 6), a partir de los pagos registrados.
function cobradoPorMes(pagos) {
  const meses = Array.from({ length: 6 }, (_, i) => inicioMes(5 - i).slice(0, 7))
  return meses.map((mes) => ({
    mes,
    total: pagos.filter((p) => p.fecha_pago.slice(0, 7) === mes).reduce((s, p) => s + Number(p.monto), 0),
  }))
}

export default function Inicio() {
  useTitulo('Inicio')
  const { datos, cargando, error } = usePlataforma()
  const negocios = useMemo(() => datos?.negocios || [], [datos])
  const pagos = useMemo(() => datos?.pagos || [], [datos])
  const r = useMemo(() => calcularResumen(negocios, pagos), [negocios, pagos])
  const porMes = useMemo(() => cobradoPorMes(pagos), [pagos])
  const maximo = Math.max(1, ...porMes.map((m) => m.total))

  if (cargando && !datos) return <Cargando />

  return (
    <>
      <Encabezado titulo={saludo()} sub={<span>{fechaLarga()}</span>} acciones={<BotonActualizar />} />

      {error && <div style={{ marginBottom: 16 }}><Aviso tipo="error">{error}</Aviso></div>}

      <div className="kpis">
        <Indicador
          etiqueta="Cobrado este mes"
          valor={formatoPesos(r.cobradoMes)}
          nota={`${r.pagosMes} pago${r.pagosMes === 1 ? '' : 's'} · de ${formatoPesos(r.ingresoMensual)}`}
          tono={r.cobradoMes > 0 ? 'ok' : undefined}
          a="/cobros"
        />
        <Indicador
          etiqueta="Por cobrar"
          valor={formatoPesos(r.porCobrar)}
          nota={`${r.vencidos.length} vencido${r.vencidos.length === 1 ? '' : 's'} · ${r.porVencer.length} por vencer`}
          tono={r.vencidos.length ? 'error' : r.porVencer.length ? 'aviso' : undefined}
          a="/cobros"
        />
        <Indicador
          etiqueta="Negocios activos"
          valor={formatoNumero(r.activos)}
          nota={r.inactivos ? `${r.inactivos} inactivo${r.inactivos === 1 ? '' : 's'}` : 'Todos funcionando'}
          a="/negocios"
        />
        <Indicador
          etiqueta="Pedidos 30 días"
          valor={formatoNumero(r.pedidos30)}
          nota={`${formatoPesos(r.ventas30)} en ventas`}
        />
      </div>

      <div className="inicio">
        <Pendientes negocios={negocios} />

        <section className="seccion">
          <div className="seccion__cabeza">
            <h2>Cobrado por mes</h2>
            <span className="suave">Ingreso esperado: {formatoPesos(r.ingresoMensual)}/mes</span>
          </div>
          <div className="seccion__cuerpo">
            <div className="barras">
              {porMes.map((m) => (
                <div key={m.mes} className="barras__col" title={formatoPesos(m.total)}>
                  <div className="barras__pista">
                    <div className={`barras__barra ${m.total ? '' : 'barras__barra--vacia'}`} style={{ height: `${(m.total / maximo) * 100}%` }}>
                      <span className="barras__valor">{m.total ? `${Math.round(m.total / 1000)}k` : ''}</span>
                    </div>
                  </div>
                  <div className="barras__mes">{m.mes === hoyISO().slice(0, 7) ? 'Este mes' : nombreMes(m.mes)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
