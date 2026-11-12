import { Navigate, Route, Routes } from 'react-router-dom'
import { useSesion } from './hooks/useSesion'
import { supabase } from './lib/supabase'
import Layout from './components/Layout'
import Cargando from './components/Cargando'
import Login from './pages/Login'
import Negocios from './pages/Negocios'
import Negocio from './pages/Negocio'
import NuevoNegocio from './pages/NuevoNegocio'

export default function App() {
  const { cargando, usuario, esSuperadmin } = useSesion()

  if (cargando) return <Cargando pantallaCompleta />
  if (!usuario) return <Login />

  if (!esSuperadmin) {
    return (
      <div className="login">
        <div className="login__caja">
          <h1>Sin acceso</h1>
          <p className="suave">
            La cuenta <span className="mono">{usuario.email}</span> no tiene el rol superadmin. Corre
            {' '}<span className="mono">supabase/02-crear-superadmin.sql</span> con este correo y vuelve a entrar.
          </p>
          <button className="boton boton--bloque" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </div>
      </div>
    )
  }

  return (
    <Layout correo={usuario.email}>
      <Routes>
        <Route path="/" element={<Negocios />} />
        <Route path="/negocios/nuevo" element={<NuevoNegocio />} />
        <Route path="/negocios/:id" element={<Negocio />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}
