import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StockModal from '../components/StockModal'

const Stock = () => {
  const [stockItems, setStockItems] = useState([])
  const [depositos, setDepositos] = useState([])
  const [depositoSeleccionado, setDepositoSeleccionado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)

  const fetchData = async () => {
    setLoading(true)

    const { data: deps } = await supabase
      .from('depositos')
      .select('*')
      .eq('activo', true)
      .order('nombre')

    setDepositos(deps || [])

    const { data: stock } = await supabase
      .from('stock')
      .select(`
        *,
        productos (id, nombre, codigo, categoria, precio_venta),
        depositos (id, nombre)
      `)
      .order('updated_at', { ascending: false })

    setStockItems(stock || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stockFiltrado = stockItems.filter(s => {
    const matchBusqueda =
      s.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.productos?.codigo?.toLowerCase().includes(busqueda.toLowerCase())
    const matchDeposito =
      depositoSeleccionado === 'todos' || s.deposito_id === depositoSeleccionado
    return matchBusqueda && matchDeposito
  })

  const stockBajo = stockItems.filter(s =>
    Number(s.cantidad) <= Number(s.stock_minimo) && Number(s.stock_minimo) > 0
  ).length

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Stock</h2>
          <p className="text-gray-500 mt-1">Control de inventario por depósito</p>
        </div>
        <div className="flex items-center gap-3">
          {stockBajo > 0 && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium">
              ⚠️ {stockBajo} producto{stockBajo > 1 ? 's' : ''} con stock bajo
            </div>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
          >
            + Cargar stock
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className="w-full max-w-md border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        />
        <select
          value={depositoSeleccionado}
          onChange={(e) => setDepositoSeleccionado(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
        >
          <option value="todos">Todos los depósitos</option>
          {depositos.map(d => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Depósito</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservado</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponible</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  Cargando...
                </td>
              </tr>
            ) : stockFiltrado.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 text-sm">
                  {busqueda ? 'No se encontraron productos.' : 'No hay stock cargado todavía.'}
                </td>
              </tr>
            ) : (
              stockFiltrado.map((s) => {
                const disponible = Number(s.cantidad) - Number(s.cantidad_reservada)
                const stockMinimo = Number(s.stock_minimo) || 0
                const esBajo = stockMinimo > 0 && Number(s.cantidad) <= stockMinimo

                return (
                  <tr key={s.id} className={`border-t border-gray-50 hover:bg-gray-50 transition-colors ${esBajo ? 'bg-red-50/30' : ''}`}>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-[#0F1F3D]">{s.productos?.nombre}</p>
                      {s.productos?.codigo && <p className="text-xs text-gray-400">{s.productos.codigo}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{s.depositos?.nombre}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">{Number(s.cantidad).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{Number(s.cantidad_reservada).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">{disponible.toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      {esBajo ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">Stock bajo</span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">OK</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <StockModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchData}
        />
      )}
    </div>
  )
}

export default Stock