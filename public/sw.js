// Service worker del panel maestro.
// - Navegación: primero la red; si no hay señal, la última versión guardada.
// - /assets (archivos con hash de Vite) e íconos: primero la caché.
// - Supabase y /api NUNCA se guardan: los datos siempre son en vivo.
const CACHE = 'panel-maestro-v2'
const BASICOS = ['/', '/manifest.webmanifest', '/favicon.svg', '/iconos/icono-192.png']

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (evento) => {
  const { request } = evento
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    evento.respondWith(
      fetch(request)
        .then((respuesta) => {
          const copia = respuesta.clone()
          caches.open(CACHE).then((c) => c.put('/', copia))
          return respuesta
        })
        .catch(() => caches.match('/')),
    )
    return
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/iconos/')) {
    evento.respondWith(
      caches.match(request).then((guardada) => guardada || fetch(request).then((respuesta) => {
        if (respuesta.ok) {
          const copia = respuesta.clone()
          caches.open(CACHE).then((c) => c.put(request, copia))
        }
        return respuesta
      })),
    )
  }
})
