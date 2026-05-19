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
    precio_costo: producto.precio_costo || 0,
    clasificacion: producto.clasificacion || 'B',
    activo: producto.activo ?? true,
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
        precio_costo: Number(form.precio_costo),
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">
            {editando ? 'Editar producto' : 'Ficha del producto'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {!editando ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Nombre</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">{producto.nombre}</p>
              </div>
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
                <p className="text-xs text-gray-400 uppercase tracking-wider">Precio venta</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">
                  ${Number(producto.precio_venta || 0).toLocaleString('es-AR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Precio costo</p>
                <p className="text-sm font-medium text-[#0F1F3D] mt-1">
                  ${Number(producto.precio_costo || 0).toLocaleString('es-AR')}
                </p>
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
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Estado</p>
                <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${producto.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>

            {producto.descripcion && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Descripción</p>
                <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
              {esDueno && (
                <button
                  onClick={() => setEditando(true)}
                  className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleGuardar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  name="codigo"
                  value={form.codigo}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <input
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <input
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio venta</label>
                <input
                  name="precio_venta"
                  type="number"
                  value={form.precio_venta}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Precio costo</label>
                <input
                  name="precio_costo"
                  type="number"
                  value={form.precio_costo}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidad de medida</label>
                <select
                  name="unidad_medida"
                  value={form.unidad_medida}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                >
                  <option value="unidad">Unidad</option>
                  <option value="metro">Metro</option>
                  <option value="kg">Kg</option>
                  <option value="litro">Litro</option>
                  <option value="caja">Caja</option>
                  <option value="rollo">Rollo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clasificación ABC</label>
                <select
                  name="clasificacion"
                  value={form.clasificacion}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                >
                  <option value="A">A — Alta rotación</option>
                  <option value="B">B — Media rotación</option>
                  <option value="C">C — Baja rotación</option>
                </select>
              </div>
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
              <label htmlFor="activo" className="text-sm text-gray-700">Producto activo</label>
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

export default ProductoDetalle