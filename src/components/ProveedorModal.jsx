import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ProveedorModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [escalones, setEscalones] = useState(['', '', '', ''])
  const [form, setForm] = useState({
    razon_social: '',
    cuit: '',
    condicion_afip: 'responsable_inscripto',
    email: '',
    telefono: '',
    direccion: '',
    descuento_cascada: '',
    plazo_pago: 30,
    contacto_nombre: '',
    banco: '',
    cbu: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEscalonChange = (index, value) => {
    const nuevos = [...escalones]
    nuevos[index] = value
    setEscalones(nuevos)
    setForm({ ...form, descuento_cascada: nuevos.filter(e => parseFloat(e) > 0).join('+') })
  }

  const calcularDescuentoReal = (escalones) => {
    let precio = 100
    escalones.forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) precio = precio * (1 - val / 100)
    })
    return (100 - precio).toFixed(2)
  }

  const tieneDescuento = escalones.some(e => parseFloat(e) > 0)
  const descuentoReal = calcularDescuentoReal(escalones)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) {
      setError('No se encontró la empresa.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('proveedores')
      .insert([{ ...form, empresa_id: usuarioData.empresa_id }])

    if (error) {
      setError('Error al guardar el proveedor.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo proveedor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Datos fiscales */}
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
                  <input name="cuit" value={form.cuit} onChange={handleChange} placeholder="30-12345678-9" className={inputClass} />
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

          {/* Contacto */}
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

          {/* Datos de pago */}
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

          {/* Descuentos en cascada */}
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProveedorModal