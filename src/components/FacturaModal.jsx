import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const FacturaModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientes, setClientes] = useState([])
  const [pedidos, setPedidos] = useState([])
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [form, setForm] = useState({
    cliente_id: '',
    pedido_id: '',
    tipo: 'B',
    punto_venta: '1',
    nota: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const { data: cls } = await supabase
        .from('clientes')
        .select('id, razon_social, cuit, condicion_afip')
        .eq('activo', true)
        .order('razon_social')

      const { data: peds } = await supabase
        .from('pedidos')
        .select('id, total, fecha_pedido, clientes(razon_social)')
        .eq('estado', 'aprobado')
        .order('fecha_pedido', { ascending: false })

      setClientes(cls || [])
      setPedidos(peds || [])
    }
    fetchData()
  }, [])

  const handleClienteChange = (e) => {
    const clienteId = e.target.value
    const cliente = clientes.find(c => c.id === clienteId)
    setClienteSeleccionado(cliente)

    let tipoSugerido = 'B'
    if (cliente?.condicion_afip === 'responsable_inscripto') tipoSugerido = 'A'
    if (cliente?.condicion_afip === 'consumidor_final') tipoSugerido = 'B'
    if (cliente?.condicion_afip === 'exento') tipoSugerido = 'C'

    setForm({ ...form, cliente_id: clienteId, tipo: tipoSugerido })
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const calcularIVA = (subtotal, tipo) => {
    if (tipo === 'A') return Number(subtotal) * 0.21
    return 0
  }

  const getPedidoSeleccionado = () => {
    return pedidos.find(p => p.id === form.pedido_id)
  }

  const getSubtotal = () => {
    const pedido = getPedidoSeleccionado()
    return pedido ? Number(pedido.total) : 0
  }

  const getIVA = () => calcularIVA(getSubtotal(), form.tipo)
  const getTotal = () => getSubtotal() + getIVA()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!form.cliente_id) {
      setError('Seleccioná un cliente.')
      setLoading(false)
      return
    }

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
      .from('facturas')
      .insert([{
        empresa_id: usuarioData.empresa_id,
        cliente_id: form.cliente_id,
        pedido_id: form.pedido_id || null,
        usuario_id: usuarioData.id,
        tipo: form.tipo,
        punto_venta: Number(form.punto_venta),
        subtotal: getSubtotal(),
        iva: getIVA(),
        total: getTotal(),
        estado: 'pendiente',
      }])

    if (error) {
      setError('Error al crear la factura.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nueva factura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={form.cliente_id}
              onChange={handleClienteChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              <option value="">Seleccioná un cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
            {clienteSeleccionado && (
              <p className="text-xs text-gray-400 mt-1">
                CUIT: {clienteSeleccionado.cuit || 'Sin CUIT'} — {clienteSeleccionado.condicion_afip?.replace('_', ' ')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de comprobante</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              >
                <option value="A">Factura A</option>
                <option value="B">Factura B</option>
                <option value="C">Factura C</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punto de venta</label>
              <input
                name="punto_venta"
                type="number"
                value={form.punto_venta}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pedido asociado (opcional)</label>
            <select
              name="pedido_id"
              value={form.pedido_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            >
              <option value="">Sin pedido asociado</option>
              {pedidos.map(p => (
                <option key={p.id} value={p.id}>
                  #{p.id.slice(-6).toUpperCase()} — {p.clientes?.razon_social} — ${Number(p.total).toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          {/* Totales */}
          {getSubtotal() > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">${getSubtotal().toLocaleString('es-AR')}</span>
              </div>
              {form.tipo === 'A' && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">IVA 21%</span>
                  <span className="font-medium">${getIVA().toLocaleString('es-AR')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-gray-200 pt-2">
                <span className="font-semibold text-[#0F1F3D]">Total</span>
                <span className="font-bold text-[#0F1F3D] text-lg">${getTotal().toLocaleString('es-AR')}</span>
              </div>
            </div>
          )}

          {/* Aviso AFIP */}
          <div className="bg-yellow-50 rounded-lg p-3">
            <p className="text-xs text-yellow-700">
              ⚠️ La factura se creará sin CAE. Para obtener el CAE de AFIP necesitás configurar el certificado digital en Configuración.
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
              {loading ? 'Creando...' : 'Crear factura'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FacturaModal