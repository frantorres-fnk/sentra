import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProductoModal from '../components/ProductoModal'

const Productos = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  const fetchProductos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    if (!error) setProductos(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.categoria?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Productos</h2>
          <p className="text-gray-500 mt-1">Gestioná tu catálogo de productos</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, código o categoría..."
          className="w-full max-w-md border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Código</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoría</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Precio venta</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clasificación</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : productosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? 'No se encontraron productos.' : 'No hay productos todavía. Agregá el primero.'}
                </td>
              </tr>
            ) : (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#0F1F3D]">{p.nombre}</p>
                    {p.descripcion && <p className="text-xs text-gray-400">{p.descripcion}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.codigo || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.categoria || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    ${Number(p.precio_venta || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5">
                    {p.clasificacion ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.clasificacion === 'A' ? 'bg-green-50 text-green-600' :
                        p.clasificacion === 'B' ? 'bg-yellow-50 text-yellow-600' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {p.clasificacion}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ProductoModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchProductos}
        />
      )}
    </div>
  )
}

export default Productos