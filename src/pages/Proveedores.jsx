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

  useEffect(() => { fetchProveedores() }, [])

  const proveedoresFiltrados = proveedores.filter(p =>
    p.razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.cuit?.includes(busqueda)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Proveedores</h2>
          <p className="text-gray-500 text-sm mt-0.5">{proveedores.length} proveedores</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="bg-[#00C896] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors">
          + Nuevo
        </button>
      </div>

      <div className="mb-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o CUIT..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {busqueda ? 'No se encontraron proveedores.' : 'No hay proveedores todavía.'}
        </div>
      ) : (
        <>
          {/* MOBILE — tarjetas */}
          <div className="md:hidden space-y-3">
            {proveedoresFiltrados.map((p) => (
              <div
                key={p.id}
                onClick={() => setProveedorSeleccionado(p)}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F1F3D] truncate">{p.razon_social}</p>
                    {p.email && <p className="text-xs text-gray-400 truncate">{p.email}</p>}
                    {p.cuit && <p className="text-xs text-gray-400">CUIT: {p.cuit}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {p.saldo_cc > 0 && (
                      <span className="text-xs font-semibold text-orange-500">
                        ${Number(p.saldo_cc).toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
                {p.telefono && (
                  <div className="mt-2 pt-2 border-t border-gray-50">
                    <span className="text-xs text-gray-400">📞 {p.telefono}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {proveedoresFiltrados.map((p) => (
                  <tr key={p.id} onClick={() => setProveedorSeleccionado(p)} className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-[#0F1F3D]">{p.razon_social}</p>
                      {p.email && <p className="text-xs text-gray-400">{p.email}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{p.cuit || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{p.telefono || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">${Number(p.saldo_cc || 0).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${p.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAbierto && <ProveedorModal onClose={() => setModalAbierto(false)} onGuardado={fetchProveedores} />}
      {proveedorSeleccionado && (
        <ProveedorDetalle
          proveedor={proveedorSeleccionado}
          onClose={() => setProveedorSeleccionado(null)}
          onActualizado={() => { fetchProveedores(); setProveedorSeleccionado(null) }}
        />
      )}
    </div>
  )
}

export default Proveedores