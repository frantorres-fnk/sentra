import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const Dashboard = () => {
  const { user } = useAuth()
  const [metricas, setMetricas] = useState({
    clientes: 0,
    pedidosHoy: 0,
    stockBajo: 0,
    cajaHoy: 0,
  })

  useEffect(() => {
    const fetchMetricas = async () => {
      const hoy = new Date().toISOString().split('T')[0]

      const [
        { count: clientes },
        { count: pedidosHoy },
        { data: stockData },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
        supabase.from('pedidos').select('*', { count: 'exact', head: true }).gte('fecha_pedido', hoy),
        supabase.from('stock').select('cantidad, stock_minimo'),
      ])

      const stockBajo = (stockData || []).filter(s =>
        Number(s.stock_minimo) > 0 && Number(s.cantidad) <= Number(s.stock_minimo)
      ).length

      setMetricas({
        clientes: clientes || 0,
        pedidosHoy: pedidosHoy || 0,
        stockBajo,
        cajaHoy: 0,
      })
    }

    fetchMetricas()
  }, [])

  const cards = [
    { label: 'Clientes activos', value: metricas.clientes, icon: '👥' },
    { label: 'Pedidos hoy', value: metricas.pedidosHoy, icon: '🛒' },
    { label: 'Productos con stock bajo', value: metricas.stockBajo, icon: '📦' },
    { label: 'Caja del día', value: `$${metricas.cajaHoy.toLocaleString('es-AR')}`, icon: '💰' },
  ]

  const nombre = user?.email?.split('@')[0] || 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F1F3D]">
          {saludo}, {nombre} 👋
        </h2>
        <p className="text-gray-500 mt-1">Esto es lo que está pasando hoy en tu negocio.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-2xl mb-3">{card.icon}</div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-3xl font-bold text-[#0F1F3D] mt-1">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Dashboard