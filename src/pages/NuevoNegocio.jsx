import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { llamarApi, traducirError } from '../lib/api'
import { hoyISO, slugificar, sumarMeses } from '../lib/formato'
import { Aviso, Campo, Copiable, Seccion } from '../components/ui'

const VACIO = {
  nombre: '',
  slug: '',
  whatsapp_contacto: '',
  plan: 'Básico',
  valor_mensual: '',
  url_sitio: '',
  fecha_proximo_pago: sumarMeses(hoyISO(), 1),
  crearDueno: true,
  dueno_nombre: '',
  dueno_numero: '',
  dueno_contrasena: '',
}

export default function NuevoNegocio() {
  const [form, setForm] = useState(VACIO)
  const [slugEditado, setSlugEditado] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const [creado, setCreado] = useState(null)

  function cambiar(campo, valor) {
    setForm((f) => {
      const nuevo = { ...f, [campo]: valor }
      if (campo === 'nombre' && !slugEditado) nuevo.slug = slugificar(valor)
      return nuevo
    })
  }

  async function crear(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)

    const { data: negocio, error: errNegocio } = await supabase.from('negocios').insert({
      nombre: form.nombre.trim(),
      slug: form.slug.trim(),
      whatsapp_contacto: form.whatsapp_contacto.replace(/\D/g, ''),
      fecha_proximo_pago: form.fecha_proximo_pago || null,
      activo: true,
    }).select().single()

    if (errNegocio) {
      setError(traducirError(errNegocio))
      setEnviando(false)
      return
    }

    // Desde aquí el negocio ya existe: si algo más falla, se avisa pero se muestra
    // el resultado igual (con su ID) para no crear un duplicado al reintentar.
    const problemas = []
    const { error: errSus } = await supabase.from('plataforma_suscripciones').insert({
      negocio_id: negocio.id,
      plan: form.plan.trim() || 'Básico',
      valor_mensual: Number(form.valor_mensual) || 0,
      url_sitio: form.url_sitio.trim() || null,
    })
    if (errSus) problemas.push(`Suscripción: ${traducirError(errSus)}`)

    if (form.crearDueno) {
      try {
        await llamarApi('crear-dueno', {
          negocioId: negocio.id,
          nombre: form.dueno_nombre,
          numero: form.dueno_numero,
          contrasena: form.dueno_contrasena,
        })
      } catch (err) {
        problemas.push(`Dueño: ${err.message} Puedes crearlo desde la ficha del negocio.`)
      }
    }

    setCreado({ negocio, problemas, dueno: form.crearDueno && !problemas.some((p) => p.startsWith('Dueño')) ? form.dueno_numero.replace(/\D/g, '') : null })
    setEnviando(false)
  }

  if (creado) return <Resultado {...creado} onOtro={() => { setCreado(null); setForm(VACIO); setSlugEditado(false) }} />

  return (
    <>
      <Link to="/" className="volver">← Negocios</Link>
      <div className="encabezado">
        <div className="encabezado__titulos">
          <h1>Nuevo negocio</h1>
          <p>Registra el negocio y su dueño. Después usa su ID en el proyecto clonado.</p>
        </div>
      </div>

      <form onSubmit={crear} style={{ maxWidth: 720 }}>
        <Seccion titulo="Negocio">
          <div className="formulario">
            <div className="formulario__fila">
              <Campo etiqueta="Nombre">
                <input className="campo__control" required value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} autoFocus />
              </Campo>
              <Campo etiqueta="Slug" ayuda="Único. Solo minúsculas, números y guiones.">
                <input
                  className="campo__control mono"
                  required
                  pattern="[a-z0-9-]+"
                  value={form.slug}
                  onChange={(e) => { setSlugEditado(true); cambiar('slug', e.target.value) }}
                />
              </Campo>
            </div>
            <Campo etiqueta="WhatsApp de pedidos" ayuda="Con indicativo, sin signos. Ej. 573001234567">
              <input className="campo__control mono" inputMode="numeric" required value={form.whatsapp_contacto} onChange={(e) => cambiar('whatsapp_contacto', e.target.value)} />
            </Campo>
          </div>
        </Seccion>

        <Seccion titulo="Suscripción">
          <div className="formulario">
            <div className="formulario__fila">
              <Campo etiqueta="Plan">
                <input className="campo__control" list="planes-nuevo" value={form.plan} onChange={(e) => cambiar('plan', e.target.value)} />
                <datalist id="planes-nuevo"><option value="Básico" /><option value="Completo" /><option value="Gratis" /></datalist>
              </Campo>
              <Campo etiqueta="Valor mensual (COP)">
                <input className="campo__control num" type="number" min="0" step="1000" value={form.valor_mensual} onChange={(e) => cambiar('valor_mensual', e.target.value)} />
              </Campo>
            </div>
            <div className="formulario__fila">
              <Campo etiqueta="Primer pago">
                <input className="campo__control" type="date" value={form.fecha_proximo_pago} onChange={(e) => cambiar('fecha_proximo_pago', e.target.value)} />
              </Campo>
              <Campo etiqueta="URL del sitio (opcional)">
                <input className="campo__control" placeholder="negocio.vercel.app" value={form.url_sitio} onChange={(e) => cambiar('url_sitio', e.target.value)} />
              </Campo>
            </div>
          </div>
        </Seccion>

        <Seccion
          titulo="Dueño"
          extra={
            <label className="casilla" style={{ fontSize: 13 }}>
              <input type="checkbox" checked={form.crearDueno} onChange={(e) => cambiar('crearDueno', e.target.checked)} />
              Crear ahora
            </label>
          }
        >
          {form.crearDueno ? (
            <div className="formulario">
              <div className="formulario__fila">
                <Campo etiqueta="Nombre del dueño">
                  <input className="campo__control" required value={form.dueno_nombre} onChange={(e) => cambiar('dueno_nombre', e.target.value)} />
                </Campo>
                <Campo etiqueta="Número (usuario de login)">
                  <input className="campo__control mono" inputMode="numeric" required minLength={7} placeholder="3001234567" value={form.dueno_numero} onChange={(e) => cambiar('dueno_numero', e.target.value)} />
                </Campo>
              </div>
              <Campo etiqueta="Contraseña inicial" ayuda="Mínimo 6 caracteres. El dueño la puede cambiar desde su panel.">
                <input className="campo__control" required minLength={6} autoComplete="new-password" value={form.dueno_contrasena} onChange={(e) => cambiar('dueno_contrasena', e.target.value)} />
              </Campo>
            </div>
          ) : (
            <p className="suave">Lo puedes crear después desde la ficha del negocio.</p>
          )}
        </Seccion>

        <Aviso tipo="error">{error}</Aviso>
        <div className="acciones-form" style={{ marginTop: 16 }}>
          <Link to="/" className="boton">Cancelar</Link>
          <button className="boton boton--primario" disabled={enviando}>{enviando ? 'Creando…' : 'Crear negocio'}</button>
        </div>
      </form>
    </>
  )
}

