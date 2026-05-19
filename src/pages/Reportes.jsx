import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Reportes = () => {
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('mes')
  const [datos, setDatos] = useState({
    ventasTotales: 0,
    pedidosTotal: 0,
    pedidosEntregados: 0,
    cobradoTotal: 0,
    clientesConDeuda: [],
    topProductos: [],
    ventasPorEstado: [],
  })

  const fetchReportes = async () => {
    setLoading(true)

    const ahora = new Date()
    let desde = new Date()

    if (periodo === 'hoy') {
      desde.setHours(0, 0, 0, 0)
    } else if (periodo === 'semana') {
      desde.setDate(ahora.getDate() - 7)
    } else if (periodo === 'mes') {
      desde.setDate(1)
      desde.setHours(0, 0, 0, 0)
    } else if (periodo === 'año') {
      desde = new Date(ahora.getFullYear(), 0, 1)
    }

    const desdeISO = desde.toISOString()

    const [
      { data: pedidos },
      { data: cobros },
      { data: clientes },
      { data: detalles },
    ] = await Promise.all([
      supabase.from('pedidos').select('estado, total').gte('fecha_pedido', desdeISO),
      supabase.from('cobros').select('monto').eq('estado', 'aprobado').gte('aprobado_at', desdeISO),
      supabase.from('clientes').select('razon_social, saldo_cc').gt('saldo_cc', 0).order('saldo_cc', { ascending: false }).limit(5),
      supabase.from('pedidos_detalle').select(`
        cantidad, subtotal,
        productos (nombre, codigo)
      `).gte('created_at', desdeISO),
    ])

    const ventasTotales = (pedidos || [])
      .filter(p => ['aprobado', 'en_reparto', 'entregado'].includes(p.estado))
      .reduce((acc, p) => acc + Number(p.total), 0)

    const cobradoTotal = (cobros || []).reduce((acc, c) => acc + Number(c.monto), 0)

    const pedidosEntregados = (pedidos || []).filter(p => p.estado === 'entregado').length

    const ventasPorEstado = ['pendiente', 'aprobado', 'en_reparto', 'entregado', 'rechazado'].map(estado => ({
      estado,
      cantidad: (pedidos || []).filter(p => p.estado === estado).length
    }))

    const productosMap = {}
    ;(detalles || []).forEach(d => {
      const nombre = d.productos?.nombre || 'Sin nombre'
      if (!productosMap[nombre]) productosMap[nombre] = { nombre, cantidad: 0, total: 0 }
      productosMap[nombre].cantidad += Number(d.cantidad)
      productosMap[nombre].total += Number(d.subtotal)
    })
    const topProductos = Object.values(productosMap)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)

    setDatos({
      ventasTotales,
      pedidosTotal: (pedidos || []).length,
      pedidosEntregados,
      cobradoTotal,
      clientesConDeuda: clientes || [],
      topProductos,
      ventasPorEstado,
    })

    setLoading(false)
  }

  useEffect(() => {
    fetchReportes()
  }, [periodo])

  const estadoLabel = {
    pendiente:  'Pendiente',
    aprobado:   'Aprobado',
    en_reparto: 'En reparto',
    entregado:  'Entregado',
    rechazado:  'Rechazado',
  }

  const estadoColor = {
    pendiente:  'bg-yellow-50 text-yellow-600',
    aprobado:   'bg-green-50 text-green-600',
    en_reparto: 'bg-blue-50 text-blue-600',
    entregado:  'bg-purple-50 text-purple-600',
    rechazado:  'bg-red-50 text-red-600',
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Reportes</h2>
          <p className="text-gray-500 mt-1">Resumen del negocio por período</p>
        </div>
        <div className="flex gap-2">
          {['hoy', 'semana', 'mes', 'año'].map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
                periodo === p
                  ? 'bg-[#0F1F3D] text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p === 'hoy' ? 'Hoy' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Este mes' : 'Este año'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : (
        <div className="space-y-6">

          {/* Cards principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Ventas totales</p>
              <p className="text-2xl font-bold text-[#0F1F3D] mt-1">
                ${datos.ventasTotales.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Cobrado</p>
              <p className="text-2xl font-bold text-[#00C896] mt-1">
                ${datos.cobradoTotal.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Pedidos totales</p>
              <p className="text-2xl font-bold text-[#0F1F3D] mt-1">{datos.pedidosTotal}</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Entregas realizadas</p>
              <p className="text-2xl font-bold text-[#0F1F3D] mt-1">{datos.pedidosEntregados}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Pedidos por estado */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-[#0F1F3D] mb-4">Pedidos por estado</h3>
              <div className="space-y-2">
                {datos.ventasPorEstado.map(v => (
                  <div key={v.estado} className="flex justify-between items-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${estadoColor[v.estado]}`}>
                      {estadoLabel[v.estado]}
                    </span>
                    <span className="text-sm font-medium text-[#0F1F3D]">{v.cantidad}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top productos */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-[#0F1F3D] mb-4">Top productos vendidos</h3>
              {datos.topProductos.length === 0 ? (
                <p className="text-sm text-gray-400">Sin datos para este período</p>
              ) : (
                <div className="space-y-2">
                  {datos.topProductos.map((p, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 truncate flex-1">{p.nombre}</p>
                      <p className="text-sm font-medium text-[#0F1F3D] ml-2">
                        ${Number(p.total).toLocaleString('es-AR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Clientes con deuda */}
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-[#0F1F3D] mb-4">Clientes con deuda</h3>
              {datos.clientesConDeuda.length === 0 ? (
                <p className="text-sm text-gray-400">Sin deudas pendientes 🎉</p>
              ) : (
                <div className="space-y-2">
                  {datos.clientesConDeuda.map((c, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <p className="text-sm text-gray-600 truncate flex-1">{c.razon_social}</p>
                      <p className="text-sm font-medium text-red-600 ml-2">
                        ${Number(c.saldo_cc).toLocaleString('es-AR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default Reportes