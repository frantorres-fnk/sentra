import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const PedidoModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [nota, setNota] = useState('')
  const [descuentoGlobal, setDescuentoGlobal] = useState(0)
  const [lineas, setLineas] = useState([
    { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }
  ])

  useEffect(() => {
    const fetchData = async () => {
      const { data: cls } = await supabase
        .from('clientes')
        .select('id, razon_social')
        .eq('activo', true)
        .order('razon_social')

      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, codigo, precio_venta')
        .eq('activo', true)
        .order('nombre')

      setClientes(cls || [])
      setProductos(prods || [])
    }
    fetchData()
  }, [])

  const handleLineaChange = (index, field, value) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index][field] = value

    if (field === 'producto_id') {
      const prod = productos.find(p => p.id === value)
      if (prod) nuevasLineas[index].precio_unitario = prod.precio_venta
    }

    setLineas(nuevasLineas)
  }

  const agregarLinea = () => {
    setLineas([...lineas, { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0 }])
  }

  const eliminarLinea = (index) => {
    setLineas(lineas.filter((_, i) => i !== index))
  }

  const calcularSubtotalLinea = (linea) => {
    const bruto = Number(linea.cantidad) * Number(linea.precio_unitario)
    const descuento = bruto * (Number(linea.descuento) / 100)
    return bruto - descuento
  }

  const calcularTotal = () => {
    const subtotal = lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0)
    const descuento = subtotal * (Number(descuentoGlobal) / 100)
    return subtotal - descuento
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clienteId) {
      setError('Seleccioná un cliente.')
      setLoading(false)
      return
    }

    if (lineas.some(l => !l.producto_id)) {
      setError('Todos los productos deben estar seleccionados.')
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

    const subtotal = lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0)
    const total = calcularTotal()

    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .insert([{
        empresa_id: usuarioData.empresa_id,
        cliente_id: clienteId,
        vendedor_id: usuarioData.id,
        estado: 'pendiente',
        subtotal,
        descuento: subtotal - total,
        total,
        nota,
      }])
      .select()
      .single()

    if (pedidoError) {
      setError('Error al crear el pedido.')
      setLoading(false)
      return
    }

    const detalles = lineas.map(l => ({
      empresa_id: usuarioData.empresa_id,
      pedido_id: pedido.id,
      producto_id: l.producto_id,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      descuento: calcularSubtotalLinea(l) * (Number(l.descuento) / 100),
      subtotal: calcularSubtotalLinea(l),
    }))

    const { error: detalleError } = await supabase
      .from('pedidos_detalle')
      .insert(detalles)

    if (detalleError) {
      setError('Error al guardar el detalle del pedido.')
      setLoading(false)
      return
    }

    onGuardado()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo pedido</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
            <select
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              <option value="">Seleccioná un cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Productos *</label>
              <button
                type="button"
                onClick={agregarLinea}
                className="text-xs text-[#00C896] hover:underline"
              >
                + Agregar línea
              </button>
            </div>

            <div className="space-y-2">
              {lineas.map((linea, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      value={linea.producto_id}
                      onChange={(e) => handleLineaChange(index, 'producto_id', e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    >
                      <option value="">Producto</option>
                      {productos.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={linea.cantidad}
                      onChange={(e) => handleLineaChange(index, 'cantidad', e.target.value)}
                      placeholder="Cant."
                      min="1"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={linea.precio_unitario}
                      onChange={(e) => handleLineaChange(index, 'precio_unitario', e.target.value)}
                      placeholder="Precio"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={linea.descuento}
                      onChange={(e) => handleLineaChange(index, 'descuento', e.target.value)}
                      placeholder="Desc. %"
                      min="0"
                      max="100"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    />
                  </div>
                  <div className="col-span-1 text-right">
                    {lineas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarLinea(index)}
                        className="text-red-400 hover:text-red-600 text-lg"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-12 gap-2 mt-1 px-1">
              <div className="col-span-5 text-xs text-gray-400">Producto</div>
              <div className="col-span-2 text-xs text-gray-400">Cantidad</div>
              <div className="col-span-2 text-xs text-gray-400">Precio</div>
              <div className="col-span-2 text-xs text-gray-400">Desc. %</div>
            </div>
          </div>

          {/* Descuento global y nota */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento global %</label>
              <input
                type="number"
                value={descuentoGlobal}
                onChange={(e) => setDescuentoGlobal(e.target.value)}
                min="0"
                max="100"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
              <input
                type="text"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Observaciones..."
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-4 text-right">
            <p className="text-sm text-gray-500">Total del pedido</p>
            <p className="text-2xl font-bold text-[#0F1F3D]">
              ${calcularTotal().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
              {loading ? 'Guardando...' : 'Crear pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PedidoModal