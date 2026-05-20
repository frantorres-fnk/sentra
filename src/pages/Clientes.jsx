import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ClienteModal from '../components/ClienteModal'
import ClienteDetalle from '../components/ClienteDetalle'

const Clientes = () => {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)

  const fetchClientes = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .order('numero_cliente', { ascending: true })
    if (!error) setClientes(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchClientes()
  }, [])

  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase()
    return (
      c.razon_social?.toLowerCase().includes(q) ||
      c.nombre_fantasia?.toLowerCase().includes(q) ||
      c.cuit?.includes(q) ||
      c.zona?.toLowerCase().includes(q) ||
      c.numero_cliente?.toString().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.telefono?.includes(q)
    )
  })

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
          <p className="text-gray-500 mt-1">
            {clientes.length} clientes · Gestioná tu cartera
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nuevo cliente
        </button>
      </div>

      <div className="mb-4 relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, fantasía, CUIT, nro, zona, email, teléfono..."
          className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
        {busqueda && (
          <button
            onClick={() => setBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {busqueda && (
        <p className="text-xs text-gray-400 mb-3">
          {clientesFiltrados.length} resultado{clientesFiltrados.length !== 1 ? 's' : ''} para "{busqueda}"
        </p>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">Nro</th>
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
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? `No se encontraron clientes para "${busqueda}".` : 'No hay clientes todavía. Agregá el primero.'}
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setClienteSeleccionado(c)}
                  className={`border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${c.bloqueado ? 'bg-red-50/30' : ''}`}
                >
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono text-gray-400">#{c.numero_cliente}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#0F1F3D]">{c.razon_social}</p>
                    {c.nombre_fantasia && (
                      <p className="text-xs text-[#00C896] font-medium">{c.nombre_fantasia}</p>
                    )}
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
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs px-2 py-1 rounded-full w-fit ${c.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {c.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      {c.bloqueado && (
                        <span className="text-xs px-2 py-1 rounded-full w-fit bg-red-100 text-red-600 font-semibold">
                          🔒 Bloqueado
                        </span>
                      )}
                    </div>
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

      {clienteSeleccionado && (
        <ClienteDetalle
          cliente={clienteSeleccionado}
          onClose={() => setClienteSeleccionado(null)}
          onActualizado={() => {
            fetchClientes()
            setClienteSeleccionado(null)
          }}
        />
      )}
    </div>
  )
}

export default Clientes