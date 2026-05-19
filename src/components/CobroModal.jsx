import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CobroModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientes, setClientes] = useState([])
  const [form, setForm] = useState({
    cliente_id: '',
    medio_pago: 'efectivo',
    monto: '',
    referencia: '',
    nota: '',
  })

  useEffect(() => {
    const fetchClientes = async () => {
      const { data } = await supabase
        .from('clientes')
        .select('id, razon_social')
        .eq('activo', true)
        .order('razon_social')
      setClientes(data || [])
    }
    fetchClientes()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) {
      setError('No se encontró la empresa.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('cobros')
      .insert([{
        empresa_id: usuarioData.empresa_id,
        cliente_id: form.cliente_id,
        cargado_por: usuarioData.id,
        medio_pago: form.medio_pago,
        monto: Number(form.monto),
        referencia: form.referencia,
        nota: form.nota,
        estado: 'pendiente',
      }])

    if (error) {
      setError('Error al registrar el cobro.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Registrar cobro</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              <option value="">Seleccioná un cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Medio de pago *</label>
              <select
                name="medio_pago"
                value={form.medio_pago}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="cheque">Cheque</option>
                <option value="mercadopago">MercadoPago</option>
                <option value="otro">Otro</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
            <input
              name="referencia"
              value={form.referencia}
              onChange={handleChange}
              placeholder="Nº transferencia, cheque, etc."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
            <input
              name="nota"
              value={form.nota}
              onChange={handleChange}
              placeholder="Observaciones..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            />
          </div>

          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              ⚠️ El cobro quedará pendiente de aprobación por el dueño antes de impactar en caja.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Registrar cobro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CobroModal