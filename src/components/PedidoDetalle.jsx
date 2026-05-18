import { useState } from 'react'
import { supabase } from '../lib/supabase'

const estadoConfig = {
  borrador:   { label: 'Borrador',    color: 'bg-gray-100 text-gray-600' },
  pendiente:  { label: 'Pendiente',   color: 'bg-yellow-50 text-yellow-600' },
  aprobado:   { label: 'Aprobado',    color: 'bg-green-50 text-green-600' },
  rechazado:  { label: 'Rechazado',   color: 'bg-red-50 text-red-600' },
  en_reparto: { label: 'En reparto',  color: 'bg-blue-50 text-blue-600' },
  entregado:  { label: 'Entregado',   color: 'bg-purple-50 text-purple-600' },
  cancelado:  { label: 'Cancelado',   color: 'bg-gray-100 text-gray-400' },
}

const PedidoDetalle = ({ pedido, onClose, onActualizado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const cambiarEstado = async (nuevoEstado) => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const update = {
      estado: nuevoEstado,
    }

    if (nuevoEstado === 'aprobado') {
      update.aprobado_por = usuarioData.id
      update.aprobado_at = new Date().toISOString()
    }

    const { error } = await supabase
      .from('pedidos')
      .update(update)
      .eq('id', pedido.id)

    if (error) {
      setError('Error al actualizar el pedido.')
      setLoading(false)
    } else {
      onActualizado()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">

        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#0F1F3D]">
              Pedido #{pedido.id.slice(-6).toUpperCase()}
            </h3>
            <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[pedido.estado]?.color}`}>
              {estadoConfig[pedido.estado]?.label}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="space-y-3 mb-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Cliente</p>
              <p className="text-sm font-medium text-[#0F1F3D] mt-1">{pedido.clientes?.razon_social}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Vendedor</p>
              <p className="text-sm font-medium text-[#0F1F3D] mt-1">{pedido.usuarios?.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Fecha</p>
              <p className="text-sm font-medium text-[#0F1F3D] mt-1">
                {new Date(pedido.fecha_pedido).toLocaleDateString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Total</p>
              <p className="text-xl font-bold text-[#0F1F3D] mt-1">
                ${Number(pedido.total || 0).toLocaleString('es-AR')}
              </p>
            </div>
          </div>

          {pedido.nota && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Nota</p>
              <p className="text-sm text-gray-600 mt-1">{pedido.nota}</p>
            </div>
          )}

          {pedido.descuento > 0 && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Descuento aplicado</p>
              <p className="text-sm text-gray-600 mt-1">
                ${Number(pedido.descuento).toLocaleString('es-AR')}
              </p>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Acciones según estado */}
        <div className="space-y-2">
          {pedido.estado === 'pendiente' && (
            <div className="flex gap-3">
              <button
                onClick={() => cambiarEstado('rechazado')}
                disabled={loading}
                className="flex-1 border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
              <button
                onClick={() => cambiarEstado('aprobado')}
                disabled={loading}
                className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
              >
                Aprobar pedido
              </button>
            </div>
          )}

          {pedido.estado === 'aprobado' && (
            <button
              onClick={() => cambiarEstado('en_reparto')}
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Enviar a reparto
            </button>
          )}

          {pedido.estado === 'en_reparto' && (
            <button
              onClick={() => cambiarEstado('entregado')}
              disabled={loading}
              className="w-full bg-purple-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              Marcar como entregado
            </button>
          )}

          {pedido.estado === 'entregado' && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">Este pedido fue entregado.</p>
              <p className="text-sm text-[#00C896] font-medium mt-1">
                Próximo paso → Generar factura
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PedidoDetalle