import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const StockEditar = ({ item, onClose, onActualizado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modo, setModo] = useState('ajuste')
  const [depositos, setDepositos] = useState([])
  const [form, setForm] = useState({
    cantidad: item.cantidad || 0,
    stock_minimo: item.stock_minimo || 0,
    deposito_destino_id: '',
    cantidad_transferir: '',
  })

  useEffect(() => {
    const fetchDepositos = async () => {
      const { data } = await supabase
        .from('depositos')
        .select('*')
        .eq('activo', true)
        .order('nombre')
      setDepositos((data || []).filter(d => d.id !== item.deposito_id))
    }
    fetchDepositos()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAjuste = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    const { error } = await supabase
      .from('stock')
      .update({
        cantidad: Number(form.cantidad),
        stock_minimo: Number(form.stock_minimo),
      })
      .eq('id', item.id)

    if (error) {
      setError('Error al actualizar el stock.')
      setLoading(false)
      return
    }

    await supabase.from('movimientos_stock').insert([{
      empresa_id: usuarioData.empresa_id,
      producto_id: item.producto_id,
      deposito_id: item.deposito_id,
      usuario_id: usuarioData.id,
      tipo: 'ajuste',
      cantidad: Number(form.cantidad) - Number(item.cantidad),
      nota: 'Ajuste manual de stock',
    }])

    onActualizado()
    onClose()
  }

  const handleTransferencia = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.deposito_destino_id) {
      setError('Seleccioná el depósito destino.')
      setLoading(false)
      return
    }

    const cantTransferir = Number(form.cantidad_transferir)

    if (cantTransferir <= 0) {
      setError('La cantidad debe ser mayor a 0.')
      setLoading(false)
      return
    }

    if (cantTransferir > Number(item.cantidad)) {
      setError('No hay suficiente stock para transferir.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('id, empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    // Descontar del depósito origen
    await supabase
      .from('stock')
      .update({ cantidad: Number(item.cantidad) - cantTransferir })
      .eq('id', item.id)

    // Ver si ya existe stock en depósito destino
    const { data: stockDestino } = await supabase
      .from('stock')
      .select('*')
      .eq('producto_id', item.producto_id)
      .eq('deposito_id', form.deposito_destino_id)
      .single()

    if (stockDestino) {
      // Sumar al existente
      await supabase
        .from('stock')
        .update({ cantidad: Number(stockDestino.cantidad) + cantTransferir })
        .eq('id', stockDestino.id)
    } else {
      // Crear nuevo registro
      await supabase
        .from('stock')
        .insert([{
          empresa_id: usuarioData.empresa_id,
          producto_id: item.producto_id,
          deposito_id: form.deposito_destino_id,
          cantidad: cantTransferir,
          stock_minimo: 0,
        }])
    }

    // Registrar movimiento
    await supabase.from('movimientos_stock').insert([{
      empresa_id: usuarioData.empresa_id,
      producto_id: item.producto_id,
      deposito_id: item.deposito_id,
      usuario_id: usuarioData.id,
      tipo: 'transferencia',
      cantidad: cantTransferir,
      referencia: form.deposito_destino_id,
      nota: `Transferencia al depósito ${depositos.find(d => d.id === form.deposito_destino_id)?.nombre}`,
    }])

    onActualizado()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-[#0F1F3D]">Gestionar stock</h3>
            <p className="text-sm text-gray-500 mt-1">{item.productos?.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-400">Depósito</p>
              <p className="font-medium text-[#0F1F3D]">{item.depositos?.nombre}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Stock actual</p>
              <p className="font-medium text-[#0F1F3D]">{Number(item.cantidad).toLocaleString('es-AR')}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setModo('ajuste')}
            className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
              modo === 'ajuste'
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ajustar cantidad
          </button>
          {depositos.length > 0 && (
            <button
              onClick={() => setModo('transferencia')}
              className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                modo === 'transferencia'
                  ? 'bg-[#0F1F3D] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Transferir depósito
            </button>
          )}
        </div>

        {/* Ajuste */}
        {modo === 'ajuste' && (
          <form onSubmit={handleAjuste} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva cantidad *</label>
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
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                />
              </div>
            </div>

            {Number(form.cantidad) !== Number(item.cantidad) && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-700">
                  {Number(form.cantidad) > Number(item.cantidad)
                    ? `➕ Se agregarán ${Number(form.cantidad) - Number(item.cantidad)} unidades`
                    : `➖ Se quitarán ${Number(item.cantidad) - Number(form.cantidad)} unidades`
                  }
                </p>
              </div>
            )}

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
                {loading ? 'Guardando...' : 'Guardar ajuste'}
              </button>
            </div>
          </form>
        )}

        {/* Transferencia */}
        {modo === 'transferencia' && (
          <form onSubmit={handleTransferencia} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depósito destino *</label>
              <select
                name="deposito_destino_id"
                value={form.deposito_destino_id}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                required
              >
                <option value="">Seleccioná el depósito destino</option>
                {depositos.map(d => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a transferir *</label>
              <input
                name="cantidad_transferir"
                type="number"
                value={form.cantidad_transferir}
                onChange={handleChange}
                max={item.cantidad}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Máximo disponible: {Number(item.cantidad).toLocaleString('es-AR')}</p>
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
                {loading ? 'Transfiriendo...' : 'Transferir stock'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default StockEditar