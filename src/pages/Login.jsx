import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Layout'
import { Aviso, Campo } from '../components/ui'

export function PantallaCentrada({ children }) {
  return (
    <div className="login">
      <div className="login__caja">
        <div className="login__marca"><Logo /> Panel maestro</div>
        {children}
      </div>
    </div>
  )
}

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [verContrasena, setVerContrasena] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function entrar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error: errorLogin } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: contrasena })
    if (errorLogin) {
      setError(/Invalid login/i.test(errorLogin.message) ? 'Correo o contraseña incorrectos.' : errorLogin.message)
      setEnviando(false)
    }
  }

  return (
    <PantallaCentrada>
      <h1>Iniciar sesión</h1>
      <p className="suave">Acceso solo para el administrador de la plataforma.</p>
      <form className="formulario" onSubmit={entrar}>
        <Campo etiqueta="Correo">
          <input
            className="campo__control"
            type="email"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            required
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
          />
        </Campo>
        <Campo etiqueta="Contraseña">
          <div className="campo__con-boton">
            <input
              className="campo__control"
              type={verContrasena ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
            <button type="button" className="boton boton--fantasma boton--chico" onClick={() => setVerContrasena((v) => !v)}>
              {verContrasena ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </Campo>
        <Aviso tipo="error">{error}</Aviso>
        <button className="boton boton--primario boton--bloque login__entrar" disabled={enviando}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </PantallaCentrada>
  )
}
