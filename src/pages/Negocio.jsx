import { useEffect, useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { llamarApi, rpc, traducirError } from '../lib/api'
import { useDatos } from '../hooks/useDatos'
import { usePlataforma } from '../hooks/usePlataforma'
import { numeroContacto } from '../lib/enlaces'
import { estadoPago } from '../lib/estadoPago'
import {
  enlaceWhatsapp, fechaDia, formatoFecha, formatoFechaHora, formatoNumero, formatoPesos,
  hace, hoyISO, nombreMes, sumarMeses, urlConProtocolo,
} from '../lib/formato'
import { Aviso, Campo, Confirmar, Copiable, Encabezado, EnlaceApp, InsigniaPago, Seccion } from '../components/ui'
import { IconoWhatsapp } from '../components/Iconos'
import Cargando from '../components/Cargando'

const METODOS_PAGO = ['Efectivo', 'Nequi', 'Bancolombia', 'Bre-B', 'Daviplata', 'Transferencia', 'Otro']
const ESTADOS_PEDIDO = {
  nuevo: 'Nuevos', aprobado: 'Aprobados', en_preparacion: 'En preparación', entregado: 'Entregados', rechazado: 'Rechazados',
}
const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo']
const NOMBRE_DIA = { lunes: 'Lun', martes: 'Mar', miercoles: 'Mié', jueves: 'Jue', viernes: 'Vie', sabado: 'Sáb', domingo: 'Dom' }

const PESTANAS = [
  { clave: 'resumen', texto: 'Resumen' },
  { clave: 'pagos', texto: 'Pagos' },
  { clave: 'usuarios', texto: 'Usuarios' },
  { clave: 'datos', texto: 'Datos' },
]

export default function Negocio() {
  const { id } = useParams()
  const location = useLocation()
  const [parametros, setParametros] = useSearchParams()
  const plataforma = usePlataforma()
  const { datos, cargando, error, recargar } = useDatos(() => rpc('sa_detalle_negocio', { p_negocio_id: id }), id)
  const [aviso, setAviso] = useState(location.state?.aviso || null)
  const [confirmacion, setConfirmacion] = useState(null)

  const pestana = PESTANAS.some((p) => p.clave === parametros.get('pestana')) ? parametros.get('pestana') : 'resumen'
  const irA = (clave) => setParametros(clave === 'resumen' ? {} : { pestana: clave }, { replace: true })

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), aviso.tipo === 'error' ? 12000 : 4000)
    return () => clearTimeout(t)
  }, [aviso])

  if (cargando && !datos) return <Cargando />
  if (error && !datos) return <Aviso tipo="error">{error}</Aviso>
  if (!datos) {
    return (
      <div className="vacio">
        <strong>Este negocio no existe</strong>
        <Link to="/negocios" className="enlace">Volver a la lista</Link>
      </div>
    )
  }

  const { negocio, suscripcion, usuarios } = datos
  // Mismo formato que las filas del resumen, para reutilizar enlaces y mensajes.
  const resumen = {
    ...negocio,
    url_sitio: suscripcion?.url_sitio,
    valor_mensual: suscripcion?.valor_mensual,
    duenos: usuarios.filter((u) => u.rol === 'dueño'),
  }
  const contacto = enlaceWhatsapp(numeroContacto(resumen))

  // Tras cualquier cambio se recarga la ficha y, en silencio, Inicio/Negocios/Cobros.
  const actualizar = () => { recargar({ silencioso: true }); plataforma.recargar({ silencioso: true }) }
  const notificar = (tipo, texto) => setAviso({ tipo, texto })

  async function cambiarActivo() {
    const nuevo = !negocio.activo
    setConfirmacion(null)
    const { error: err } = await supabase.from('negocios').update({ activo: nuevo }).eq('id', negocio.id).select('id').single()
    if (err) return notificar('error', traducirError(err))
    notificar('ok', nuevo ? 'Negocio activado.' : 'Negocio desactivado: su sitio muestra el aviso de inactivo.')
    actualizar()
  }

  return (
    <>
      <Encabezado
        volver={{ a: '/negocios', texto: 'Negocios' }}
        titulo={negocio.nombre}
        sub={<>
          {!negocio.activo && <span className="insignia insignia--neutra">Inactivo</span>}
          <InsigniaPago fecha={negocio.fecha_proximo_pago} />
          {suscripcion?.plan && <span>{suscripcion.plan}{Number(suscripcion.valor_mensual) ? ` · ${formatoPesos(suscripcion.valor_mensual)}/mes` : ''}</span>}
        </>}
        acciones={<>
          {contacto && (
            <a className="boton boton--chico boton--whatsapp" href={contacto} target="_blank" rel="noreferrer"><IconoWhatsapp />WhatsApp</a>
          )}
          {negocio.activo ? (
            <button className="boton boton--chico boton--peligro" onClick={() => setConfirmacion('desactivar')}>Desactivar</button>
          ) : (
            <button className="boton boton--chico boton--exito" onClick={() => setConfirmacion('activar')}>Activar</button>
          )}
        </>}
      />

      {aviso && <div className="aviso-flotante"><Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso></div>}

      <section className="seccion">
        <div className="seccion__cabeza"><h2>App de domicilios</h2></div>
        <div className="seccion__cuerpo">
          <EnlaceApp negocio={resumen} onAgregar={() => irA('datos')} />
        </div>
      </section>

      <nav className="pestanas" role="tablist">
        {PESTANAS.map((p) => (
          <button
            key={p.clave}
            role="tab"
            aria-selected={pestana === p.clave}
            className={`pestana ${pestana === p.clave ? 'pestana--activa' : ''}`}
            onClick={() => irA(p.clave)}
          >
            {p.texto}
            {p.clave === 'pagos' && datos.pagos.length > 0 && <span className="cuenta">{datos.pagos.length}</span>}
            {p.clave === 'usuarios' && <span className="cuenta">{usuarios.length}</span>}
          </button>
        ))}
      </nav>

      {pestana === 'resumen' && (
        <div className="rejilla-detalle">
          <Actividad datos={datos} />
          <div className="columna">
            <Identificacion negocio={negocio} />
            <InfoPublica config={datos.config} />
          </div>
        </div>
      )}
      {pestana === 'pagos' && <Pagos datos={datos} onCambio={actualizar} notificar={notificar} />}
      {pestana === 'usuarios' && <Usuarios datos={datos} onCambio={actualizar} notificar={notificar} />}
      {pestana === 'datos' && (
        <FormularioDatos datos={datos} onGuardado={() => { notificar('ok', 'Cambios guardados.'); actualizar() }} onError={(m) => notificar('error', m)} />
      )}

      <Confirmar
        abierto={!!confirmacion}
        titulo={confirmacion === 'desactivar' ? `¿Desactivar ${negocio.nombre}?` : `¿Activar ${negocio.nombre}?`}
        mensaje={confirmacion === 'desactivar'
          ? 'Su app dejará de mostrar el menú y mostrará el aviso de negocio inactivo hasta que lo vuelvas a activar. No se borra ningún dato.'
          : 'Su app vuelve a mostrar el menú y a recibir pedidos.'}
        textoConfirmar={confirmacion === 'desactivar' ? 'Desactivar' : 'Activar'}
        peligro={confirmacion === 'desactivar'}
        onConfirmar={cambiarActivo}
        onCancelar={() => setConfirmacion(null)}
      />
    </>
  )
}

