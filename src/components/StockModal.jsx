import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const StockModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [productos, setProductos] = useState([])
  const [depositos, setDepositos] = useState([])
  const [form, setForm] = useState({
    producto_id: '',
    deposito_id: '',
    cantidad: '',
    stock_minimo: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, codigo')
        .eq('activo', true)
        .order('nombre')

      const { data: deps } = await supabase
        .from('depositos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre')

      setProductos(prods || [])
      setDepositos(deps || [])

      if (deps?.length > 0) {
        setForm(f => ({ ...f, deposito_id: deps[0].id }))
      }
    }
    fetchData()
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
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) {
      setError('No se encontró la empresa.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('stock')
      .upsert({
        empresa_id: usuarioData.empresa_id,
        producto_id: form.producto_id,
        deposito_id: form.deposito_id,
        cantidad: Number(form.cantidad) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
      }, {
        onConflict: 'producto_id,deposito_id'
      })

    if (error) {
      setError('Error al cargar el stock.')
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
          <h3 className="text-lg font-bold text-[#0F1F3D]">Cargar stock</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
            <select
              name="producto_id"
              value={form.producto_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              <option value="">Seleccioná un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Depósito *</label>
            <select
              name="deposito_id"
              value={form.deposito_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              {depositos.map(d => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <input
                name="cantidad"
                type="number"
                value={form.cantidad}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
              <input
                name="stock_minimo"
                type="number"
                value={form.stock_minimo}
                onChange={handleChange}
                placeholder="0"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
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
              {loading ? 'Guardando...' : 'Cargar stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockModal