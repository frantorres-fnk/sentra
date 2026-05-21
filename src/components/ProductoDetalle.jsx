import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useRol } from '../hooks/useRol'

const ProductoDetalle = ({ producto, onClose, onActualizado }) => {
  const { rol } = useRol()
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    codigo: producto.codigo || '',
    nombre: producto.nombre || '',
    descripcion: producto.descripcion || '',
    categoria: producto.categoria || '',
    unidad_medida: producto.unidad_medida || 'unidad',
    precio_venta: producto.precio_venta || 0,
    precio_lista_2: producto.precio_lista_2 || 0,
    precio_costo: producto.precio_costo || 0,
    clasificacion: producto.clasificacion || 'B',
    activo: producto.activo ?? true,
    alicuota_iva: producto.alicuota_iva ?? 21,
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
      .from('productos')
      .update({
        ...form,
        precio_venta: Number(form.precio_venta),
        precio_lista_2: Number(form.precio_lista_2),
        precio_costo: Number(form.precio_costo),
        alicuota_iva: Number(form.alicuota_iva),
      })
      .eq('id', producto.id)

    if (error) {
      setError('Error al actualizar el producto.')
      setLoading(false)
    } else {
      onActualizado()
      setEditando(false)
      setLoading(false)
    }
  }

  const esDueno = rol === 'Dueño'
  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const margen = producto.precio_venta && producto.precio_costo
    ? (((producto.precio_venta - producto.precio_costo) / producto.precio_venta) * 100).toFixed(1)
    : null

  const ivaColor = {
    21: { bg: 'bg-red-50', text: 'text-red-600', label: 'General' },
    10.5: { bg: 'bg-yellow-50', text: 'text-yellow-600', label: 'Reducido' },
    0: { bg: 'bg-gray-50', text: 'text-gray-500', label: 'Exento' },
  }

  const ivaActual = ivaColor[Number(producto.alicuota_iva)] || ivaColor[21]

  const ivaColorEdit = {
    21: 'bg-red-50 border-red-200 text-red-700',
    10.5: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    0: 'bg-gray-50 border-gray-200 text-gray-600',
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">
            {editando ? 'Editar producto' : producto.nombre}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!editando ? (
          <div className="space-y-5">

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Información</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Código</p>
                  <p className="text-sm font-medium text-[#0F1F3D] mt-1">{producto.codigo || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Categoría</p>
                  <p className="text-sm font-medium text-[#0F1F3D] mt-1">{producto.categoria || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Unidad</p>
                  <p className="text-sm font-medium text-[#0F1F3D] mt-1">{producto.unidad_medida}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Clasificación</p>
                  <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 font-medium ${
                    producto.clasificacion === 'A' ? 'bg-green-50 text-green-600' :
                    producto.clasificacion === 'B' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {producto.clasificacion || '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* IVA */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Alícuota IVA</p>
              <div className={`rounded-xl p-3 flex justify-between items-center ${ivaActual.bg}`}>
                <div>
                  <p className={`text-xs font-semibold ${ivaActual.text}`}>IVA {ivaActual.label}</p>
                  <p className={`text-xs ${ivaActual.text} opacity-70`}>
                    {Number(producto.alicuota_iva) === 21 ? 'Productos generales' :
                     Number(producto.alicuota_iva) === 10.5 ? 'Luminarias y materiales eléctricos' :
                     'Sin IVA'}
                  </p>
                </div>
                <p className={`text-2xl font-bold ${ivaActual.text}`}>{producto.alicuota_iva}%</p>
              </div>
            </div>

            {/* Precios */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Precios</p>
              <div className="space-y-2">
                <div className="bg-blue-50 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">Lista 1 — Mostrador</p>
                    <p className="text-xs text-blue-400">Consumidor final</p>
                  </div>
                  <p className="text-lg font-bold text-blue-700">
                    ${Number(producto.precio_venta || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 flex justify-between items-center">
                  <div>
                    <p className="text-xs font-semibold text-green-600">Lista 2 — Mayorista</p>
                    <p className="text-xs text-green-400">Clientes especiales</p>
                  </div>
                  <p className="text-lg font-bold text-green-700">
                    ${Number(producto.precio_lista_2 || 0).toLocaleString('es-AR')}
                  </p>
                </div>
                {esDueno && (
                  <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-gray-600">Precio costo</p>
                      {margen && <p className="text-xs text-gray-400">Margen: {margen}%</p>}
                    </div>
                    <p className="text-lg font-bold text-gray-700">
                      ${Number(producto.precio_costo || 0).toLocaleString('es-AR')}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {producto.descripcion && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Descripción</p>
                <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
                Cerrar
              </button>
              {esDueno && (
                <button onClick={() => setEditando(true)} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors">
                  Editar
                </button>
              )}
            </div>
          </div>

        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">
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
                        ? ivaColorEdit[iva]
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
                  <label className="block text-sm font-semibold text-blue-700 mb-1">Lista 1 — Mostrador</label>
                  <input name="precio_venta" type="number" value={form.precio_venta} onChange={handleChange}
                    className="w-full border border-blue-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white" />
                </div>
                <div className="bg-green-50 rounded-xl p-3">
                  <label className="block text-sm font-semibold text-green-700 mb-1">Lista 2 — Mayorista</label>
                  <input name="precio_lista_2" type="number" value={form.precio_lista_2} onChange={handleChange}
                    className="w-full border border-green-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white" />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Precio costo (interno)</label>
                  <input name="precio_costo" type="number" value={form.precio_costo} onChange={handleChange}
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

            <div className="flex items-center gap-2">
              <input type="checkbox" name="activo" id="activo" checked={form.activo} onChange={handleChange} className="w-4 h-4 accent-[#00C896]" />
              <label htmlFor="activo" className="text-sm text-gray-700">Producto activo</label>
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

export default ProductoDetalle