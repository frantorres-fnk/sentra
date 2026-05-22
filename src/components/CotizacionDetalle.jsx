import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const estadoConfig = {
  borrador:  { label: 'Borrador',  color: 'bg-gray-100 text-gray-600' },
  enviada:   { label: 'Enviada',   color: 'bg-blue-50 text-blue-600' },
  aprobada:  { label: 'Aprobada',  color: 'bg-green-50 text-green-600' },
  rechazada: { label: 'Rechazada', color: 'bg-red-50 text-red-600' },
  vencida:   { label: 'Vencida',   color: 'bg-gray-100 text-gray-400' },
}

const CotizacionDetalle = ({ cotizacion, onClose, onActualizado }) => {
  const [loading, setLoading] = useState(false)
  const [loadingPedido, setLoadingPedido] = useState(false)
  const [detalles, setDetalles] = useState([])
  const [error, setError] = useState(null)

  const estadoActual = cotizacion.estado === 'enviada' && cotizacion.vencimiento && new Date(cotizacion.vencimiento) < new Date()
    ? 'vencida'
    : cotizacion.estado

  useEffect(() => {
    const fetchDetalles = async () => {
      const { data } = await supabase
        .from('cotizaciones_detalle')
        .select('*, productos(nombre, codigo, alicuota_iva)')
        .eq('cotizacion_id', cotizacion.id)
      setDetalles(data || [])
    }
    fetchDetalles()
  }, [cotizacion.id])

  const handleCambiarEstado = async (nuevoEstado) => {
    setLoading(true)
    const { error } = await supabase
      .from('cotizaciones')
      .update({ estado: nuevoEstado })
      .eq('id', cotizacion.id)
    if (!error) onActualizado()
    setLoading(false)
  }

  const handleConvertirPedido = async () => {
    setLoadingPedido(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_user_id', user.id)
      .single()

    // Crear pedido desde cotización
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        empresa_id: cotizacion.empresa_id,
        cliente_id: cotizacion.cliente_id,
        vendedor_id: cotizacion.vendedor_id,
        estado: 'pendiente',
        subtotal: cotizacion.subtotal,
        descuento: cotizacion.descuento,
        total: cotizacion.total,
        nota: cotizacion.nota,
      }])
      .select()
      .single()

    if (pedidoError) { setError('Error al crear el pedido.'); setLoadingPedido(false); return }

    // Copiar detalles al pedido
    const detallesPedido = detalles.map(d => ({
      empresa_id: cotizacion.empresa_id,
      pedido_id: pedido.id,
      producto_id: d.producto_id,
      cantidad: d.cantidad,
      precio_unitario: d.precio_unitario,
      descuento: d.descuento,
      subtotal: d.subtotal,
    }))

    await supabase.from('pedidos_detalle').insert(detallesPedido)

    // Marcar cotización como aprobada y linkear al pedido
    await supabase
      .from('cotizaciones')
      .update({ estado: 'aprobada', pedido_id: pedido.id })
      .eq('id', cotizacion.id)

    setLoadingPedido(false)
    onActualizado()
    alert(`✅ Pedido creado exitosamente!\nN° ${pedido.id.slice(-6).toUpperCase()}`)
  }

  const handleWhatsApp = () => {
    if (!cotizacion.clientes?.telefono) return
    const tel = cotizacion.clientes.telefono.replace(/\D/g, '')
    const numero = tel.startsWith('0') ? '54' + tel.slice(1) : tel.startsWith('54') ? tel : '54' + tel
    const mensaje = `Hola! Te enviamos la cotización N° ${cotizacion.id.slice(-6).toUpperCase()} por $${Number(cotizacion.total).toLocaleString('es-AR')}. Válida hasta ${new Date(cotizacion.vencimiento).toLocaleDateString('es-AR')}.`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const handleEmail = () => {
    if (!cotizacion.clientes?.email) return
    const asunto = `Cotización N° ${cotizacion.id.slice(-6).toUpperCase()} - ${cotizacion.clientes.razon_social}`
    const cuerpo = `Estimado cliente,\n\nAdjuntamos cotización N° ${cotizacion.id.slice(-6).toUpperCase()} por un total de $${Number(cotizacion.total).toLocaleString('es-AR')}.\n\nVálida hasta: ${new Date(cotizacion.vencimiento).toLocaleDateString('es-AR')}\n\nSaludos.`
    window.open(`mailto:${cotizacion.clientes.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`, '_blank')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                #{cotizacion.id.slice(-6).toUpperCase()}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${estadoConfig[estadoActual]?.color}`}>
                {estadoConfig[estadoActual]?.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#0F1F3D]">
              {cotizacion.clientes?.razon_social}
            </h3>
            {cotizacion.clientes?.nombre_fantasia && (
              <p className="text-sm text-[#00C896]">{cotizacion.clientes.nombre_fantasia}</p>
            )}
            <p className="text-xs text-gray-400 mt-0.5">👤 {cotizacion.usuarios?.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* Acciones rápidas */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <button
            onClick={handleEmail}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ✉️ Email
          </button>
          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            💬 WhatsApp
          </button>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-400">Fecha</p>
            <p className="text-sm font-medium text-[#0F1F3D]">
              {new Date(cotizacion.created_at).toLocaleDateString('es-AR')}
            </p>
          </div>
          <div className={`rounded-xl p-3 ${new Date(cotizacion.vencimiento) < new Date() ? 'bg-red-50' : 'bg-blue-50'}`}>
            <p className={`text-xs ${new Date(cotizacion.vencimiento) < new Date() ? 'text-red-400' : 'text-blue-400'}`}>
              Vence
            </p>
            <p className={`text-sm font-medium ${new Date(cotizacion.vencimiento) < new Date() ? 'text-red-600' : 'text-blue-700'}`}>
              {new Date(cotizacion.vencimiento).toLocaleDateString('es-AR')}
            </p>
          </div>
        </div>

        {/* Productos */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Detalle</p>
          <div className="space-y-2">
            {detalles.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F1F3D] truncate">{d.productos?.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {d.cantidad} x ${Number(d.precio_unitario).toLocaleString('es-AR')}
                    {d.productos?.alicuota_iva ? ` · IVA ${d.productos.alicuota_iva}%` : ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[#0F1F3D] ml-2 shrink-0">
                  ${Number(d.subtotal).toLocaleString('es-AR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Totales */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
          {Number(cotizacion.descuento) > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-400">${Number(cotizacion.subtotal).toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-orange-600">Descuento</span>
                <span className="text-orange-600">-${Number(cotizacion.descuento).toLocaleString('es-AR')}</span>
              </div>
            </>
          )}
          <div className="flex justify-between border-t border-gray-200 pt-2">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-xl font-bold text-[#0F1F3D]">
              ${Number(cotizacion.total).toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        {cotizacion.nota && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-4">
            <p className="text-xs text-yellow-600 font-medium mb-1">Nota</p>
            <p className="text-sm text-yellow-800">{cotizacion.nota}</p>
          </div>
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {/* Acciones según estado */}
        <div className="space-y-2">

          {/* Convertir a pedido — solo si está aprobada o enviada */}
          {(estadoActual === 'aprobada' || estadoActual === 'enviada') && !cotizacion.pedido_id && (
            <button
              onClick={handleConvertirPedido}
              disabled={loadingPedido}
              className="w-full bg-[#0F1F3D] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1a2f5a] transition-colors disabled:opacity-50"
            >
              {loadingPedido ? 'Creando pedido...' : '🛒 Convertir en pedido'}
            </button>
          )}

          {cotizacion.pedido_id && (
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-green-600">
                ✅ Convertida en pedido #{cotizacion.pedido_id.slice(-6).toUpperCase()}
              </p>
            </div>
          )}

          {/* Cambiar estado */}
          {estadoActual === 'borrador' && (
            <button
              onClick={() => handleCambiarEstado('enviada')}
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              📤 Marcar como enviada
            </button>
          )}

          {estadoActual === 'enviada' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleCambiarEstado('rechazada')}
                disabled={loading}
                className="border border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                ❌ Rechazada
              </button>
              <button
                onClick={() => handleCambiarEstado('aprobada')}
                disabled={loading}
                className="bg-green-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
              >
                ✅ Aprobada
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default CotizacionDetalle