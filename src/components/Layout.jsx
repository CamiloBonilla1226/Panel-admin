import { Link, NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function IconoLista() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="square" />
    </svg>
  )
}

export function Logo() {
  return <span className="barra__logo" aria-hidden="true"><span /></span>
}

export default function Layout({ correo, children }) {
  return (
    <div className="app">
      <header className="barra">
        <Link to="/" className="barra__marca"><Logo /> Panel maestro</Link>
        <nav className="barra__nav">
          <NavLink to="/" end>Negocios</NavLink>
        </nav>
        <div className="barra__derecha">
          <span className="barra__correo">{correo}</span>
          <button className="boton boton--fantasma boton--chico" onClick={() => supabase.auth.signOut()}>Salir</button>
        </div>
      </header>

      <main className="contenido">{children}</main>

      <nav className="nav-movil">
        <NavLink to="/" end><IconoLista />Negocios</NavLink>
      </nav>
    </div>
  )
}
