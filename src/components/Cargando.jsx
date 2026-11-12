export default function Cargando({ pantallaCompleta = false, texto = 'Cargando…' }) {
  return (
    <div className="cargando" style={pantallaCompleta ? { minHeight: '100svh' } : undefined}>
      <div className="girando" />
      <span>{texto}</span>
    </div>
  )
}
