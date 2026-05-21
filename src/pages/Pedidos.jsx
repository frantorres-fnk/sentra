import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PedidoModal from '../components/PedidoModal'
import PedidoDetalle from '../components/PedidoDetalle'
import { useRol } from '../hooks/useRol'

const estadoConfig = {
  borrador:   { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-50 text-yellow-600' },
  aprobado:   { label: 'Aprobado',   color: 'bg-green-50 text-green-600' },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-50 text-red-600' },
  en_reparto: { label: 'En reparto', color: 'bg-blue-50 text-blue-600' },
  entregado:  { label: 'Entregado',  color: 'bg-purple-50 text-purple-600' },
  cancelado:  { label: 'Cancelado',  color: 'bg-gray-100 text-gray-400' },
}

const Pedidos = () => {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null)
  const [usuarioActual, setUsuarioActual] = useState(null)
  const { rol } = useRol()

  const esDueno = rol === 'Dueño' || rol === 'Administrador'

  const fetchPedidos = async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id, nombre, empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    setUsuarioActual(usuarioData)

    let query = supabase
      .from('pedidos')
      .select(`*, clientes (id, razon_social), usuarios!pedidos_vendedor_id_fkey (id, nombre)`)
      .order('fecha_pedido', { ascending: false })

    // Si no es dueño/admin, solo ve sus propios pedidos
    if (usuarioData && !esDueno) {
      query = query.eq('vendedor_id', usuarioData.id)
    }

    const { data, error } = await query
    if (!error) setPedidos(data || [])
    setLoading(false)
  }

  useEffect(() => {
    if (rol) fetchPedidos()
  }, [rol])

  const pedidosFiltrados = filtroEstado === 'todos'
    ? pedidos
    : pedidos.filter(p => p.estado === filtroEstado)

  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Pedidos</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            {esDueno
              ? `${pedidos.length} pedidos en total`
              : `Mis pedidos — ${pedidos.length} en total`
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendientes > 0 && (
            <span className="bg-yellow-50 text-yellow-600 px-3 py-1.5 rounded-lg text-xs font-medium">
              ⏳ {pendientes}
            </span>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-[#00C896] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
          >
            + Nuevo
          </button>
        </div>
      </div>

      {/* Banner vendedor */}
      {!esDueno && usuarioActual && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <span className="text-blue-500">👤</span>
          <p className="text-sm text-blue-700">
            Mostrando pedidos de <span className="font-semibold">{usuarioActual.nombre}</span>
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'pendiente', 'aprobado', 'en_reparto', 'entregado', 'rechazado'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filtroEstado === e
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todos' : estadoConfig[e]?.label}
            {e !== 'todos' && (
              <span className="ml-1 opacity-60">
                ({pedidos.filter(p => p.estado === e).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {filtroEstado === 'todos'
            ? 'No hay pedidos todavía.'
            : `No hay pedidos en estado "${estadoConfig[filtroEstado]?.label}".`
          }
        </div>
      ) : (
        <>
          {/* MOBILE — tarjetas */}
          <div className="md:hidden space-y-3">
            {pedidosFiltrados.map((p) => (
              <div
                key={p.id}
                onClick={() => setPedidoSeleccionado(p)}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{p.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm font-semibold text-[#0F1F3D] mt-0.5">{p.clientes?.razon_social}</p>
                    {esDueno && p.usuarios?.nombre && (
                      <p className="text-xs text-gray-400">👤 {p.usuarios.nombre}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoConfig[p.estado]?.color}`}>
                      {estadoConfig[p.estado]?.label}
                    </span>
                    <span className="text-sm font-bold text-[#0F1F3D]">
                      ${Number(p.total || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    📅 {new Date(p.fecha_pedido).toLocaleDateString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">N° Pedido</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  {esDueno && (
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  )}
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setPedidoSeleccionado(p)}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                      #{p.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{p.clientes?.razon_social}</td>
                    {esDueno && (
                      <td className="px-5 py-3.5 text-sm text-gray-600">{p.usuarios?.nombre}</td>
                    )}
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
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAbierto && (
        <PedidoModal onClose={() => setModalAbierto(false)} onGuardado={fetchPedidos} />
      )}
      {pedidoSeleccionado && (
        <PedidoDetalle
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
          onActualizado={() => { fetchPedidos(); setPedidoSeleccionado(null) }}
        />
      )}
    </div>
  )
}

export default Pedidos