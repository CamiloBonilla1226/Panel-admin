import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import BotonInstalar from './Instalar'
import { IconoInicio, IconoNegocios, IconoSalir } from './Iconos'

// Secciones principales. Las mismas en la barra lateral (PC) y en la barra
// inferior (celular), para que se encuentren igual en los dos.
export const SECCIONES = [
  { ruta: '/', texto: 'Inicio', Icono: IconoInicio, exacta: true },
  { ruta: '/negocios', texto: 'Negocios', Icono: IconoNegocios },
]

export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <span /><span /><span />
    </span>
  )
}

function salir() {
  supabase.auth.signOut()
}

export default function Layout({ correo, children }) {
  return (
    <div className="app">
      {/* PC: barra lateral fija */}
      <aside className="lateral">
        <Link to="/" className="marca"><Logo /> Panel maestro</Link>
        <nav className="lateral__nav">
          {SECCIONES.map(({ ruta, texto, Icono, exacta }) => (
            <NavLink key={ruta} to={ruta} end={exacta}><Icono />{texto}</NavLink>
          ))}
        </nav>
        <div className="lateral__pie">
          <BotonInstalar className="boton boton--chico boton--bloque" />
          <div className="lateral__cuenta">
            <span className="lateral__correo" title={correo}>{correo}</span>
            <button className="boton boton--fantasma boton--chico boton--icono" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión">
              <IconoSalir />
            </button>
          </div>
        </div>
      </aside>

      {/* Celular: barra superior mínima */}
      <header className="barra">
        <Link to="/" className="marca"><Logo /> Panel maestro</Link>
        <div className="barra__acciones">
          <BotonInstalar className="boton boton--chico" texto="Instalar" />
          <button className="boton boton--fantasma boton--chico boton--icono" onClick={salir} aria-label="Cerrar sesión">
            <IconoSalir />
          </button>
        </div>
      </header>

      <main className="contenido">{children}</main>

      {/* Celular: navegación inferior al alcance del pulgar */}
      <nav className="nav-movil" style={{ gridTemplateColumns: `repeat(${SECCIONES.length}, 1fr)` }}>
        {SECCIONES.map(({ ruta, texto, Icono, exacta }) => (
          <NavLink key={ruta} to={ruta} end={exacta}><Icono />{texto}</NavLink>
        ))}
      </nav>
    </div>
  )
}
