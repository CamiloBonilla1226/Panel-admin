import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './hooks/useSesion'
import { PlataformaProvider } from './hooks/usePlataforma'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Cargando from './components/Cargando'
import Login, { PantallaCentrada } from './pages/Login'
import Inicio from './pages/Inicio'
import Negocios from './pages/Negocios'
import Negocio from './pages/Negocio'
import Cobros from './pages/Cobros'

export default function App() {
  const { cargando, usuario, esSuperadmin } = useSesion()

  if (cargando) return <Cargando pantallaCompleta />
  if (!usuario) return <Login />

  if (!esSuperadmin) {
    return (
      <PantallaCentrada>
        <h1>Sin acceso</h1>
        <p className="suave">
          La cuenta <span className="mono">{usuario.email}</span> no tiene el rol superadmin. Corre
          {' '}<span className="mono">supabase/02-crear-superadmin.sql</span> con este correo y vuelve a entrar.
        </p>
        <button className="boton boton--bloque" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
      </PantallaCentrada>
    )
  }

  return (
    <PlataformaProvider>
      <Layout correo={usuario.email}>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/negocios" element={<Negocios />} />
          <Route path="/negocios/:id" element={<Negocio />} />
          <Route path="/cobros" element={<Cobros />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </PlataformaProvider>
  )
}
