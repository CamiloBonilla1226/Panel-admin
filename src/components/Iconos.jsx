// Íconos de línea propios (sin librería): mismo trazo y esquinas rectas que el
// resto del panel. Heredan el color del texto.
function Icono({ children, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" aria-hidden="true" {...props}>
      {children}
    </svg>
  )
}

export const IconoInicio = (p) => <Icono {...p}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></Icono>
export const IconoNegocios = (p) => <Icono {...p}><path d="M4 9h16v11H4zM6 4h12l2 5H4zM10 20v-5h4v5" /></Icono>
export const IconoCobros = (p) => <Icono {...p}><path d="M3 6h18v12H3zM3 10h18M7 15h4" /></Icono>
export const IconoSalir = (p) => <Icono {...p}><path d="M14 4H4v16h10M10 12h10M17 8l4 4-4 4" /></Icono>
export const IconoActualizar = (p) => <Icono {...p}><path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5" /></Icono>
export const IconoAbrir = (p) => <Icono {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6" /></Icono>
export const IconoCopiar = (p) => <Icono {...p}><path d="M8 8h12v12H8zM4 16V4h12" /></Icono>
export const IconoCompartir = (p) => <Icono {...p}><path d="M12 3v12M7 8l5-5 5 5M5 13v8h14v-8" /></Icono>
export const IconoInstalar = (p) => <Icono {...p}><path d="M12 3v12M7 10l5 5 5-5M4 19h16" /></Icono>
export const IconoFlecha = (p) => <Icono {...p}><path d="m9 5 7 7-7 7" /></Icono>
export const IconoAtras = (p) => <Icono {...p}><path d="m15 5-7 7 7 7" /></Icono>
export const IconoBuscar = (p) => <Icono {...p}><path d="M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM15.5 15.5 20 20" /></Icono>
export const IconoMas = (p) => <Icono {...p}><path d="M12 5v14M5 12h14" /></Icono>
export const IconoDescargar = (p) => <Icono {...p}><path d="M12 4v11M7 10l5 5 5-5M4 20h16" /></Icono>

// Logo oficial de WhatsApp simplificado (relleno, no trazo).
export function IconoWhatsapp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.3c0-.1-.2-.2-.5-.3z" />
    </svg>
  )
}
