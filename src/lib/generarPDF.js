import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export const generarFacturaPDF = async (factura, detalles = []) => {
  const doc = new jsPDF()
  const verde = [0, 200, 150]
  const azul = [15, 31, 61]

  // Header
  doc.setFillColor(...azul)
  doc.rect(0, 0, 210, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('SENTRA', 14, 15)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestión inteligente del negocio', 14, 23)

  // Tipo de comprobante
  doc.setFillColor(...verde)
  doc.rect(140, 5, 55, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`FACTURA ${factura.tipo}`, 167, 16, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Punto de venta: ${String(factura.punto_venta || 1).padStart(4, '0')}`, 167, 24, { align: 'center' })

  // Datos del emisor
  doc.setTextColor(...azul)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del emisor', 14, 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Empresa: ${factura.empresa?.nombre || 'Eléctrica Urbano'}`, 14, 58)
  doc.text(`CUIT: ${factura.empresa?.cuit || '-'}`, 14, 65)

  // Datos del cliente
  doc.setTextColor(...azul)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Datos del cliente', 110, 50)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text(`Cliente: ${factura.clientes?.razon_social || '-'}`, 110, 58)
  doc.text(`CUIT: ${factura.clientes?.cuit || '-'}`, 110, 65)
  doc.text(`Condición: ${factura.clientes?.condicion_afip?.replace('_', ' ') || '-'}`, 110, 72)

  // Línea divisoria
  doc.setDrawColor(...verde)
  doc.setLineWidth(0.5)
  doc.line(14, 80, 196, 80)

  // Info factura
  doc.setTextColor(...azul)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Fecha: ${new Date(factura.fecha_emision).toLocaleDateString('es-AR')}`, 14, 88)

  if (factura.cae) {
    doc.text(`CAE: ${factura.cae}`, 110, 88)
    doc.text(`Vencimiento CAE: ${factura.cae_vencimiento ? new Date(factura.cae_vencimiento).toLocaleDateString('es-AR') : '-'}`, 110, 95)
  } else {
    doc.setTextColor(200, 100, 0)
    doc.text('CAE: Pendiente de obtención', 110, 88)
  }

  // Tabla de productos
  doc.setTextColor(...azul)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle', 14, 105)

  const tableData = detalles.length > 0
    ? detalles.map(d => [
        d.productos?.nombre || '-',
        d.cantidad,
        `$${Number(d.precio_unitario).toLocaleString('es-AR')}`,
        `$${Number(d.subtotal).toLocaleString('es-AR')}`,
      ])
    : [['Servicio según pedido', '1', `$${Number(factura.subtotal).toLocaleString('es-AR')}`, `$${Number(factura.subtotal).toLocaleString('es-AR')}`]]

  autoTable(doc, {
    startY: 110,
    head: [['Descripción', 'Cantidad', 'Precio unitario', 'Subtotal']],
    body: tableData,
    headStyles: {
      fillColor: azul,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [244, 246, 249],
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
  })

  const finalY = doc.lastAutoTable.finalY + 10

  // Totales
  doc.setDrawColor(...verde)
  doc.setLineWidth(0.3)
  doc.line(120, finalY, 196, finalY)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  doc.text('Subtotal:', 130, finalY + 8)
  doc.text(`$${Number(factura.subtotal).toLocaleString('es-AR')}`, 196, finalY + 8, { align: 'right' })

  if (Number(factura.iva) > 0) {
    doc.text('IVA 21%:', 130, finalY + 16)
    doc.text(`$${Number(factura.iva).toLocaleString('es-AR')}`, 196, finalY + 16, { align: 'right' })
  }

  doc.setFillColor(...azul)
  doc.rect(120, finalY + 20, 76, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('TOTAL:', 130, finalY + 27)
  doc.text(`$${Number(factura.total).toLocaleString('es-AR')}`, 196, finalY + 27, { align: 'right' })

  // Footer
  doc.setFillColor(...azul)
  doc.rect(0, 275, 210, 22, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('SENTRA — powered by Fenikso', 105, 283, { align: 'center' })
  doc.text('sentra.fenikso.io', 105, 290, { align: 'center' })

  doc.save(`factura-${factura.tipo}-${factura.id?.slice(-6).toUpperCase()}.pdf`)
}