/* ------------------------------------------------------------------ */

function FormularioDatos({ datos, onGuardado, onError }) {
  const { negocio, suscripcion } = datos
  const inicial = () => ({
    nombre: negocio.nombre || '',
    slug: negocio.slug || '',
    whatsapp_contacto: negocio.whatsapp_contacto || '',
    dominio_propio: negocio.dominio_propio || '',
    fecha_proximo_pago: negocio.fecha_proximo_pago || '',
    plan: suscripcion?.plan || 'Básico',
    valor_mensual: suscripcion?.valor_mensual ?? '',
    url_sitio: suscripcion?.url_sitio || '',
    notas: suscripcion?.notas || '',
  })
  const [form, setForm] = useState(inicial)
  const [guardando, setGuardando] = useState(false)

  // Si los datos se recargan (ej. tras registrar un pago), el formulario toma la fecha nueva.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setForm(inicial()), [datos])

  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function guardar(e) {
    e.preventDefault()
    setGuardando(true)
    try {
      const { error: errNegocio } = await supabase.from('negocios').update({
        nombre: form.nombre.trim(),
        slug: form.slug.trim(),
        whatsapp_contacto: form.whatsapp_contacto.replace(/\D/g, ''),
        dominio_propio: form.dominio_propio.trim() || null,
        fecha_proximo_pago: form.fecha_proximo_pago || null,
      }).eq('id', negocio.id).select('id').single()
      if (errNegocio) throw errNegocio

      const { error: errSus } = await supabase.from('plataforma_suscripciones').upsert({
        negocio_id: negocio.id,
        plan: form.plan.trim() || 'Básico',
        valor_mensual: Number(form.valor_mensual) || 0,
        url_sitio: form.url_sitio.trim() || null,
        notas: form.notas.trim() || null,
        actualizado_en: new Date().toISOString(),
      })
      if (errSus) throw errSus
      onGuardado()
    } catch (err) {
      onError(traducirError(err))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Seccion titulo="Datos del negocio">
      <form className="formulario" onSubmit={guardar}>
        <div className="formulario__fila">
          <Campo etiqueta="Nombre">
            <input className="campo__control" required value={form.nombre} onChange={cambiar('nombre')} />
          </Campo>
          <Campo etiqueta="Slug">
            <input className="campo__control mono" required pattern="[a-z0-9-]+" value={form.slug} onChange={cambiar('slug')} />
          </Campo>
        </div>
        <div className="formulario__fila">
          <Campo etiqueta="WhatsApp de pedidos" ayuda="Con indicativo, sin signos. Ej. 573001234567">
            <input className="campo__control mono" inputMode="numeric" required value={form.whatsapp_contacto} onChange={cambiar('whatsapp_contacto')} />
          </Campo>
          <Campo etiqueta="Próximo pago">
            <input className="campo__control" type="date" value={form.fecha_proximo_pago} onChange={cambiar('fecha_proximo_pago')} />
          </Campo>
        </div>
        <div className="formulario__fila">
          <Campo etiqueta="Plan">
            <input className="campo__control" list="planes" value={form.plan} onChange={cambiar('plan')} />
            <datalist id="planes"><option value="Básico" /><option value="Completo" /><option value="Gratis" /></datalist>
          </Campo>
          <Campo etiqueta="Valor mensual (COP)">
            <input className="campo__control num" type="number" min="0" step="1000" value={form.valor_mensual} onChange={cambiar('valor_mensual')} />
          </Campo>
        </div>
        <div className="formulario__fila">
          <Campo etiqueta="URL del sitio" ayuda="El link de Vercel del negocio">
            <input className="campo__control" placeholder="negocio.vercel.app" value={form.url_sitio} onChange={cambiar('url_sitio')} />
          </Campo>
          <Campo etiqueta="Dominio propio">
            <input className="campo__control" placeholder="www.negocio.com" value={form.dominio_propio} onChange={cambiar('dominio_propio')} />
          </Campo>
        </div>
        <Campo etiqueta="Notas privadas" ayuda="Solo las ves tú: acuerdos, contacto, pendientes.">
          <textarea className="campo__control" value={form.notas} onChange={cambiar('notas')} />
        </Campo>
        <div className="acciones-form">
          <button className="boton boton--primario" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar cambios'}</button>
        </div>
      </form>
    </Seccion>
  )
}

/* ------------------------------------------------------------------ */

function Usuarios({ datos, onCambio, notificar }) {
  const { negocio, usuarios } = datos
  const [creando, setCreando] = useState(false)
  const [restableciendo, setRestableciendo] = useState(null)
  const duenos = usuarios.filter((u) => u.rol === 'dueño').length

  return (
    <Seccion
      titulo="Dueños y usuarios"
      sinRelleno
      extra={<>
        <span className="suave">{duenos} dueño{duenos === 1 ? '' : 's'} · {usuarios.length - duenos} empleado{usuarios.length - duenos === 1 ? '' : 's'}</span>
        {!creando && <button className="boton boton--chico" onClick={() => setCreando(true)}>Agregar dueño</button>}
      </>}
    >
      {creando && (
        <div className="seccion__cuerpo" style={{ borderBottom: '1px solid var(--linea)' }}>
          <FormularioDueno
            negocioId={negocio.id}
            onCancelar={() => setCreando(false)}
            onCreado={() => { setCreando(false); notificar('ok', 'Dueño creado. Ya puede entrar al panel de su negocio con su número y contraseña.'); onCambio() }}
          />
        </div>
      )}

      {usuarios.length === 0 && !creando && (
        <div className="vacio">
          <strong>Sin usuarios</strong>
          Este negocio no tiene dueño todavía: nadie puede entrar a su panel.
        </div>
      )}

      <div className="usuarios">
        {usuarios.map((u) => (
          <div key={u.id} className="usuario">
            <div className="usuario__fila">
              <span className="usuario__nombre">{u.nombre}</span>
              <span className={`insignia ${u.rol === 'dueño' ? 'insignia--info' : 'insignia--neutra'}`}>{u.rol === 'dueño' ? 'Dueño' : 'Empleado'}</span>
              {!u.activo && <span className="insignia insignia--error">Desactivado</span>}
            </div>
            <div className="usuario__meta">
              {enlaceWhatsapp(u.numero)
                ? <a className="mono" href={enlaceWhatsapp(u.numero)} target="_blank" rel="noreferrer">{u.numero}</a>
                : <span className="mono">{u.numero}</span>}
              <span title={formatoFechaHora(u.ultimo_acceso)}>Último acceso: {hace(u.ultimo_acceso)}</span>
              <span>Desde {formatoFecha(u.creado_en)}</span>
            </div>
            {restableciendo === u.id ? (
              <FormularioContrasena
                usuario={u}
                onCancelar={() => setRestableciendo(null)}
                onListo={() => { setRestableciendo(null); notificar('ok', `Contraseña de ${u.nombre} cambiada. Envíasela por un medio seguro.`) }}
              />
            ) : (
              <div>
                <button
                  className="boton boton--chico"
                  disabled={!u.auth_id}
                  title={u.auth_id ? undefined : 'No se encontró su cuenta de acceso'}
                  onClick={() => setRestableciendo(u.id)}
                >
                  Restablecer contraseña
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Seccion>
  )
}

function FormularioDueno({ negocioId, onCancelar, onCreado }) {
  const [form, setForm] = useState({ nombre: '', numero: '', contrasena: '' })
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }))

  async function crear(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await llamarApi('crear-dueno', { negocioId, ...form })
      onCreado()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={crear}>
      <div className="formulario__fila">
        <Campo etiqueta="Nombre del dueño">
          <input className="campo__control" required value={form.nombre} onChange={cambiar('nombre')} autoFocus />
        </Campo>
        <Campo etiqueta="Número (usuario de login)">
          <input className="campo__control mono" inputMode="numeric" required minLength={7} placeholder="3001234567" value={form.numero} onChange={cambiar('numero')} />
        </Campo>
      </div>
      <Campo etiqueta="Contraseña inicial" ayuda="Mínimo 6 caracteres. El dueño puede cambiarla luego desde su panel.">
        <input className="campo__control" required minLength={6} value={form.contrasena} onChange={cambiar('contrasena')} autoComplete="new-password" />
      </Campo>
      <Aviso tipo="error">{error}</Aviso>
      <div className="acciones-form">
        <button type="button" className="boton" onClick={onCancelar}>Cancelar</button>
        <button className="boton boton--primario" disabled={enviando}>{enviando ? 'Creando…' : 'Crear dueño'}</button>
      </div>
    </form>
  )
}

function FormularioContrasena({ usuario, onCancelar, onListo }) {
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  async function guardar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await llamarApi('restablecer-contrasena', { authId: usuario.auth_id, contrasena })
      onListo()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={guardar} style={{ marginTop: 4 }}>
      <Campo etiqueta={`Nueva contraseña para ${usuario.nombre}`}>
        <input className="campo__control" required minLength={6} value={contrasena} onChange={(e) => setContrasena(e.target.value)} autoFocus autoComplete="new-password" />
      </Campo>
      <Aviso tipo="error">{error}</Aviso>
      <div className="acciones-form">
        <button type="button" className="boton boton--chico" onClick={onCancelar}>Cancelar</button>
        <button className="boton boton--primario boton--chico" disabled={enviando}>{enviando ? 'Guardando…' : 'Cambiar contraseña'}</button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function Pagos({ datos, onCambio, notificar }) {
  const { negocio, suscripcion, pagos } = datos
  const [registrando, setRegistrando] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const totalPagado = pagos.reduce((s, p) => s + Number(p.monto), 0)

  async function eliminar() {
    const pago = eliminando
    setEliminando(null)
    const { error } = await supabase.from('plataforma_pagos').delete().eq('id', pago.id)
    if (error) return notificar('error', traducirError(error))
    notificar('ok', 'Pago eliminado. Si hace falta, corrige a mano la fecha de próximo pago.')
    onCambio()
  }

  return (
    <Seccion
      titulo="Pagos"
      sinRelleno
      extra={!registrando && <button className="boton boton--primario boton--chico" onClick={() => setRegistrando(true)}>Registrar pago</button>}
    >
      <div className="mini-stats" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
        <div><strong>{formatoPesos(totalPagado)}</strong><span>Total pagado · {pagos.length} pago{pagos.length === 1 ? '' : 's'}</span></div>
        <div><strong>{negocio.fecha_proximo_pago ? formatoFecha(negocio.fecha_proximo_pago) : '—'}</strong><span>Próximo pago</span></div>
      </div>

      {registrando && (
        <div className="seccion__cuerpo" style={{ borderBottom: '1px solid var(--linea)' }}>
          <FormularioPago
            negocio={negocio}
            valorMensual={suscripcion?.valor_mensual}
            onCancelar={() => setRegistrando(false)}
            onRegistrado={() => { setRegistrando(false); notificar('ok', 'Pago registrado y fecha de próximo pago actualizada.'); onCambio() }}
          />
        </div>
      )}

      {pagos.length === 0 ? (
        !registrando && <div className="vacio" style={{ padding: '24px 16px' }}>Sin pagos registrados.</div>
      ) : (
        <div className="pagos">
          {pagos.map((p) => (
            <div key={p.id} className="pago">
              <div>
                <div className="pago__monto">{formatoPesos(p.monto)}</div>
                <div className="pago__meta">
                  {formatoFecha(p.fecha_pago)} · {p.meses} mes{p.meses === 1 ? '' : 'es'}{p.metodo ? ` · ${p.metodo}` : ''}
                </div>
                {p.nota && <div className="pago__meta">{p.nota}</div>}
              </div>
              <button className="boton boton--fantasma boton--chico" onClick={() => setEliminando(p)} aria-label="Eliminar pago">Eliminar</button>
            </div>
          ))}
        </div>
      )}

      <Confirmar
        abierto={!!eliminando}
        titulo="¿Eliminar este pago?"
        mensaje={eliminando ? `${formatoPesos(eliminando.monto)} del ${formatoFecha(eliminando.fecha_pago)}. La fecha de próximo pago no se devuelve sola.` : ''}
        textoConfirmar="Eliminar"
        peligro
        onConfirmar={eliminar}
        onCancelar={() => setEliminando(null)}
      />
    </Seccion>
  )
}

// La nueva fecha sugerida parte del próximo pago pendiente (así un pago atrasado
// cubre el mes que se debía). Si el negocio lleva más de un mes vencido o no tiene
// fecha, parte del día del pago. Siempre se puede corregir a mano.
function baseParaNuevaFecha(fechaProximo, fechaPago) {
  if (!fechaProximo) return fechaPago
  const atraso = (fechaDia(fechaPago) - fechaDia(fechaProximo)) / 86400000
  return atraso > 31 ? fechaPago : fechaProximo
}

function FormularioPago({ negocio, valorMensual, onCancelar, onRegistrado }) {
  const [form, setForm] = useState(() => {
    const fecha = hoyISO()
    return {
      monto: valorMensual ? String(Number(valorMensual)) : '',
      fecha_pago: fecha,
      meses: '1',
      metodo: 'Nequi',
      nota: '',
      nueva_fecha: sumarMeses(baseParaNuevaFecha(negocio.fecha_proximo_pago, fecha), 1),
      activar: true,
    }
  })
  const [fechaEditada, setFechaEditada] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState(null)

  function cambiar(campo, valor) {
    setForm((f) => {
      const nuevo = { ...f, [campo]: valor }
      if (!fechaEditada && (campo === 'meses' || campo === 'fecha_pago')) {
        const base = baseParaNuevaFecha(negocio.fecha_proximo_pago, nuevo.fecha_pago)
        nuevo.nueva_fecha = sumarMeses(base, Math.max(1, Number(nuevo.meses) || 1))
        if (campo === 'meses' && valorMensual) nuevo.monto = String(Number(valorMensual) * (Number(valor) || 1))
      }
      return nuevo
    })
  }

  async function registrar(e) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    try {
      await rpc('sa_registrar_pago', {
        p_negocio_id: negocio.id,
        p_monto: Number(form.monto),
        p_fecha_pago: form.fecha_pago,
        p_meses: Number(form.meses),
        p_metodo: form.metodo,
        p_nota: form.nota,
        p_nueva_fecha: form.nueva_fecha,
        p_activar: form.activar,
      })
      onRegistrado()
    } catch (err) {
      setError(err.message)
      setEnviando(false)
    }
  }

  const estadoNuevo = estadoPago(form.nueva_fecha)

  return (
    <form className="formulario" onSubmit={registrar}>
      <div className="formulario__fila">
        <Campo etiqueta="Monto (COP)">
          <input className="campo__control num" type="number" min="0" step="1000" required value={form.monto} onChange={(e) => cambiar('monto', e.target.value)} autoFocus />
        </Campo>
        <Campo etiqueta="Fecha del pago">
          <input className="campo__control" type="date" required value={form.fecha_pago} onChange={(e) => cambiar('fecha_pago', e.target.value)} />
        </Campo>
      </div>
      <div className="formulario__fila">
        <Campo etiqueta="Meses que cubre">
          <input className="campo__control num" type="number" min="1" max="24" required value={form.meses} onChange={(e) => cambiar('meses', e.target.value)} />
        </Campo>
        <Campo etiqueta="Método">
          <select className="campo__control" value={form.metodo} onChange={(e) => cambiar('metodo', e.target.value)}>
            {METODOS_PAGO.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Campo>
      </div>
      <Campo etiqueta="Nuevo próximo pago" ayuda={`Calculado automáticamente; puedes cambiarlo. Quedará: ${estadoNuevo.texto.toLowerCase()}.`}>
        <input
          className="campo__control"
          type="date"
          required
          value={form.nueva_fecha}
          onChange={(e) => { setFechaEditada(true); setForm((f) => ({ ...f, nueva_fecha: e.target.value })) }}
        />
      </Campo>
      <Campo etiqueta="Nota (opcional)">
        <input className="campo__control" value={form.nota} onChange={(e) => cambiar('nota', e.target.value)} placeholder="Ej. referencia de la transferencia" />
      </Campo>
      {!negocio.activo && (
        <label className="casilla">
          <input type="checkbox" checked={form.activar} onChange={(e) => setForm((f) => ({ ...f, activar: e.target.checked }))} />
          <span>Activar el negocio al registrar el pago</span>
        </label>
      )}
      <Aviso tipo="error">{error}</Aviso>
      <div className="acciones-form">
        <button type="button" className="boton" onClick={onCancelar}>Cancelar</button>
        <button className="boton boton--primario" disabled={enviando}>{enviando ? 'Registrando…' : 'Registrar pago'}</button>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function Actividad({ datos }) {
  const { catalogo, pedidos } = datos
  const porMes = pedidos.por_mes || []
  const maximo = Math.max(1, ...porMes.map((m) => m.pedidos))

  return (
    <Seccion titulo="Actividad" sinRelleno extra={<span className="suave">Último pedido: {hace(pedidos.ultimo)}</span>}>
      <div className="mini-stats">
        <div><strong>{formatoNumero(pedidos.total)}</strong><span>Pedidos totales</span></div>
        <div><strong>{formatoPesos(pedidos.ventas_total)}</strong><span>Ventas totales</span></div>
        <div><strong>{formatoNumero(catalogo.productos)}</strong><span>Productos · {catalogo.productos_disponibles} disponibles</span></div>
        <div><strong>{formatoNumero(catalogo.categorias)}</strong><span>Categorías</span></div>
        <div><strong>{formatoNumero(catalogo.adiciones)}</strong><span>Adiciones</span></div>
        <div><strong>{formatoNumero(catalogo.ofertas_activas)}</strong><span>Ofertas activas</span></div>
      </div>
      <div className="seccion__cuerpo">
        <div className="campo__etiqueta">Pedidos por mes</div>
        <div className="barras">
          {porMes.map((m) => (
            <div key={m.mes} className="barras__col" title={`${m.pedidos} pedidos · ${formatoPesos(m.ventas)}`}>
              <div className="barras__pista">
                <div
                  className={`barras__barra ${m.pedidos ? '' : 'barras__barra--vacia'}`}
                  style={{ height: `${(m.pedidos / maximo) * 100}%` }}
                >
                  <span className="barras__valor">{m.pedidos}</span>
                </div>
              </div>
              <div className="barras__mes">{nombreMes(m.mes)}</div>
            </div>
          ))}
        </div>
        {Object.keys(pedidos.por_estado || {}).length > 0 && (
          <div className="estados" style={{ marginTop: 16 }}>
            {Object.entries(pedidos.por_estado).map(([estado, cantidad]) => (
              <span key={estado} className="insignia insignia--neutra">{ESTADOS_PEDIDO[estado] || estado}: {cantidad}</span>
            ))}
          </div>
        )}
      </div>
    </Seccion>
  )
}

function Identificacion({ negocio }) {
  const sitio = urlConProtocolo(negocio.dominio_propio)
  return (
    <Seccion titulo="Identificación">
      <div className="formulario">
        <Campo etiqueta="ID del negocio" ayuda="Es el negocioId de src/config/negocio.config.js en el proyecto del negocio.">
          <Copiable texto={negocio.id} />
        </Campo>
        <dl className="datos">
          <div><dt>Slug</dt><dd className="mono">{negocio.slug}</dd></div>
          <div>
            <dt>WhatsApp</dt>
            <dd>{enlaceWhatsapp(negocio.whatsapp_contacto)
              ? <a className="mono" href={enlaceWhatsapp(negocio.whatsapp_contacto)} target="_blank" rel="noreferrer">{negocio.whatsapp_contacto}</a>
              : '—'}</dd>
          </div>
          <div><dt>Dominio propio</dt><dd>{sitio ? <a href={sitio} target="_blank" rel="noreferrer">{negocio.dominio_propio}</a> : '—'}</dd></div>
        </dl>
      </div>
    </Seccion>
  )
}

function InfoPublica({ config }) {
  if (!config) {
    return (
      <Seccion titulo="Información pública">
        <p className="suave">El dueño todavía no ha llenado "Sobre nosotros" en su panel.</p>
      </Seccion>
    )
  }
  const redes = Object.entries(config.redes_sociales || {}).filter(([, url]) => url)
  const horario = config.horario || {}

  return (
    <Seccion titulo="Información pública" extra={<span className="suave">Editada {hace(config.actualizado_en)}</span>}>
      <dl className="datos">
        <div><dt>Descripción</dt><dd>{config.descripcion || '—'}</dd></div>
        <div><dt>Dirección</dt><dd>{config.direccion || '—'}</dd></div>
        <div>
          <dt>Horario</dt>
          <dd>
            {DIAS.some((d) => horario[d]) ? DIAS.map((d) => (
              <div key={d} className="num" style={{ fontSize: 13 }}>
                <span className="suave" style={{ display: 'inline-block', width: 36 }}>{NOMBRE_DIA[d]}</span>
                {horario[d] ? `${horario[d].abre} – ${horario[d].cierra}` : 'Cerrado'}
              </div>
            )) : '—'}
          </dd>
        </div>
        <div>
          <dt>Redes</dt>
          <dd>
            {redes.length ? redes.map(([red, url]) => (
              <div key={red}><a href={urlConProtocolo(url)} target="_blank" rel="noreferrer" style={{ textTransform: 'capitalize' }}>{red}</a></div>
            )) : '—'}
          </dd>
        </div>
      </dl>
    </Seccion>
  )
}