function Resultado({ negocio, problemas, dueno, onOtro }) {
  const config = `negocioId: '${negocio.id}',\nnombre: '${negocio.nombre.replace(/'/g, "\\'")}',\nwhatsappContacto: '${negocio.whatsapp_contacto}',`

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="encabezado">
        <div className="encabezado__titulos">
          <h1>{negocio.nombre} quedó registrado</h1>
          <p>Siguiente paso: clonar el proyecto base y pegar este ID en su configuración.</p>
        </div>
      </div>

      {problemas.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Aviso tipo="error">{problemas.map((p) => <div key={p}>{p}</div>)}</Aviso>
        </div>
      )}

      <Seccion titulo="Datos para el proyecto del negocio">
        <div className="formulario">
          <Campo etiqueta="ID del negocio">
            <Copiable texto={negocio.id} />
          </Campo>
          <Campo etiqueta="src/config/negocio.config.js" ayuda="Reemplaza estos tres valores en el proyecto clonado.">
            <pre className="codigo">{config}</pre>
          </Campo>
          {dueno && (
            <Aviso tipo="ok">
              El dueño entra al panel <span className="mono">/admin</span> de su sitio con el número <strong className="mono">{dueno}</strong> y la contraseña que pusiste.
            </Aviso>
          )}
        </div>
      </Seccion>

      <div className="acciones-form">
        <button className="boton" onClick={onOtro}>Registrar otro</button>
        <Link className="boton boton--primario" to={`/negocios/${negocio.id}`}>Ver ficha del negocio</Link>
      </div>
    </div>
  )
}
