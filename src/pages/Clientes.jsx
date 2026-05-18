import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ClienteModal from '../components/ClienteModal'

const Clientes = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('razon_social', { ascending: true })

    if (!error) setClientes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const clientesFiltrados = clientes.filter(c =>
    c.razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
    c.cuit?.includes(busqueda) ||
    c.zona?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const condicionLabel = {
    responsable_inscripto: 'Resp. Inscripto',
    monotributista: 'Monotributista',
    consumidor_final: 'Cons. Final',
    exento: 'Exento',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Clientes</h2>
          <p className="text-gray-500 mt-1">Gestioná tu cartera de clientes</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, CUIT o zona..."
          className="w-full max-w-md border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">CUIT</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Condición AFIP</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Saldo CC</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Zona</th>
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
            ) : clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? 'No se encontraron clientes.' : 'No hay clientes todavía. Agregá el primero.'}
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#0F1F3D]">{c.razon_social}</p>
                    {c.email && <p className="text-xs text-gray-400">{c.email}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{c.cuit || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                      {condicionLabel[c.condicion_afip] || c.condicion_afip}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    ${Number(c.saldo_cc || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{c.zona || '-'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${c.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <ClienteModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchClientes}
        />
      )}
    </div>
  )
}

export default Clientes