import { estadoPago } from './estadoPago'
import { urlApp } from './enlaces'
import { fechaDia, hoyISO } from './formato'

export const DIAS_SIN_PEDIDOS = 14
export const DIAS_SIN_ENTRAR = 30

function diasDesde(fecha) {
  if (!fecha) return null
  return Math.floor((fechaDia(hoyISO()) - fechaDia(String(fecha).slice(0, 10))) / 86400000)
}

// Lo que requiere atención en cada negocio, de más a menos urgente. Solo se
// revisan los activos: un negocio desactivado ya fue una decisión tuya.
// tipo: cobro (con botón de WhatsApp) | config | actividad
export function alertasNegocio(n) {
  if (!n.activo) return []
  const alertas = []
  const pago = estadoPago(n.fecha_proximo_pago)

  if (pago.clave === 'vencido') alertas.push({ tipo: 'cobro', tono: 'error', prioridad: 0, texto: pago.texto })
  else if (pago.clave === 'por_vencer') alertas.push({ tipo: 'cobro', tono: 'aviso', prioridad: 1, texto: pago.texto })
  else if (pago.clave === 'sin_fecha') alertas.push({ tipo: 'config', tono: 'aviso', prioridad: 2, texto: 'Sin fecha de pago' })

  if (!urlApp(n)) alertas.push({ tipo: 'config', tono: 'aviso', prioridad: 2, texto: 'Falta el enlace de la app' })
  if (n.duenos.length === 0) alertas.push({ tipo: 'config', tono: 'aviso', prioridad: 2, texto: 'Sin dueño: nadie puede entrar a su panel' })

  const sinPedidos = diasDesde(n.ultimo_pedido)
  if (n.ultimo_pedido && sinPedidos >= DIAS_SIN_PEDIDOS) {
    alertas.push({ tipo: 'actividad', tono: 'neutra', prioridad: 3, texto: `Sin pedidos hace ${sinPedidos} días` })
  } else if (!n.ultimo_pedido && n.duenos.length > 0) {
    alertas.push({ tipo: 'actividad', tono: 'neutra', prioridad: 4, texto: 'Todavía no recibe pedidos' })
  }

  const sinEntrar = diasDesde(n.ultimo_acceso)
  if (n.ultimo_acceso && sinEntrar >= DIAS_SIN_ENTRAR) {
    alertas.push({ tipo: 'actividad', tono: 'neutra', prioridad: 4, texto: `El dueño no entra al panel hace ${sinEntrar} días` })
  }
  return alertas
}

// Una fila por negocio con su alerta más urgente (y cuántas más tiene), ordenadas
// por urgencia; dentro de los cobros, primero el más atrasado.
export function pendientes(negocios) {
  return negocios
    .map((n) => {
      const alertas = alertasNegocio(n).sort((a, b) => a.prioridad - b.prioridad)
      return alertas.length ? { negocio: n, principal: alertas[0], extra: alertas.slice(1) } : null
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.principal.prioridad - b.principal.prioridad
      || (a.negocio.fecha_proximo_pago || '9999').localeCompare(b.negocio.fecha_proximo_pago || '9999')
      || a.negocio.nombre.localeCompare(b.negocio.nombre, 'es'))
}
