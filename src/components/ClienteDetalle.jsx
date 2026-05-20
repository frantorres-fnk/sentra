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
  })

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('clientes').update(form).eq('id', cliente.id)
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
    if (!error) {
      setConfirmarBloqueo(false)
      onActualizado()
    }
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

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
            <button
              onClick={handleEmail}
              disabled={!cliente.email}
              title={cliente.email || 'Sin email cargado'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ✉️ Email
            </button>
            <button
              onClick={handleWhatsApp}
              disabled={!cliente.telefono}
              title={cliente.telefono || 'Sin teléfono cargado'}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
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
                  <button
                    onClick={handleDesbloquear}
                    className="text-xs text-red-500 hover:text-red-700 underline"
                  >
                    Desbloquear
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {!confirmarBloqueo ? (
                  <button
                    onClick={() => setConfirmarBloqueo(true)}
                    className="w-full text-xs text-red-400 hover:text-red-600 py-2 border border-dashed border-red-200 rounded-lg hover:border-red-400 transition-colors"
                  >
                    🔒 Bloquear cuenta por moroso
                  </button>
                ) : (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-600">¿Bloquear esta cuenta?</p>
                    <input
                      value={motivoTemp}
                      onChange={(e) => setMotivoTemp(e.target.value)}
                      placeholder="Motivo (ej: Moroso, Cheque rechazado...)"
                      className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmarBloqueo(false)}
                        className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-xs hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleBloquear}
                        className="flex-1 bg-red-500 text-white rounded-lg py-2 text-xs font-medium hover:bg-red-600 transition-colors"
                      >
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