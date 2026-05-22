import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

  // ── PDF ──────────────────────────────────────────────────────────────────
  const handlePDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const PW = 210
    const ML = 14
    const MR = 14
    const CW = PW - ML - MR

    // Header
    doc.setFillColor(15, 110, 86)
    doc.rect(0, 0, PW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.text('SENTRA', ML, 13)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('powered by Fenikso', ML, 19)

    // Número y estado (derecha del header)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`COTIZACIÓN #${cotizacion.id.slice(-6).toUpperCase()}`, PW - MR, 11, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text((estadoConfig[estadoActual]?.label || '').toUpperCase(), PW - MR, 18, { align: 'right' })

    // Datos cliente
    let y = 32
    doc.setTextColor(30, 30, 30)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('CLIENTE', ML, y)

    y += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(15, 31, 61)
    doc.text(cotizacion.clientes?.razon_social || '—', ML, y)

    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(90, 90, 90)
    if (cotizacion.clientes?.nombre_fantasia) { doc.text(cotizacion.clientes.nombre_fantasia, ML, y); y += 4 }
    if (cotizacion.clientes?.email)           { doc.text(cotizacion.clientes.email, ML, y); y += 4 }
    if (cotizacion.clientes?.telefono)        { doc.text(`Tel: ${cotizacion.clientes.telefono}`, ML, y); y += 4 }

    // Fechas (columna derecha)
    const col2 = ML + CW / 2 + 10
    let y2 = 36
    const fechaEmision   = new Date(cotizacion.created_at).toLocaleDateString('es-AR')
    const fechaVencimiento = cotizacion.vencimiento
      ? new Date(cotizacion.vencimiento).toLocaleDateString('es-AR')
      : '—'

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(120, 120, 120)
    doc.text('Fecha de emisión:', col2, y2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(fechaEmision, col2 + 32, y2)

    y2 += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('Válida hasta:', col2, y2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(new Date(cotizacion.vencimiento) < new Date() ? 180 : 30, 30, 30)
    doc.text(fechaVencimiento, col2 + 32, y2)

    y2 += 5
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(120, 120, 120)
    doc.text('Vendedor:', col2, y2)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    doc.text(cotizacion.usuarios?.nombre || '—', col2 + 32, y2)

    // Separador
    y = Math.max(y + 4, y2 + 8)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0.3)
    doc.line(ML, y, PW - MR, y)
    y += 6

    // Tabla de productos
    autoTable(doc, {
      startY: y,
      head: [['Código', 'Producto', 'Cant.', 'Precio unit.', 'Dto.', 'Subtotal']],
      body: detalles.map(d => [
        d.productos?.codigo || '—',
        d.productos?.nombre || '—',
        Number(d.cantidad).toLocaleString('es-AR'),
        `$${Number(d.precio_unitario).toLocaleString('es-AR')}`,
        d.descuento > 0 ? `${d.descuento}%` : '—',
        `$${Number(d.subtotal).toLocaleString('es-AR')}`,
      ]),
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 3, right: 3 }, textColor: [30, 30, 30] },
      headStyles: { fillColor: [15, 110, 86], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 251, 249] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 16, halign: 'right' },
        3: { cellWidth: 28, halign: 'right' },
        4: { cellWidth: 14, halign: 'right' },
        5: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: ML, right: MR },
    })

    y = doc.lastAutoTable.finalY + 6

    // Totales
    const totX = PW - MR - 65
    const totW = 65

    doc.setFillColor(240, 240, 240)
    doc.roundedRect(totX, y, totW, Number(cotizacion.descuento) > 0 ? 21 : 14, 2, 2, 'F')

    let yt = y + 6
    if (Number(cotizacion.descuento) > 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(90, 90, 90)
      doc.text('Subtotal:', totX + 4, yt)
      doc.text(`$${Number(cotizacion.subtotal).toLocaleString('es-AR')}`, totX + totW - 3, yt, { align: 'right' })
      yt += 6
      doc.setTextColor(200, 80, 30)
      doc.text('Descuento:', totX + 4, yt)
      doc.text(`-$${Number(cotizacion.descuento).toLocaleString('es-AR')}`, totX + totW - 3, yt, { align: 'right' })
      yt += 6
    } else {
      yt += 1
    }

    doc.setFillColor(15, 110, 86)
    doc.rect(totX, yt - 4.5, totW, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text('TOTAL:', totX + 4, yt + 0.5)
    doc.text(`$${Number(cotizacion.total).toLocaleString('es-AR')}`, totX + totW - 3, yt + 0.5, { align: 'right' })

    y = yt + 12

    // Nota
    if (cotizacion.nota) {
      doc.setFillColor(255, 251, 230)
      const notaLines = doc.splitTextToSize(cotizacion.nota, CW - 8)
      doc.roundedRect(ML, y, CW, notaLines.length * 4.5 + 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(150, 100, 10)
      doc.text('NOTA', ML + 4, y + 6)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8.5)
      doc.setTextColor(100, 70, 10)
      doc.text(notaLines, ML + 4, y + 11)
      y += notaLines.length * 4.5 + 16
    }

    // Aviso validez vencida
    if (new Date(cotizacion.vencimiento) < new Date()) {
      doc.setFillColor(255, 235, 235)
      doc.roundedRect(ML, y, CW, 9, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(180, 50, 30)
      doc.text(`Esta cotización venció el ${new Date(cotizacion.vencimiento).toLocaleDateString('es-AR')}.`, ML + 4, y + 6)
    }

    // Footer
    doc.setFillColor(15, 110, 86)
    doc.rect(0, 285, PW, 12, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text('Sentra ERP — Fenikso', ML, 291)
    doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')}`, PW - MR, 291, { align: 'right' })

    doc.save(`cotizacion-${cotizacion.id.slice(-6).toUpperCase()}.pdf`)
  }
  // ────────────────────────────────────────────────────────────────────────

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
          <button
            onClick={handlePDF}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors"
          >
            📄 PDF
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