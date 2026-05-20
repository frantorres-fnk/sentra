import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import StockModal from '../components/StockModal'
import StockEditar from '../components/StockEditar'
import { useRol } from '../hooks/useRol'

const Stock = () => {
  const [stockItems, setStockItems] = useState([])
  const [depositos, setDepositos] = useState([])
  const [depositoSeleccionado, setDepositoSeleccionado] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [itemSeleccionado, setItemSeleccionado] = useState(null)
  const { rol } = useRol()

  const fetchData = async () => {
    setLoading(true)
    const { data: deps } = await supabase.from('depositos').select('*').eq('activo', true).order('nombre')
    setDepositos(deps || [])
    const { data: stock } = await supabase
      .from('stock')
      .select(`*, productos (id, nombre, codigo, categoria, precio_venta), depositos (id, nombre)`)
      .order('updated_at', { ascending: false })
    setStockItems(stock || [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  const stockFiltrado = stockItems.filter(s => {
    const matchBusqueda =
      s.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      s.productos?.codigo?.toLowerCase().includes(busqueda.toLowerCase())
    const matchDeposito = depositoSeleccionado === 'todos' || s.deposito_id === depositoSeleccionado
    return matchBusqueda && matchDeposito
  })

  const stockBajo = stockItems.filter(s => Number(s.cantidad) <= Number(s.stock_minimo) && Number(s.stock_minimo) > 0).length
  const esDueno = rol === 'Dueño'

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Stock</h2>
          <p className="text-gray-500 text-sm mt-0.5">Control de inventario por depósito</p>
        </div>
        <div className="flex items-center gap-2">
          {stockBajo > 0 && (
            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium">
              ⚠️ {stockBajo} bajo
            </span>
          )}
          <button onClick={() => setModalAbierto(true)} className="bg-[#00C896] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors">
            + Stock
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o código..."
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
          />
        </div>
        <select
          value={depositoSeleccionado}
          onChange={(e) => setDepositoSeleccionado(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896] shrink-0"
        >
          <option value="todos">Todos</option>
          {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : stockFiltrado.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {busqueda ? 'No se encontraron productos.' : 'No hay stock cargado todavía.'}
        </div>
      ) : (
        <>
          {/* MOBILE — tarjetas */}
          <div className="md:hidden space-y-3">
            {stockFiltrado.map((s) => {
              const disponible = Number(s.cantidad) - Number(s.cantidad_reservada)
              const esBajo = Number(s.stock_minimo) > 0 && Number(s.cantidad) <= Number(s.stock_minimo)
              return (
                <div
                  key={s.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm ${esBajo ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0F1F3D] truncate">{s.productos?.nombre}</p>
                      {s.productos?.codigo && <p className="text-xs text-gray-400">{s.productos.codigo}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">📦 {s.depositos?.nombre}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                      {esBajo ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">⚠️ Stock bajo</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600">OK</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 pt-2 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400">Cantidad</p>
                      <p className="text-sm font-bold text-[#0F1F3D]">{Number(s.cantidad).toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Reservado</p>
                      <p className="text-sm font-medium text-gray-600">{Number(s.cantidad_reservada).toLocaleString('es-AR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Disponible</p>
                      <p className="text-sm font-bold text-[#00C896]">{disponible.toLocaleString('es-AR')}</p>
                    </div>
                    {esDueno && (
                      <button
                        onClick={() => setItemSeleccionado(s)}
                        className="ml-auto text-xs text-[#00C896] hover:underline self-end"
                      >
                        Ajustar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Depósito</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cantidad</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reservado</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Disponible</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  {esDueno && <th className="px-5 py-3.5"></th>}
                </tr>
              </thead>
              <tbody>
                {stockFiltrado.map((s) => {
                  const disponible = Number(s.cantidad) - Number(s.cantidad_reservada)
                  const esBajo = Number(s.stock_minimo) > 0 && Number(s.cantidad) <= Number(s.stock_minimo)
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
                        {esBajo
                          ? <span className="text-xs px-2 py-1 rounded-full bg-red-50 text-red-600">Stock bajo</span>
                          : <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-600">OK</span>
                        }
                      </td>
                      {esDueno && (
                        <td className="px-5 py-3.5">
                          <button onClick={() => setItemSeleccionado(s)} className="text-xs text-[#00C896] hover:underline">Ajustar</button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAbierto && <StockModal onClose={() => setModalAbierto(false)} onGuardado={fetchData} />}
      {itemSeleccionado && (
        <StockEditar
          item={itemSeleccionado}
          onClose={() => setItemSeleccionado(null)}
          onActualizado={() => { fetchData(); setItemSeleccionado(null) }}
        />
      )}
    </div>
  )
}

export default Stock