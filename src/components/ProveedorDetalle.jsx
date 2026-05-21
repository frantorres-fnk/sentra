import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ProveedorDetalle = ({ proveedor, onClose, onActualizado }) => {
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [escalones, setEscalones] = useState(() => {
    if (proveedor.descuento_cascada) {
      const partes = proveedor.descuento_cascada.split('+')
      return [...partes, '', '', '', ''].slice(0, 4)
    }
    return ['', '', '', '']
  })

  const [form, setForm] = useState({
    razon_social: proveedor.razon_social || '',
    cuit: proveedor.cuit || '',
    condicion_afip: proveedor.condicion_afip || 'responsable_inscripto',
    email: proveedor.email || '',
    telefono: proveedor.telefono || '',
    direccion: proveedor.direccion || '',
    activo: proveedor.activo ?? true,
    descuento_cascada: proveedor.descuento_cascada || '',
    plazo_pago: proveedor.plazo_pago || 30,
    contacto_nombre: proveedor.contacto_nombre || '',
    banco: proveedor.banco || '',
    cbu: proveedor.cbu || '',
  })

  const calcularDescuentoReal = (escalones) => {
    let precio = 100
    escalones.forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) precio = precio * (1 - val / 100)
    })
    return (100 - precio).toFixed(2)
  }

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

  const tieneDescuento = escalones.some(e => parseFloat(e) > 0)
  const descuentoReal = calcularDescuentoReal(escalones)

  const handleGuardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.from('proveedores').update(form).eq('id', proveedor.id)
    if (error) {
      setError('Error al actualizar el proveedor.')
      setLoading(false)
    } else {
      onActualizado()
      setEditando(false)
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    if (!proveedor.telefono) return
    const tel = proveedor.telefono.replace(/\D/g, '')
    const numero = tel.startsWith('0') ? '54' + tel.slice(1) : tel.startsWith('54') ? tel : '54' + tel
    window.open(`https://wa.me/${numero}`, '_blank')
  }

  const handleEmail = () => {
    if (!proveedor.email) return
    window.open(`mailto:${proveedor.email}?subject=SENTRA - ${proveedor.razon_social}`, '_blank')
  }

  const condicionLabel = {
    responsable_inscripto: 'Resp. Inscripto',
    monotributista: 'Monotributista',
    exento: 'Exento',
  }

  const plazoLabel = {
    0: 'Contado', 7: '7 días', 15: '15 días',
    30: '30 días', 45: '45 días', 60: '60 días', 90: '90 días'
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const Campo = ({ label, value }) => (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-[#0F1F3D] mt-1">{value || '-'}</p>
    </div>
  )

  const cascadaActual = proveedor.descuento_cascada
  const descuentoActual = cascadaActual ? calcularDescuentoReal(cascadaActual.split('+')) : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="text-lg font-bold text-[#0F1F3D]">
              {editando ? 'Editar proveedor' : proveedor.razon_social}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full ${proveedor.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
              {proveedor.activo ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!editando && (
          <div className="flex gap-2 mb-5 mt-3">
            <button onClick={handleEmail} disabled={!proveedor.email}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              ✉️ Email
            </button>
            <button onClick={handleWhatsApp} disabled={!proveedor.telefono}
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
                <Campo label="Razón social" value={proveedor.razon_social} />
                <Campo label="CUIT" value={proveedor.cuit} />
                <Campo label="Condición AFIP" value={condicionLabel[proveedor.condicion_afip]} />
                <Campo label="Saldo CC" value={`$${Number(proveedor.saldo_cc || 0).toLocaleString('es-AR')}`} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Contacto</p>
              <div className="grid grid-cols-2 gap-4">
                {proveedor.contacto_nombre && <Campo label="Contacto comercial" value={proveedor.contacto_nombre} />}
                <Campo label="Email" value={proveedor.email} />
                <Campo label="Teléfono" value={proveedor.telefono} />
                <Campo label="Dirección" value={proveedor.direccion} />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Datos de pago</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-3 col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">Plazo de pago</p>
                    <p className="text-xs text-blue-400">Días para pagar facturas</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">{plazoLabel[proveedor.plazo_pago] || '30 días'}</p>
                </div>
                {proveedor.banco && <Campo label="Banco" value={proveedor.banco} />}
                {proveedor.cbu && <Campo label="CBU" value={proveedor.cbu} />}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Condiciones de compra</p>
              {cascadaActual ? (
                <div className="bg-purple-50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-purple-600">Descuento de compra en cascada</p>
                      <p className="text-xs text-purple-400 font-mono">{cascadaActual.replace(/\+/g, ' + ')}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-purple-700">{descuentoActual}%</p>
                      <p className="text-xs text-purple-400">descuento real</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400">Sin descuento especial cargado</p>
                </div>
              )}
            </div>

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
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Datos fiscales</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Razón social *</label>
                  <input name="razon_social" value={form.razon_social} onChange={handleChange} className={inputClass} required />
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
                      <option value="exento">Exento</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Contacto</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Nombre del contacto comercial</label>
                  <input name="contacto_nombre" value={form.contacto_nombre} onChange={handleChange} placeholder="Ej: Juan García" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input name="email" type="email" value={form.email} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono</label>
                    <input name="telefono" value={form.telefono} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Dirección</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Datos de pago</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Plazo de pago</label>
                  <select name="plazo_pago" value={form.plazo_pago} onChange={handleChange} className={inputClass}>
                    <option value={0}>Contado</option>
                    <option value={7}>7 días</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                    <option value={45}>45 días</option>
                    <option value={60}>60 días</option>
                    <option value={90}>90 días</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Banco</label>
                  <input name="banco" value={form.banco} onChange={handleChange} placeholder="Ej: Banco Galicia" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>CBU</label>
                  <input name="cbu" value={form.cbu} onChange={handleChange} placeholder="22 dígitos" className={inputClass} />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Condiciones de compra</p>
              <label className={labelClass}>Descuentos de compra en cascada</label>
              <p className="text-xs text-gray-400 mb-2">Descuentos que este proveedor nos otorga</p>
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
                <div className="mt-3 bg-purple-50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-purple-600">Descuento real de compra</p>
                      <p className="text-xs text-purple-400 font-mono">
                        {escalones.filter(e => parseFloat(e) > 0).map(e => e + '%').join(' → ')}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-purple-700">{descuentoReal}%</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" name="activo" id="activo" checked={form.activo} onChange={handleChange} className="w-4 h-4 accent-[#00C896]" />
              <label htmlFor="activo" className="text-sm text-gray-700">Proveedor activo</label>
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

export default ProveedorDetalle