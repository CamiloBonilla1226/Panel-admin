const ZONA = 'America/Bogota'

const pesos = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const numero = new Intl.NumberFormat('es-CO')

export const formatoPesos = (valor) => pesos.format(Number(valor) || 0)
export const formatoNumero = (valor) => numero.format(Number(valor) || 0)

// Fecha "solo día" (columnas date, ej. 2026-11-30). Se arma a mediodía local para
// que la zona horaria no la corra un día.
export function fechaDia(valor) {
  if (!valor) return null
  const [a, m, d] = String(valor).slice(0, 10).split('-').map(Number)
  return new Date(a, m - 1, d, 12)
}

export function formatoFecha(valor) {
  if (!valor) return '—'
  const fecha = String(valor).length === 10 ? fechaDia(valor) : new Date(valor)
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatoFechaHora(valor) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: ZONA,
  })
}

export function hace(valor) {
  if (!valor) return 'nunca'
  const segundos = (Date.now() - new Date(valor).getTime()) / 1000
  if (segundos < 60) return 'hace un momento'
  const minutos = segundos / 60
  if (minutos < 60) return `hace ${Math.floor(minutos)} min`
  const horas = minutos / 60
  if (horas < 24) return `hace ${Math.floor(horas)} h`
  const dias = Math.floor(horas / 24)
  if (dias === 1) return 'ayer'
  if (dias < 30) return `hace ${dias} días`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return meses === 1 ? 'hace 1 mes' : `hace ${meses} meses`
  return 'hace más de un año'
}

export function hoyISO() {
  return new Date().toLocaleDateString('en-CA', { timeZone: ZONA })
}

// Suma meses a una fecha YYYY-MM-DD sin desbordar (31 ene + 1 mes = 28/29 feb).
export function sumarMeses(fechaISO, meses) {
  const base = fechaDia(fechaISO) || fechaDia(hoyISO())
  const dia = base.getDate()
  const nueva = new Date(base.getFullYear(), base.getMonth() + Number(meses || 0), 1, 12)
  const ultimoDia = new Date(nueva.getFullYear(), nueva.getMonth() + 1, 0).getDate()
  nueva.setDate(Math.min(dia, ultimoDia))
  return nueva.toLocaleDateString('en-CA')
}

export function nombreMes(mesISO) {
  const [a, m] = mesISO.split('-').map(Number)
  return new Date(a, m - 1, 15).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')
}

export function slugificar(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// Enlace wa.me. Si el número viene sin indicativo (10 dígitos) se asume Colombia.
// `texto` deja el mensaje escrito para que solo haya que tocar "Enviar".
export function enlaceWhatsapp(numeroTel, texto) {
  const limpio = String(numeroTel || '').replace(/\D/g, '')
  if (!limpio) return null
  const base = `https://wa.me/${limpio.length === 10 ? `57${limpio}` : limpio}`
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base
}

export function urlConProtocolo(url) {
  if (!url) return null
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}
