import { useState } from 'react'
import { supabase } from '../lib/supabase'

const ProductoModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    unidad_medida: 'unidad',
    precio_venta: '',
    precio_lista_2: '',
    precio_costo: '',
    clasificacion: 'B',
    alicuota_iva: 21,
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
      setError('No se encontró la empresa asociada.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('productos')
      .insert([{
        ...form,
        empresa_id: usuarioData.empresa_id,
        precio_venta: Number(form.precio_venta) || 0,
        precio_lista_2: Number(form.precio_lista_2) || 0,
        precio_costo: Number(form.precio_costo) || 0,
        alicuota_iva: Number(form.alicuota_iva),
      }])

    if (error) {
      setError('Error al guardar el producto.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const ivaColor = {
    21: 'bg-red-50 border-red-200 text-red-700',
    10.5: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    0: 'bg-gray-50 border-gray-200 text-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo producto</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Código</label>
              <input name="codigo" value={form.codigo} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Categoría</label>
              <input name="categoria" value={form.categoria} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Nombre *</label>
            <input name="nombre" value={form.nombre} onChange={handleChange} className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Descripción</label>
            <input name="descripcion" value={form.descripcion} onChange={handleChange} className={inputClass} />
          </div>

          {/* IVA */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Alícuota IVA</p>
            <div className="grid grid-cols-3 gap-2">
              {[21, 10.5, 0].map(iva => (
                <button
                  key={iva}
                  type="button"
                  onClick={() => setForm({ ...form, alicuota_iva: iva })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    Number(form.alicuota_iva) === iva
                      ? ivaColor[iva]
                      : 'border-gray-200 bg-white text-gray-400'
                  }`}
                >
                  {iva}%
                  <p className="text-xs font-normal mt-0.5">
                    {iva === 21 ? 'General' : iva === 10.5 ? 'Reducido' : 'Exento'}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Precios */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Precios</p>
            <div className="grid grid-cols-1 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <label className="block text-sm font-semibold text-blue-700 mb-1">
                  Lista 1 — Mostrador (consumidor final)
                </label>
                <input name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange} placeholder="$0"
                  className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <label className="block text-sm font-semibold text-green-700 mb-1">
                  Lista 2 — Mayorista (clientes especiales)
                </label>
                <input name="precio_lista_2" type="number" value={form.precio_lista_2} onChange={handleChange} placeholder="$0"
                  className="w-full border border-green-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <label className="block text-sm font-semibold text-gray-600 mb-1">Precio costo (interno)</label>
                <input name="precio_costo" type="number" value={form.precio_costo} onChange={handleChange} placeholder="$0"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Unidad de medida</label>
              <select name="unidad_medida" value={form.unidad_medida} onChange={handleChange} className={inputClass}>
                <option value="unidad">Unidad</option>
                <option value="metro">Metro</option>
                <option value="kg">Kg</option>
                <option value="litro">Litro</option>
                <option value="caja">Caja</option>
                <option value="rollo">Rollo</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Clasificación ABC</label>
              <select name="clasificacion" value={form.clasificacion} onChange={handleChange} className={inputClass}>
                <option value="A">A — Alta rotación</option>
                <option value="B">B — Media rotación</option>
                <option value="C">C — Baja rotación</option>
              </select>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductoModal