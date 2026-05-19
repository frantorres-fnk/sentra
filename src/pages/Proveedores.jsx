import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ProveedorModal from '../components/ProveedorModal'
import ProveedorDetalle from '../components/ProveedorDetalle'

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null)

  const fetchProveedores = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('proveedores')
      .select('*')
      .order('razon_social', { ascending: true })

    if (!error) setProveedores(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchProveedores()
  }, [])

  const proveedoresFiltrados = proveedores.filter(p =>
    p.razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cuit?.includes(busqueda)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Proveedores</h2>
          <p className="text-gray-500 mt-1">Gestioná tus proveedores y sus cuentas corrientes</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nuevo proveedor
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o CUIT..."
          className="w-full max-w-md border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Proveedor</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">CUIT</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo CC</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : proveedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? 'No se encontraron proveedores.' : 'No hay proveedores todavía. Agregá el primero.'}
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => setProveedorSeleccionado(p)}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#0F1F3D]">{p.razon_social}</p>
                    {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.cuit || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.telefono || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    ${Number(p.saldo_cc || 0).toLocaleString('es-AR')}
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
        <ProveedorModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchProveedores}
        />
      )}

      {proveedorSeleccionado && (
        <ProveedorDetalle
          proveedor={proveedorSeleccionado}
          onClose={() => setProveedorSeleccionado(null)}
          onActualizado={() => {
            fetchProveedores()
            setProveedorSeleccionado(null)
          }}
        />
      )}
    </div>
  )
}

export default Proveedores