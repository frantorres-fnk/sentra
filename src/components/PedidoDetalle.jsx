import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const estadoConfig = {
  borrador:   { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  pendiente:  { label: 'Pendiente',  color: 'bg-yellow-50 text-yellow-600' },
  aprobado:   { label: 'Aprobado',   color: 'bg-green-50 text-green-600' },
  rechazado:  { label: 'Rechazado',  color: 'bg-red-50 text-red-600' },
  en_reparto: { label: 'En reparto', color: 'bg-blue-50 text-blue-600' },
  entregado:  { label: 'Entregado',  color: 'bg-purple-50 text-purple-600' },
  cancelado:  { label: 'Cancelado',  color: 'bg-gray-100 text-gray-400' },
}

const PedidoDetalle = ({ pedido, onClose, onActualizado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [clienteInfo, setClienteInfo] = useState(null)
  const [vistaRemito, setVistaRemito] = useState(false)

  useEffect(() => {
    const fetchDetalles = async () => {
      const { data } = await supabase
        .from('pedidos_detalle')
        .select('*, productos(nombre, codigo, alicuota_iva)')
        .eq('pedido_id', pedido.id)
      setDetalles(data || [])

      if (pedido.cliente_id) {
        const { data: cliente } = await supabase
          .from('clientes')
          .select('razon_social, nombre_fantasia, cuit, condicion_afip, direccion, provincia, telefono, email')
          .eq('id', pedido.cliente_id)
          .single()
        setClienteInfo(cliente)
      }
    }
    fetchDetalles()
  }, [pedido.id])

  const cambiarEstado = async (nuevoEstado) => {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    const update = { estado: nuevoEstado }
    if (nuevoEstado === 'aprobado') {
      update.aprobado_por = usuarioData.id
      update.aprobado_at = new Date().toISOString()
    }

    const { error } = await supabase.from('pedidos').update(update).eq('id', pedido.id)
    if (error) {
      setError('Error al actualizar el pedido.')
      setLoading(false)
    } else {
      onActualizado()
      onClose()
    }
  }

  const generarRemitoPDF = () => {
    const empresa = 'Eléctrica Urbano'
    const fecha = new Date().toLocaleDateString('es-AR')
    const nroPedido = pedido.id.slice(-6).toUpperCase()

    const contenido = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Remito ${nroPedido}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #333; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: start; border-bottom: 2px solid #0F1F3D; padding-bottom: 15px; margin-bottom: 15px; }
    .empresa { font-size: 20px; font-weight: bold; color: #0F1F3D; }
    .remito-title { text-align: right; }
    .remito-title h2 { font-size: 18px; color: #0F1F3D; }
    .remito-title p { font-size: 13px; color: #666; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .info-box { background: #f8f9fa; border-radius: 8px; padding: 12px; }
    .info-box label { font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 0.5px; }
    .info-box p { font-size: 13px; font-weight: 600; color: #0F1F3D; margin-top: 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #0F1F3D; color: white; }
    thead th { padding: 10px 12px; text-align: left; font-size: 12px; }
    tbody tr { border-bottom: 1px solid #eee; }
    tbody tr:nth-child(even) { background: #f8f9fa; }
    tbody td { padding: 10px 12px; font-size: 13px; }
    .text-right { text-align: right; }
    .total-box { background: #0F1F3D; color: white; padding: 15px 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
    .total-box span { font-size: 14px; }
    .total-box strong { font-size: 22px; }
    .firma-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; }
    .firma-box { text-align: center; }
    .firma-linea { border-top: 1px solid #333; padding-top: 8px; margin-top: 60px; font-size: 12px; color: #666; }
    .nota-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px; margin-bottom: 20px; }
    .nota-box label { font-size: 10px; text-transform: uppercase; color: #92400e; }
    .nota-box p { font-size: 13px; color: #78350f; margin-top: 3px; }
    .footer { border-top: 1px solid #eee; padding-top: 10px; text-align: center; font-size: 11px; color: #999; margin-top: 20px; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="empresa">${empresa}</div>
      <p style="color:#666; font-size:12px; margin-top:4px;">Sistema de gestión SENTRA</p>
    </div>
    <div class="remito-title">
      <h2>REMITO</h2>
      <p>N° ${nroPedido}</p>
      <p>Fecha: ${fecha}</p>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <label>Cliente</label>
      <p>${clienteInfo?.razon_social || pedido.clientes?.razon_social}</p>
      ${clienteInfo?.nombre_fantasia ? `<p style="font-size:12px;color:#00C896;">${clienteInfo.nombre_fantasia}</p>` : ''}
      ${clienteInfo?.cuit ? `<p style="font-size:12px;color:#666;">CUIT: ${clienteInfo.cuit}</p>` : ''}
    </div>
    <div class="info-box">
      <label>Dirección de entrega</label>
      <p>${clienteInfo?.direccion || 'No especificada'}</p>
      ${clienteInfo?.provincia ? `<p style="font-size:12px;color:#666;">${clienteInfo.provincia}</p>` : ''}
      ${clienteInfo?.telefono ? `<p style="font-size:12px;color:#666;">Tel: ${clienteInfo.telefono}</p>` : ''}
    </div>
    <div class="info-box">
      <label>Vendedor</label>
      <p>${pedido.usuarios?.nombre || '-'}</p>
    </div>
    <div class="info-box">
      <label>Fecha de pedido</label>
      <p>${new Date(pedido.fecha_pedido).toLocaleDateString('es-AR')}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Producto</th>
        <th class="text-right">Cant.</th>
        <th class="text-right">Precio unit.</th>
        <th class="text-right">IVA</th>
        <th class="text-right">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${detalles.map(d => `
        <tr>
          <td>${d.productos?.codigo || '-'}</td>
          <td>${d.productos?.nombre}</td>
          <td class="text-right">${Number(d.cantidad).toLocaleString('es-AR')}</td>
          <td class="text-right">$${Number(d.precio_unitario).toLocaleString('es-AR')}</td>
          <td class="text-right">${d.productos?.alicuota_iva ?? 21}%</td>
          <td class="text-right">$${Number(d.subtotal).toLocaleString('es-AR')}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${pedido.descuento > 0 ? `
  <div style="text-align:right; margin-bottom:8px; color:#888;">
    Subtotal: $${Number(pedido.subtotal).toLocaleString('es-AR')} |
    Descuento: -$${Number(pedido.descuento).toLocaleString('es-AR')}
  </div>` : ''}

  <div class="total-box">
    <span>TOTAL DEL PEDIDO</span>
    <strong>$${Number(pedido.total).toLocaleString('es-AR')}</strong>
  </div>

  ${pedido.nota ? `
  <div class="nota-box">
    <label>Nota</label>
    <p>${pedido.nota}</p>
  </div>` : ''}

  <div class="firma-section">
    <div class="firma-box">
      <div class="firma-linea">Firma y aclaración del receptor</div>
    </div>
    <div class="firma-box">
      <div class="firma-linea">Firma y sello de la empresa</div>
    </div>
  </div>

  <div class="footer">
    Documento generado por SENTRA · ${empresa} · ${fecha}
  </div>

</body>
</html>
    `

    const ventana = window.open('', '_blank')
    ventana.document.write(contenido)
    ventana.document.close()
    ventana.focus()
    setTimeout(() => ventana.print(), 500)
  }

  if (vistaRemito) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
        <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0F1F3D]">Remito #{pedido.id.slice(-6).toUpperCase()}</h3>
              <p className="text-xs text-gray-400">Vista previa</p>
            </div>
            <button onClick={() => setVistaRemito(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          {/* Preview remito */}
          <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[#0F1F3D]">{clienteInfo?.razon_social}</p>
                {clienteInfo?.nombre_fantasia && <p className="text-xs text-[#00C896]">{clienteInfo.nombre_fantasia}</p>}
                {clienteInfo?.cuit && <p className="text-xs text-gray-400">CUIT: {clienteInfo.cuit}</p>}
              </div>
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">Remito #{pedido.id.slice(-6).toUpperCase()}</span>
            </div>

            {clienteInfo?.direccion && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-xs text-gray-400">📍 Dirección de entrega</p>
                <p className="text-sm font-medium text-[#0F1F3D]">{clienteInfo.direccion}</p>
                {clienteInfo?.provincia && <p className="text-xs text-gray-400">{clienteInfo.provincia}</p>}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Productos</p>
              {detalles.map((d, i) => (
                <div key={i} className="flex justify-between items-center bg-white rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium text-[#0F1F3D]">{d.productos?.nombre}</p>
                    <p className="text-xs text-gray-400">{d.productos?.codigo} · IVA {d.productos?.alicuota_iva ?? 21}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0F1F3D]">{Number(d.cantidad).toLocaleString('es-AR')} u.</p>
                    <p className="text-xs text-gray-400">${Number(d.subtotal).toLocaleString('es-AR')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#0F1F3D] rounded-xl p-3 flex justify-between items-center">
              <span className="text-white text-sm">Total</span>
              <span className="text-white font-bold text-lg">${Number(pedido.total).toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={generarRemitoPDF}
              className="w-full bg-[#0F1F3D] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1a2f5a] transition-colors"
            >
              🖨️ Imprimir / Guardar PDF
            </button>
            <button
              onClick={() => setVistaRemito(false)}
              className="w-full border border-gray-200 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">

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

        <div className="space-y-4 mb-5">
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

          {/* Detalle productos */}
          {detalles.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">Productos</p>
              <div className="space-y-2">
                {detalles.map((d, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 rounded-lg p-2.5">
                    <div>
                      <p className="text-sm font-medium text-[#0F1F3D]">{d.productos?.nombre}</p>
                      <p className="text-xs text-gray-400">{d.cantidad} u. · ${Number(d.precio_unitario).toLocaleString('es-AR')} c/u</p>
                    </div>
                    <p className="text-sm font-bold text-[#0F1F3D]">${Number(d.subtotal).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {pedido.nota && (
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-xs text-yellow-600 font-medium">Nota</p>
              <p className="text-sm text-yellow-800 mt-1">{pedido.nota}</p>
            </div>
          )}

          {pedido.descuento > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Descuento aplicado</span>
              <span className="text-orange-600">-${Number(pedido.descuento).toLocaleString('es-AR')}</span>
            </div>
          )}
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <div className="space-y-2">

          {pedido.estado === 'pendiente' && (
            <div className="flex gap-3">
              <button onClick={() => cambiarEstado('rechazado')} disabled={loading}
                className="flex-1 border border-red-200 text-red-600 rounded-lg py-2.5 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50">
                Rechazar
              </button>
              <button onClick={() => cambiarEstado('aprobado')} disabled={loading}
                className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
                Aprobar pedido
              </button>
            </div>
          )}

          {pedido.estado === 'aprobado' && (
            <>
              <button
                onClick={() => setVistaRemito(true)}
                className="w-full bg-[#0F1F3D] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#1a2f5a] transition-colors"
              >
                📄 Generar remito
              </button>
              <button onClick={() => cambiarEstado('en_reparto')} disabled={loading}
                className="w-full bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50">
                🚚 Enviar a reparto
              </button>
            </>
          )}

          {pedido.estado === 'en_reparto' && (
            <>
              <button
                onClick={() => setVistaRemito(true)}
                className="w-full border border-[#0F1F3D] text-[#0F1F3D] rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                📄 Ver remito
              </button>
              <button onClick={() => cambiarEstado('entregado')} disabled={loading}
                className="w-full bg-purple-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50">
                ✅ Marcar como entregado
              </button>
            </>
          )}

          {pedido.estado === 'entregado' && (
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">Este pedido fue entregado.</p>
              <p className="text-sm text-[#00C896] font-medium mt-1">
                Próximo paso → Generar factura
              </p>
            </div>
          )}

          <button onClick={onClose}
            className="w-full border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default PedidoDetalle