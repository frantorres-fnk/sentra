import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Dashboard = () => {
  const { user } = useAuth()
  const [metricas, setMetricas] = useState({
    clientes: 0, pedidosHoy: 0, stockBajo: 0, cajaHoy: 0,
  })

  useEffect(() => {
    const fetchMetricas = async () => {
      const hoy = new Date().toISOString().split('T')[0]
      const [
        { count: clientes },
        { count: pedidosHoy },
        { data: stockData },
        { data: cobrosHoy },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).gte('fecha_pedido', hoy),
        supabase.from('stock').select('cantidad, stock_minimo'),
        supabase.from('cobros').select('monto').eq('estado', 'aprobado').gte('aprobado_at', hoy),
      ])

      const stockBajo = (stockData || []).filter(s =>
        Number(s.stock_minimo) > 0 && Number(s.cantidad) <= Number(s.stock_minimo)
      ).length

      const cajaHoy = (cobrosHoy || []).reduce((acc, c) => acc + Number(c.monto), 0)
      setMetricas({ clientes: clientes || 0, pedidosHoy: pedidosHoy || 0, stockBajo, cajaHoy })
    }
    fetchMetricas()
  }, [])

  const cards = [
    { label: 'Clientes activos',        value: metricas.clientes,                                    icon: '👥' },
    { label: 'Pedidos hoy',             value: metricas.pedidosHoy,                                  icon: '🛒' },
    { label: 'Stock bajo',              value: metricas.stockBajo,                                   icon: '📦' },
    { label: 'Caja del día',            value: `$${metricas.cajaHoy.toLocaleString('es-AR')}`,       icon: '💰' },
  ]

  const nombre = user?.email?.split('@')[0] || 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="h-full flex flex-col">

      {/* Saludo */}
      <div className="mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">
          {saludo}, {nombre} 👋
        </h2>
        <p className="text-gray-500 text-sm mt-0.5">Esto es lo que está pasando hoy en tu negocio.</p>
      </div>

      {/* Cards — 2x2 en mobile, 4 en desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-xl mb-2">{card.icon}</div>
            <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
            <p className="text-2xl font-bold text-[#0F1F3D] mt-1">{card.value}</p>
          </div>
        ))}
      </div>

    </div>
  )
}

export default Dashboard