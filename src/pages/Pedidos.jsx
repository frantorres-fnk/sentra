import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PedidoModal from '../components/PedidoModal'

const estadoConfig = {
  borrador:   { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  pendiente:  { label: 'Pendiente',   color: 'bg-yellow-50 text-yellow-600' },
  aprobado:   { label: 'Aprobado',    color: 'bg-green-50 text-green-600' },
  rechazado:  { label: 'Rechazado',   color: 'bg-red-50 text-red-600' },
  en_reparto: { label: 'En reparto',  color: 'bg-blue-50 text-blue-600' },
  entregado:  { label: 'Entregado',   color: 'bg-purple-50 text-purple-600' },
  cancelado:  { label: 'Cancelado',   color: 'bg-gray-100 text-gray-400' },
}

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)

  const fetchPedidos = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (id, razon_social),
        usuarios!pedidos_vendedor_id_fkey (id, nombre)
      `)
      .order('fecha_pedido', { ascending: false })

    if (!error) setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchPedidos()
  }, [])

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Pedidos</h2>
          <p className="text-gray-500 mt-1">Gestioná los pedidos de tus clientes</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nuevo pedido
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'pendiente', 'aprobado', 'en_reparto', 'entregado', 'rechazado'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtroEstado === e
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todos' : estadoConfig[e]?.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Pedido</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : pedidosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No hay pedidos todavía.
                </td>
              </tr>
            ) : (
              pedidosFiltrados.map((p) => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                    #{p.id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.clientes?.razon_social}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{p.usuarios?.nombre}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                    ${Number(p.total || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {new Date(p.fecha_pedido).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[p.estado]?.color}`}>
                      {estadoConfig[p.estado]?.label}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <PedidoModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchPedidos}
        />
      )}
    </div>
  )
}

export default Pedidos