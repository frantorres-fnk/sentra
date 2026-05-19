import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ProveedorModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    razon_social: '',
    cuit: '',
    condicion_afip: 'responsable_inscripto',
    email: '',
    telefono: '',
    direccion: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo proveedor</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón social *</label>
            <input
              name="razon_social"
              value={form.razon_social}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
              <input
                name="cuit"
                value={form.cuit}
                onChange={handleChange}
                placeholder="30-12345678-9"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Condición AFIP</label>
              <select
                name="condicion_afip"
                value={form.condicion_afip}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              >
                <option value="responsable_inscripto">Responsable Inscripto</option>
                <option value="monotributista">Monotributista</option>
                <option value="exento">Exento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProveedorModal