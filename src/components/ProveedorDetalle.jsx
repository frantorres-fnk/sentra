import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ProveedorDetalle = ({ proveedor, onClose, onActualizado }) => {
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    razon_social: proveedor.razon_social || '',
    cuit: proveedor.cuit || '',
    condicion_afip: proveedor.condicion_afip || 'responsable_inscripto',
    email: proveedor.email || '',
    telefono: proveedor.telefono || '',
    direccion: proveedor.direccion || '',
    activo: proveedor.activo ?? true,
  })

  const handleChange = (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm({ ...form, [e.target.name]: val })
  }

  const handleGuardar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('proveedores')
      .update(form)
      .eq('id', proveedor.id)

    if (error) {
      setError('Error al actualizar el proveedor.')
      setLoading(false)
    } else {
      onActualizado()
      setEditando(false)
      setLoading(false)
    }
  }

  const condicionLabel = {
    responsable_inscripto: 'Resp. Inscripto',
    monotributista: 'Monotributista',
    exento: 'Exento',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">
            {editando ? 'Editar proveedor' : 'Ficha del proveedor'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!editando ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Razón social</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{proveedor.razon_social}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">CUIT</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{proveedor.cuit || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Condición AFIP</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{condicionLabel[proveedor.condicion_afip] || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Saldo CC</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">
                  ${Number(proveedor.saldo_cc || 0).toLocaleString('es-AR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{proveedor.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Teléfono</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{proveedor.telefono || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Dirección</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{proveedor.direccion || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Estado</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${proveedor.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {proveedor.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => setEditando(true)}
                className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors"
              >
                Editar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">
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

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="activo"
                id="activo"
                checked={form.activo}
                onChange={handleChange}
                className="w-4 h-4 accent-[#00C896]"
              />
              <label htmlFor="activo" className="text-sm text-gray-700">Proveedor activo</label>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditando(false)}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
              >
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