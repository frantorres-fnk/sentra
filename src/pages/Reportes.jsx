import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Reportes = () => {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [datos, setDatos] = useState({
    ventasTotales: 0, pedidosTotal: 0, pedidosEntregados: 0,
    cobradoTotal: 0, clientesConDeuda: [], topProductos: [],
    ventasPorEstado: [], ventasPorVendedor: [], rankingClientes: [],
    stockValorizado: [], margenPromedio: 0,
  })

  const fetchReportes = async () => {
    setLoading(true)
    const ahora = new Date()
    let desde = new Date()
    if (periodo === 'hoy') { desde.setHours(0, 0, 0, 0) }
    else if (periodo === 'semana') { desde.setDate(ahora.getDate() - 7) }
    else if (periodo === 'mes') { desde.setDate(1); desde.setHours(0, 0, 0, 0) }
    else if (periodo === 'año') { desde = new Date(ahora.getFullYear(), 0, 1) }
    const desdeISO = desde.toISOString()

    const [
      { data: pedidos }, { data: cobros }, { data: clientes },
      { data: detalles }, { data: stock },
    ] = await Promise.all([
      supabase.from('pedidos').select('estado, total, vendedor_id, usuarios!pedidos_vendedor_id_fkey(nombre), clientes(razon_social)').gte('fecha_pedido', desdeISO),
      supabase.from('cobros').select('monto').eq('estado', 'aprobado').gte('aprobado_at', desdeISO),
      supabase.from('clientes').select('razon_social, saldo_cc').gt('saldo_cc', 0).order('saldo_cc', { ascending: false }).limit(5),
      supabase.from('pedidos_detalle').select('cantidad, subtotal, producto_id, productos(nombre, codigo, precio_costo)').gte('created_at', desdeISO),
      supabase.from('stock').select('cantidad, productos(nombre, precio_costo, precio_venta)'),
    ])

    const ventasTotales = (pedidos || []).filter(p => ['aprobado', 'en_reparto', 'entregado'].includes(p.estado)).reduce((acc, p) => acc + Number(p.total), 0)
    const cobradoTotal = (cobros || []).reduce((acc, c) => acc + Number(c.monto), 0)
    const ventasPorEstado = ['pendiente', 'aprobado', 'en_reparto', 'entregado', 'rechazado'].map(estado => ({ estado, cantidad: (pedidos || []).filter(p => p.estado === estado).length }))

    const vendedorMap = {}
    ;(pedidos || []).filter(p => ['aprobado', 'en_reparto', 'entregado'].includes(p.estado)).forEach(p => {
      const nombre = p.usuarios?.nombre || 'Sin asignar'
      if (!vendedorMap[nombre]) vendedorMap[nombre] = { nombre, total: 0, pedidos: 0 }
      vendedorMap[nombre].total += Number(p.total)
      vendedorMap[nombre].pedidos += 1
    })
    const ventasPorVendedor = Object.values(vendedorMap).sort((a, b) => b.total - a.total)

    const clienteMap = {}
    ;(pedidos || []).filter(p => ['aprobado', 'en_reparto', 'entregado'].includes(p.estado)).forEach(p => {
      const nombre = p.clientes?.razon_social || 'Sin nombre'
      if (!clienteMap[nombre]) clienteMap[nombre] = { nombre, total: 0, pedidos: 0 }
      clienteMap[nombre].total += Number(p.total)
      clienteMap[nombre].pedidos += 1
    })
    const rankingClientes = Object.values(clienteMap).sort((a, b) => b.total - a.total).slice(0, 5)

    const productosMap = {}
    ;(detalles || []).forEach(d => {
      const nombre = d.productos?.nombre || 'Sin nombre'
      if (!productosMap[nombre]) productosMap[nombre] = { nombre, cantidad: 0, total: 0, costo: 0 }
      productosMap[nombre].cantidad += Number(d.cantidad)
      productosMap[nombre].total += Number(d.subtotal)
      productosMap[nombre].costo += Number(d.productos?.precio_costo || 0) * Number(d.cantidad)
    })
    const topProductos = Object.values(productosMap).sort((a, b) => b.total - a.total).slice(0, 5)

    const totalCosto = topProductos.reduce((acc, p) => acc + p.costo, 0)
    const totalVenta = topProductos.reduce((acc, p) => acc + p.total, 0)
    const margenPromedio = totalVenta > 0 ? ((totalVenta - totalCosto) / totalVenta * 100).toFixed(1) : 0

    const stockValorizado = (stock || []).filter(s => s.productos).map(s => ({
      nombre: s.productos.nombre,
      cantidad: Number(s.cantidad),
      valorCosto: Number(s.cantidad) * Number(s.productos.precio_costo || 0),
      valorVenta: Number(s.cantidad) * Number(s.productos.precio_venta || 0),
    })).sort((a, b) => b.valorVenta - a.valorVenta).slice(0, 5)

    const totalStockCosto = (stock || []).reduce((acc, s) => acc + Number(s.cantidad) * Number(s.productos?.precio_costo || 0), 0)
    const totalStockVenta = (stock || []).reduce((acc, s) => acc + Number(s.cantidad) * Number(s.productos?.precio_venta || 0), 0)

    setDatos({ ventasTotales, pedidosTotal: (pedidos || []).length, pedidosEntregados: (pedidos || []).filter(p => p.estado === 'entregado').length, cobradoTotal, clientesConDeuda: clientes || [], topProductos, ventasPorEstado, ventasPorVendedor, rankingClientes, stockValorizado, totalStockCosto, totalStockVenta, margenPromedio })
    setLoading(false)
  }

  useEffect(() => { fetchReportes() }, [periodo])

  const estadoLabel = { pendiente: 'Pendiente', aprobado: 'Aprobado', en_reparto: 'En reparto', entregado: 'Entregado', rechazado: 'Rechazado' }
  const estadoColor = { pendiente: 'bg-yellow-50 text-yellow-600', aprobado: 'bg-green-50 text-green-600', en_reparto: 'bg-blue-50 text-blue-600', entregado: 'bg-purple-50 text-purple-600', rechazado: 'bg-red-50 text-red-600' }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Reportes</h2>
          <p className="text-gray-500 text-sm mt-0.5">Resumen completo del negocio</p>
        </div>
      </div>

      {/* Filtro período — scroll horizontal en mobile */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {['hoy', 'semana', 'mes', 'año'].map(p => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors shrink-0 ${
              periodo === p ? 'bg-[#0F1F3D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Este mes' : 'Este año'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-4">

          {/* Cards principales — 2x2 en mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Ventas totales</p>
              <p className="text-lg font-bold text-[#0F1F3D] mt-1">${datos.ventasTotales.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Cobrado</p>
              <p className="text-lg font-bold text-[#00C896] mt-1">${datos.cobradoTotal.toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Pedidos</p>
              <p className="text-lg font-bold text-[#0F1F3D] mt-1">{datos.pedidosTotal}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-xs text-gray-500">Margen</p>
              <p className="text-lg font-bold text-[#0F1F3D] mt-1">{datos.margenPromedio}%</p>
            </div>
          </div>

          {/* Ventas por vendedor */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-3">Ventas por vendedor</h3>
            {datos.ventasPorVendedor.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
              <div className="space-y-3">
                {datos.ventasPorVendedor.map((v, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm text-gray-600 truncate max-w-[60%]">{v.nombre}</p>
                      <p className="text-sm font-medium text-[#0F1F3D]">${Number(v.total).toLocaleString('es-AR')}</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#00C896] h-1.5 rounded-full" style={{ width: `${Math.min((v.total / datos.ventasTotales) * 100, 100)}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{v.pedidos} pedido{v.pedidos > 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top clientes */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-3">Top clientes</h3>
            {datos.rankingClientes.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
              <div className="space-y-2">
                {datos.rankingClientes.map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'
                      }`}>{i + 1}</span>
                      <p className="text-sm text-gray-600 truncate">{c.nombre}</p>
                    </div>
                    <p className="text-sm font-medium text-[#0F1F3D] shrink-0 ml-2">${Number(c.total).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pedidos por estado */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-3">Pedidos por estado</h3>
            <div className="space-y-2">
              {datos.ventasPorEstado.map(v => (
                <div key={v.estado} className="flex justify-between items-center">
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoColor[v.estado]}`}>{estadoLabel[v.estado]}</span>
                  <span className="text-sm font-medium text-[#0F1F3D]">{v.cantidad}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top productos */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-3">Top productos vendidos</h3>
            {datos.topProductos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos para este período</p>
            ) : (
              <div className="space-y-2">
                {datos.topProductos.map((p, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600 truncate">{p.nombre}</p>
                      <p className="text-xs text-gray-400">{p.cantidad} unidades</p>
                    </div>
                    <p className="text-sm font-medium text-[#0F1F3D] shrink-0 ml-2">${Number(p.total).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Stock valorizado */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-2">Stock valorizado</h3>
            <div className="flex gap-4 mb-3">
              <div>
                <p className="text-xs text-gray-400">A costo</p>
                <p className="text-sm font-bold text-[#0F1F3D]">${Number(datos.totalStockCosto || 0).toLocaleString('es-AR')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">A precio venta</p>
                <p className="text-sm font-bold text-[#00C896]">${Number(datos.totalStockVenta || 0).toLocaleString('es-AR')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {datos.stockValorizado.map((s, i) => (
                <div key={i} className="flex justify-between items-center">
                  <p className="text-xs text-gray-600 truncate">{s.nombre}</p>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xs font-medium text-[#0F1F3D]">${s.valorVenta.toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-400">{s.cantidad} u.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes con deuda */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-3">Clientes con deuda</h3>
            {datos.clientesConDeuda.length === 0 ? (
              <p className="text-sm text-gray-400">Sin deudas pendientes 🎉</p>
            ) : (
              <div className="space-y-2">
                {datos.clientesConDeuda.map((c, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate">{c.razon_social}</p>
                    <p className="text-sm font-medium text-red-600 shrink-0 ml-2">${Number(c.saldo_cc).toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default Reportes