import { estadoPago } from './estadoPago'
import { enlaceWhatsapp, formatoFecha, formatoPesos } from './formato'

// Enlace de la app de domicilios de un negocio (lo que abren sus clientes para
// pedir). Si tiene dominio propio manda ese; si no, el link de Vercel guardado
// en plataforma_suscripciones.url_sitio.
export function urlApp(negocio) {
  const crudo = negocio?.dominio_propio || negocio?.url_sitio
  if (!crudo) return null
  const limpio = String(crudo).trim().replace(/\/+$/, '')
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`
}

// Panel del dueño dentro de la misma app (ruta /admin del proyecto base).
export function urlAdmin(negocio) {
  const app = urlApp(negocio)
  return app ? `${app}/admin` : null
}

// Texto corto para mostrar el enlace sin "https://".
export function urlCorta(url) {
  return url ? url.replace(/^https?:\/\//i, '') : ''
}

// Número al que se le escribe al negocio: el del primer dueño activo; si no hay,
// el WhatsApp de pedidos.
export function numeroContacto(negocio, duenos = negocio?.duenos || []) {
  const dueno = duenos.find((d) => d.activo !== false) || duenos[0]
  return dueno?.numero || negocio?.whatsapp_contacto || null
}

export function primerNombre(nombre) {
  return String(nombre || '').trim().split(/\s+/)[0] || ''
}

// Mensaje de cobro listo para WhatsApp, según si ya venció o está por vencer.
export function mensajeCobro(negocio, duenos = negocio?.duenos || []) {
  const dueno = duenos.find((d) => d.activo !== false) || duenos[0]
  const saludo = dueno ? `Hola ${primerNombre(dueno.nombre)}` : 'Hola'
  const estado = estadoPago(negocio.fecha_proximo_pago)
  const valor = Number(negocio.valor_mensual) ? ` por ${formatoPesos(negocio.valor_mensual)}` : ''
  const fecha = formatoFecha(negocio.fecha_proximo_pago)

  let cuerpo
  if (estado.clave === 'vencido') cuerpo = `la mensualidad de ${negocio.nombre}${valor} venció el ${fecha}. ¿Me confirmas cuando hagas el pago?`
  else if (estado.dias === 0) cuerpo = `hoy vence la mensualidad de ${negocio.nombre}${valor}. ¿Me confirmas cuando hagas el pago?`
  else cuerpo = `te recuerdo que la mensualidad de ${negocio.nombre}${valor} vence el ${fecha}.`
  return `${saludo}, ${cuerpo} ¡Gracias!`
}

export function whatsappCobro(negocio, duenos) {
  return enlaceWhatsapp(numeroContacto(negocio, duenos), mensajeCobro(negocio, duenos))
}

export function whatsappEnlaceApp(negocio, duenos) {
  const app = urlApp(negocio)
  if (!app) return null
  return enlaceWhatsapp(
    numeroContacto(negocio, duenos),
    `Este es el enlace de la app de domicilios de ${negocio.nombre}: ${app}\nY tu panel para administrarla: ${app}/admin`,
  )
}
