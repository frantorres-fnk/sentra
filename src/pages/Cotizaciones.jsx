import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CotizacionModal from '../components/CotizacionModal'
import CotizacionDetalle from '../components/CotizacionDetalle'

const estadoConfig = {
  borrador:  { label: 'Borrador',  color: 'bg-gray-100 text-gray-600' },
  enviada:   { label: 'Enviada',   color: 'bg-blue-50 text-blue-600' },
  aprobada:  { label: 'Aprobada',  color: 'bg-green-50 text-green-600' },
  rechazada: { label: 'Rechazada', color: 'bg-red-50 text-red-600' },
  vencida:   { label: 'Vencida',   color: 'bg-gray-100 text-gray-400' },
}

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cotizacionSeleccionada, setCotizacionSeleccionada] = useState(null)

  const fetchCotizaciones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cotizaciones')
      .select(`
        *,
        clientes (id, razon_social, nombre_fantasia),
        usuarios (id, nombre)
      `)
      .order('created_at', { ascending: false })
    if (!error) setCotizaciones(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchCotizaciones() }, [])

  // Marcar vencidas automáticamente
  const cotizacionesConEstado = cotizaciones.map(c => {
    if (c.estado === 'enviada' && c.vencimiento && new Date(c.vencimiento) < new Date()) {
      return { ...c, estado: 'vencida' }
    }
    return c
  })

  const cotizacionesFiltradas = filtroEstado === 'todos'
    ? cotizacionesConEstado
    : cotizacionesConEstado.filter(c => c.estado === filtroEstado)

  const pendientes = cotizacionesConEstado.filter(c => c.estado === 'enviada').length

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Cotizaciones</h2>
          <p className="text-gray-500 text-sm mt-0.5">{cotizaciones.length} cotizaciones</p>
        </div>
        <div className="flex items-center gap-2">
          {pendientes > 0 && (
            <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-medium">
              📤 {pendientes} enviada{pendientes > 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-[#00C896] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
          >
            + Nueva
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'borrador', 'enviada', 'aprobada', 'rechazada', 'vencida'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filtroEstado === e ? 'bg-[#0F1F3D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todas' : estadoConfig[e]?.label}
            {e !== 'todos' && (
              <span className="ml-1 opacity-60">
                ({cotizacionesConEstado.filter(c => c.estado === e).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : cotizacionesFiltradas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {filtroEstado === 'todos' ? 'No hay cotizaciones todavía.' : `No hay cotizaciones ${estadoConfig[filtroEstado]?.label.toLowerCase()}s.`}
        </div>
      ) : (
        <>
          {/* MOBILE — tarjetas */}
          <div className="md:hidden space-y-3">
            {cotizacionesFiltradas.map((c) => (
              <div
                key={c.id}
                onClick={() => setCotizacionSeleccionada(c)}
                className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm active:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{c.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm font-semibold text-[#0F1F3D] mt-0.5">{c.clientes?.razon_social}</p>
                    {c.clientes?.nombre_fantasia && (
                      <p className="text-xs text-[#00C896]">{c.clientes.nombre_fantasia}</p>
                    )}
                    {c.usuarios?.nombre && <p className="text-xs text-gray-400">👤 {c.usuarios.nombre}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoConfig[c.estado]?.color}`}>
                      {estadoConfig[c.estado]?.label}
                    </span>
                    <span className="text-sm font-bold text-[#0F1F3D]">
                      ${Number(c.total || 0).toLocaleString('es-AR')}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">
                    📅 {new Date(c.created_at).toLocaleDateString('es-AR')}
                  </span>
                  {c.vencimiento && (
                    <span className={`text-xs ${new Date(c.vencimiento) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                      Vence: {new Date(c.vencimiento).toLocaleDateString('es-AR')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">N°</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendedor</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Vencimiento</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cotizacionesFiltradas.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setCotizacionSeleccionada(c)}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 text-sm font-mono text-gray-400">
                      #{c.id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-[#0F1F3D]">{c.clientes?.razon_social}</p>
                      {c.clientes?.nombre_fantasia && (
                        <p className="text-xs text-[#00C896]">{c.clientes.nombre_fantasia}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{c.usuarios?.nombre}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                      ${Number(c.total || 0).toLocaleString('es-AR')}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {c.vencimiento ? (
                        <span className={new Date(c.vencimiento) < new Date() ? 'text-red-400' : ''}>
                          {new Date(c.vencimiento).toLocaleDateString('es-AR')}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[c.estado]?.color}`}>
                        {estadoConfig[c.estado]?.label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAbierto && (
        <CotizacionModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchCotizaciones}
        />
      )}

      {cotizacionSeleccionada && (
        <CotizacionDetalle
          cotizacion={cotizacionSeleccionada}
          onClose={() => setCotizacionSeleccionada(null)}
          onActualizado={() => {
            fetchCotizaciones()
            setCotizacionSeleccionada(null)
          }}
        />
      )}
    </div>
  )
}

export default Cotizaciones