import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Logo } from '../components/Layout'
import { Aviso, Campo } from '../components/ui'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
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
    <div className="login">
      <div className="login__caja">
        <div className="login__marca"><Logo /> Panel maestro</div>
        <h1>Iniciar sesión</h1>
        <p className="suave">Acceso exclusivo del administrador de la plataforma.</p>
        <form className="formulario" onSubmit={entrar}>
          <Campo etiqueta="Correo">
            <input className="campo__control" type="email" autoComplete="username" required value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </Campo>
          <Campo etiqueta="Contraseña">
            <input className="campo__control" type="password" autoComplete="current-password" required value={contrasena} onChange={(e) => setContrasena(e.target.value)} />
          </Campo>
          <Aviso tipo="error">{error}</Aviso>
          <button className="boton boton--primario boton--bloque" disabled={enviando}>
            {enviando ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
