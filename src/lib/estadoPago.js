import { fechaDia, hoyISO } from './formato'

export const DIAS_AVISO = 7

// Situación de cobro de un negocio según negocios.fecha_proximo_pago.
export function estadoPago(fechaProximoPago) {
  if (!fechaProximoPago) return { clave: 'sin_fecha', texto: 'Sin fecha de pago', dias: null }
  const dias = Math.round((fechaDia(fechaProximoPago) - fechaDia(hoyISO())) / 86400000)
  if (dias < 0) return { clave: 'vencido', texto: dias === -1 ? 'Venció ayer' : `Vencido hace ${-dias} días`, dias }
  if (dias === 0) return { clave: 'por_vencer', texto: 'Vence hoy', dias }
  if (dias <= DIAS_AVISO) return { clave: 'por_vencer', texto: dias === 1 ? 'Vence mañana' : `Vence en ${dias} días`, dias }
  return { clave: 'al_dia', texto: `Al día · ${dias} días`, dias }
}
