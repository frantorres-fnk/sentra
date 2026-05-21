import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ClienteDetalle = ({ cliente, onClose, onActualizado }) => {
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [confirmarBloqueo, setConfirmarBloqueo] = useState(false)
  const [motivoTemp, setMotivoTemp] = useState('')

  const [form, setForm] = useState({
    razon_social: cliente.razon_social || '',
    nombre_fantasia: cliente.nombre_fantasia || '',
    cuit: cliente.cuit || '',
    condicion_afip: cliente.condicion_afip || 'responsable_inscripto',
    email: cliente.email || '',
    telefono: cliente.telefono || '',
    direccion: cliente.direccion || '',
    provincia: cliente.provincia || '',
    codigo_postal: cliente.codigo_postal || '',
    zona: cliente.zona || '',
    activo: cliente.activo ?? true,
    bloqueado: cliente.bloqueado ?? false,
    motivo_bloqueo: cliente.motivo_bloqueo || '',
    lista_precio: cliente.lista_precio || 1,
    descuento_cascada: cliente.descuento_cascada || '',
  })

  // Descuentos en cascada
  const [escalones, setEscalones] = useState(() => {
    if (cliente.descuento_cascada) {
      const partes = cliente.descuento_cascada.split('+')
      return [...partes, '', '', '', ''].slice(0, 4)
    }
    return ['', '', '', '']
  })

  const calcularDescuentoReal = (escalones) => {
    let precio = 100
    escalones.forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) {
        precio = precio * (1 - val / 100)
      }
    })
    return (100 - precio).toFixed(2)
  }

  const descuentoReal = calcularDescuentoReal(escalones)
  const tieneDescuento = escalones.some(e => parseFloat(e) > 0)
  const cascadaString = escalones.filter(e => parseFloat(e) > 0).join('+')

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleEscalonChange = (index, value) => {
    const nuevos = [...escalones]
    nuevos[index] = value
    setEscalones(nuevos)
    setForm({ ...form, descuento_cascada: nuevos.filter(e => parseFloat(e) > 0).join('+') })
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('clientes').update({
      ...form,
      descuento_cascada: cascadaString,
    }).eq('id', cliente.id)
    if (error) {
      setError('Error al actualizar el cliente.')
      setLoading(false)
    } else {
      onActualizado()
      setEditando(false)
      setLoading(false)
    }
  }

  const handleBloquear = async () => {
    const { error } = await supabase
      .from('clientes')
      .update({ bloqueado: true, motivo_bloqueo: motivoTemp || 'Moroso' })
      .eq('id', cliente.id)
    if (!error) { setConfirmarBloqueo(false); onActualizado() }
  }

  const handleDesbloquear = async () => {
    const { error } = await supabase
      .from('clientes')
      .update({ bloqueado: false, motivo_bloqueo: '' })
      .eq('id', cliente.id)
    if (!error) onActualizado()
  }

  const handleWhatsApp = () => {
    if (!cliente.telefono) return
    const tel = cliente.telefono.replace(/\D/g, '')
    const numero = tel.startsWith('0') ? '54' + tel.slice(1) : tel.startsWith('54') ? tel : '54' + tel
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  const handleEmail = () => {
    if (!cliente.email) return
    window.open(`mailto:${cliente.email}?subject=SENTRA - ${cliente.razon_social}`, '_blank')
  }

  const condicionLabel = {
    responsable_inscripto: 'Resp. Inscripto',
    monotributista: 'Monotributista',
    consumidor_final: 'Cons. Final',
    exento: 'Exento',
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const Campo = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-[#0F1F3D] mt-1">{value || '-'}</p>
    </div>
  )

  // Descuento cascada display
  const cascadaActual = cliente.descuento_cascada
  const descuentoActual = cascadaActual ? calcularDescuentoReal(cascadaActual.split('+')) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                #{cliente.numero_cliente}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${cliente.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                {cliente.activo ? 'Activo' : 'Inactivo'}
              </span>
              {cliente.bloqueado && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                  🔒 Bloqueado
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-[#0F1F3D] mt-1">
              {editando ? 'Editar cliente' : cliente.razon_social}
            </h3>
            {cliente.nombre_fantasia && !editando && (
              <p className="text-sm text-[#00C896] font-medium">{cliente.nombre_fantasia}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!editando && (
          <div className="flex gap-2 mb-5 mt-3">
            <button onClick={handleEmail} disabled={!cliente.email}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ✉️ Email
            </button>
            <button onClick={handleWhatsApp} disabled={!cliente.telefono}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              💬 WhatsApp
            </button>
          </div>
        )}

        {!editando ? (
          <div className="space-y-5">

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Datos fiscales</p>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Razón social" value={cliente.razon_social} />
                <Campo label="Nombre fantasía" value={cliente.nombre_fantasia} />
                <Campo label="CUIT" value={cliente.cuit} />
                <Campo label="Condición AFIP" value={condicionLabel[cliente.condicion_afip]} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Contacto</p>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Email" value={cliente.email} />
                <Campo label="Teléfono" value={cliente.telefono} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Dirección y envíos</p>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Dirección" value={cliente.direccion} />
                <Campo label="Provincia" value={cliente.provincia} />
                <Campo label="Código postal" value={cliente.codigo_postal} />
                <Campo label="Zona de reparto" value={cliente.zona} />
              </div>
            </div>

            {/* Precios y descuentos */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Condiciones comerciales</p>
              <div className="space-y-2">
                <div className={`rounded-xl p-3 flex justify-between items-center ${cliente.lista_precio === 2 ? 'bg-green-50' : 'bg-blue-50'}`}>
                  <div>
                    <p className={`text-xs font-semibold ${cliente.lista_precio === 2 ? 'text-green-600' : 'text-blue-600'}`}>
                      Lista {cliente.lista_precio || 1}
                    </p>
                    <p className={`text-xs ${cliente.lista_precio === 2 ? 'text-green-400' : 'text-blue-400'}`}>
                      {cliente.lista_precio === 2 ? 'Precios mayoristas' : 'Precios mostrador'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${cliente.lista_precio === 2 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    Lista {cliente.lista_precio || 1}
                  </span>
                </div>

                {cascadaActual ? (
                  <div className="bg-orange-50 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-orange-600">Descuento en cascada</p>
                        <p className="text-xs text-orange-400 font-mono">{cascadaActual.replace(/\+/g, ' + ')}%</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-orange-700">{descuentoActual}%</p>
                        <p className="text-xs text-orange-400">descuento real</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">Sin descuento especial — precio de lista</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Cuenta corriente</p>
              <div className="grid grid-cols-2 gap-4">
                <Campo label="Saldo CC" value={`$${Number(cliente.saldo_cc || 0).toLocaleString('es-AR')}`} />
              </div>
            </div>

            {/* Bloqueo */}
            {cliente.bloqueado ? (
              <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-semibold text-red-600">🔒 Cuenta bloqueada</p>
                    <p className="text-xs text-red-400 mt-0.5">Motivo: {cliente.motivo_bloqueo || 'Sin especificar'}</p>
                  </div>
                  <button onClick={handleDesbloquear} className="text-xs text-red-500 hover:text-red-700 underline">
                    Desbloquear
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {!confirmarBloqueo ? (
                  <button onClick={() => setConfirmarBloqueo(true)}
                    className="w-full text-xs text-red-400 hover:text-red-600 py-2 border border-dashed border-red-200 rounded-lg hover:border-red-400 transition-colors">
                    🔒 Bloquear cuenta por moroso
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-600">¿Bloquear esta cuenta?</p>
                    <input value={motivoTemp} onChange={(e) => setMotivoTemp(e.target.value)}
                      placeholder="Motivo (ej: Moroso, Cheque rechazado...)"
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300" />
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmarBloqueo(false)}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-xs hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleBloquear}
                        className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-red-600 transition-colors">
                        Confirmar bloqueo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
              <button onClick={() => setEditando(true)} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors">
                Editar
              </button>
            </div>
          </div>

        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">

            <div>
              <label className={labelClass}>Razón social *</label>
              <input name="razon_social" value={form.razon_social} onChange={handleChange} className={inputClass} required />
            </div>

            <div>
              <label className={labelClass}>Nombre fantasía</label>
              <input name="nombre_fantasia" value={form.nombre_fantasia} onChange={handleChange} placeholder="Como lo conocen en el mercado" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>CUIT</label>
                <input name="cuit" value={form.cuit} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Condición AFIP</label>
                <select name="condicion_afip" value={form.condicion_afip} onChange={handleChange} className={inputClass}>
                  <option value="responsable_inscripto">Responsable Inscripto</option>
                  <option value="monotributista">Monotributista</option>
                  <option value="consumidor_final">Consumidor Final</option>
                  <option value="exento">Exento</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Para envío de facturas" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input name="telefono" value={form.telefono} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, número, piso/depto" className={inputClass} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Provincia</label>
                <select name="provincia" value={form.provincia} onChange={handleChange} className={inputClass}>
                  <option value="">Seleccionar...</option>
                  <option value="Buenos Aires">Buenos Aires</option>
                  <option value="CABA">CABA</option>
                  <option value="Catamarca">Catamarca</option>
                  <option value="Chaco">Chaco</option>
                  <option value="Chubut">Chubut</option>
                  <option value="Córdoba">Córdoba</option>
                  <option value="Corrientes">Corrientes</option>
                  <option value="Entre Ríos">Entre Ríos</option>
                  <option value="Formosa">Formosa</option>
                  <option value="Jujuy">Jujuy</option>
                  <option value="La Pampa">La Pampa</option>
                  <option value="La Rioja">La Rioja</option>
                  <option value="Mendoza">Mendoza</option>
                  <option value="Misiones">Misiones</option>
                  <option value="Neuquén">Neuquén</option>
                  <option value="Río Negro">Río Negro</option>
                  <option value="Salta">Salta</option>
                  <option value="San Juan">San Juan</option>
                  <option value="San Luis">San Luis</option>
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="Santa Fe">Santa Fe</option>
                  <option value="Santiago del Estero">Santiago del Estero</option>
                  <option value="Tierra del Fuego">Tierra del Fuego</option>
                  <option value="Tucumán">Tucumán</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Código postal</label>
                <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} placeholder="Ej: 1706" className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Zona de reparto</label>
              <input name="zona" value={form.zona} onChange={handleChange} placeholder="Ej: Norte, Centro, Sur, Haedo" className={inputClass} />
            </div>

            {/* Condiciones comerciales */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Condiciones comerciales</p>

              <div className="mb-4">
                <label className={labelClass}>Lista de precios</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, lista_precio: 1 })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.lista_precio === 1 || form.lista_precio === '1'
                        ? 'border-blue-400 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    📋 Lista 1
                    <p className="text-xs font-normal mt-0.5">Mostrador</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, lista_precio: 2 })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                      form.lista_precio === 2 || form.lista_precio === '2'
                        ? 'border-green-400 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-500'
                    }`}
                  >
                    🏷️ Lista 2
                    <p className="text-xs font-normal mt-0.5">Mayorista</p>
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>Descuentos en cascada</label>
                <p className="text-xs text-gray-400 mb-2">Ingresá hasta 4 escalones de descuento</p>
                <div className="flex gap-2 items-center">
                  {escalones.map((e, i) => (
                    <div key={i} className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        value={e}
                        onChange={(ev) => handleEscalonChange(i, ev.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                      />
                      {i < 3 && <span className="text-gray-400 text-sm shrink-0">+</span>}
                    </div>
                  ))}
                  <span className="text-gray-400 text-sm shrink-0">%</span>
                </div>

                {tieneDescuento && (
                  <div className="mt-3 bg-orange-50 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold text-orange-600">Descuento real aplicado</p>
                        <p className="text-xs text-orange-400 font-mono">
                          {escalones.filter(e => parseFloat(e) > 0).map(e => e + '%').join(' → ')}
                        </p>
                      </div>
                      <p className="text-xl font-bold text-orange-700">{descuentoReal}%</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="activo" id="activo" checked={form.activo} onChange={handleChange} className="w-4 h-4 accent-[#00C896]" />
              <label htmlFor="activo" className="text-sm text-gray-700">Cliente activo</label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setEditando(false)} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ClienteDetalle