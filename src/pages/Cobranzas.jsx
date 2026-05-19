import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CobroModal from '../components/CobroModal'

const estadoConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-600' },
  aprobado:  { label: 'Aprobado',  color: 'bg-green-50 text-green-600' },
  rechazado: { label: 'Rechazado', color: 'bg-red-50 text-red-600' },
}

const medioPagoLabel = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cheque: 'Cheque',
  mercadopago: 'MercadoPago',
  otro: 'Otro',
}

const Cobranzas = () => {
  const [cobros, setCobros] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [aprobando, setAprobando] = useState(null)

  const fetchCobros = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('cobros')
      .select(`
        *,
        clientes (id, razon_social),
        cargado_por:usuarios!cobros_cargado_por_fkey (id, nombre)
      `)
      .order('created_at', { ascending: false })

    if (!error) setCobros(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCobros()
  }, [])

  const aprobarCobro = async (cobro) => {
    setAprobando(cobro.id)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    await supabase
      .from('cobros')
      .update({
        estado: 'aprobado',
        aprobado_por: usuarioData.id,
        aprobado_at: new Date().toISOString(),
      })
      .eq('id', cobro.id)

    await fetchCobros()
    setAprobando(null)
  }

  const rechazarCobro = async (cobro) => {
    setAprobando(cobro.id)
    await supabase
      .from('cobros')
      .update({ estado: 'rechazado' })
      .eq('id', cobro.id)

    await fetchCobros()
    setAprobando(null)
  }

  const cobrosFiltrados = filtroEstado === 'todos'
    ? cobros
    : cobros.filter(c => c.estado === filtroEstado)

  const pendientes = cobros.filter(c => c.estado === 'pendiente').length

  const totalAprobadoHoy = cobros
    .filter(c => {
      const hoy = new Date().toISOString().split('T')[0]
      return c.estado === 'aprobado' && c.aprobado_at?.startsWith(hoy)
    })
    .reduce((acc, c) => acc + Number(c.monto), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Cobranzas</h2>
          <p className="text-gray-500 mt-1">Registrá y aprobá los cobros del negocio</p>
        </div>
        <div className="flex items-center gap-3">
          {pendientes > 0 && (
            <div className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg text-sm font-medium">
              ⏳ {pendientes} pendiente{pendientes > 1 ? 's' : ''}
            </div>
          )}
          <button
            onClick={() => setModalAbierto(true)}
            className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
          >
            + Registrar cobro
          </button>
        </div>
      </div>

      {/* Card caja del día */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4 inline-block">
        <p className="text-sm text-gray-500">Cobrado hoy</p>
        <p className="text-2xl font-bold text-[#0F1F3D]">
          ${totalAprobadoHoy.toLocaleString('es-AR')}
        </p>
      </div>

      <div className="flex gap-2 mb-4">
        {['todos', 'pendiente', 'aprobado', 'rechazado'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtroEstado === e
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todos' : estadoConfig[e]?.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medio</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado por</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : cobrosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No hay cobros todavía.
                </td>
              </tr>
            ) : (
              cobrosFiltrados.map((c) => (
                <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                    {c.clientes?.razon_social}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {medioPagoLabel[c.medio_pago] || c.medio_pago}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#0F1F3D]">
                    ${Number(c.monto || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {c.cargado_por?.nombre}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {new Date(c.created_at).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[c.estado]?.color}`}>
                      {estadoConfig[c.estado]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {c.estado === 'pendiente' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => rechazarCobro(c)}
                          disabled={aprobando === c.id}
                          className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => aprobarCobro(c)}
                          disabled={aprobando === c.id}
                          className="text-xs bg-[#00C896] text-white px-2 py-1 rounded-lg hover:bg-[#00b386] transition-colors disabled:opacity-50"
                        >
                          Aprobar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <CobroModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchCobros}
        />
      )}
    </div>
  )
}

export default Cobranzas