import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ClienteModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    razon_social: '',
    nombre_fantasia: '',
    cuit: '',
    condicion_afip: 'responsable_inscripto',
    email: '',
    telefono: '',
    direccion: '',
    provincia: '',
    codigo_postal: '',
    zona: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuarioData) {
      setError('No se encontró la empresa asociada a tu usuario.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('clientes')
      .insert([{ ...form, empresa_id: usuarioData.empresa_id }])

    if (error) {
      setError('Error al guardar el cliente. Intentá de nuevo.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

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
              <input name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" className={inputClass} />
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
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="11-1234-5678" className={inputClass} />
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

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClienteModal