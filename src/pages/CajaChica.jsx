import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const tipoConfig = {
  ingreso: { label: 'Ingreso', color: 'bg-green-50 text-green-600' },
  egreso:  { label: 'Egreso',  color: 'bg-red-50 text-red-600' },
}

const CajaChica = () => {
  const [operaciones, setOperaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [form, setForm] = useState({
    tipo: 'ingreso',
    concepto: '',
    monto: '',
    medio: 'efectivo',
    nota: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const fetchOperaciones = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('operaciones_internas')
      .select('*, usuarios(nombre)')
      .order('created_at', { ascending: false })

    if (!error) setOperaciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchOperaciones()
  }, [])

  const operacionesFiltradas = filtroTipo === 'todos'
    ? operaciones
    : operaciones.filter(o => o.tipo === filtroTipo)

  const totalIngresos = operaciones
    .filter(o => o.tipo === 'ingreso')
    .reduce((acc, o) => acc + Number(o.monto), 0)

  const totalEgresos = operaciones
    .filter(o => o.tipo === 'egreso')
    .reduce((acc, o) => acc + Number(o.monto), 0)

  const saldo = totalIngresos - totalEgresos

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) {
      setError('No se encontró el usuario.')
      setGuardando(false)
      return
    }

    const { error } = await supabase
      .from('operaciones_internas')
      .insert([{
        empresa_id: usuarioData.empresa_id,
        usuario_id: usuarioData.id,
        tipo: form.tipo,
        concepto: form.concepto,
        monto: Number(form.monto),
        nota: form.nota,
      }])

    if (error) {
      setError('Error al guardar la operación.')
      setGuardando(false)
    } else {
      setForm({ tipo: 'ingreso', concepto: '', monto: '', medio: 'efectivo', nota: '' })
      setModalAbierto(false)
      fetchOperaciones()
    }

    setGuardando(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Caja Chica</h2>
          <p className="text-gray-500 mt-1">Registro privado de movimientos internos</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nueva operación
        </button>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total ingresos</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            ${totalIngresos.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total egresos</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ${totalEgresos.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Saldo</p>
          <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? 'text-[#0F1F3D]' : 'text-red-600'}`}>
            ${saldo.toLocaleString('es-AR')}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        {['todos', 'ingreso', 'egreso'].map(t => (
          <button
            key={t}
            onClick={() => setFiltroTipo(t)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors capitalize ${
              filtroTipo === t
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'todos' ? 'Todos' : t === 'ingreso' ? 'Ingresos' : 'Egresos'}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Concepto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Registrado por</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : operacionesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No hay operaciones todavía.
                </td>
              </tr>
            ) : (
              operacionesFiltradas.map((o) => (
                <tr key={o.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${tipoConfig[o.tipo]?.color}`}>
                      {tipoConfig[o.tipo]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-[#0F1F3D]">{o.concepto}</p>
                    {o.nota && <p className="text-xs text-gray-400">{o.nota}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#0F1F3D]">
                    ${Number(o.monto).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {o.usuarios?.nombre}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {new Date(o.created_at).toLocaleDateString('es-AR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva operación */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-[#0F1F3D]">Nueva operación</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    name="tipo"
                    value={form.tipo}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                  >
                    <option value="ingreso">Ingreso</option>
                    <option value="egreso">Egreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                  <input
                    name="monto"
                    type="number"
                    value={form.monto}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                <input
                  name="concepto"
                  value={form.concepto}
                  onChange={handleChange}
                  placeholder="Descripción de la operación"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medio de pago</label>
                <select
                  name="medio"
                  value={form.medio}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                <input
                  name="nota"
                  value={form.nota}
                  onChange={handleChange}
                  placeholder="Observaciones opcionales"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar operación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CajaChica