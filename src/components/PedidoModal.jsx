import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const UpsellBanner = ({ producto, cantidad, onAceptar }) => {
  if (!producto) return null

  const cant = Number(cantidad) || 0
  const precioUnit = Number(producto.precio_venta) || 0
  const cantChica = Number(producto.cantidad_caja_chica) || 0
  const precioChica = Number(producto.precio_caja_chica) || 0
  const cantMaster = Number(producto.cantidad_caja_master) || 0
  const precioMaster = Number(producto.precio_caja_master) || 0

  // Sugerencia master: si la cantidad >= 50% de una caja master
  if (cantMaster && precioMaster && cant >= cantMaster * 0.5 && cant < cantMaster) {
    const ahorro = (precioUnit * cantMaster) - precioMaster
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mt-2">
        <p className="text-xs font-semibold text-purple-700 mb-1">🏭 ¿Llevás una caja master?</p>
        <p className="text-xs text-purple-600">
          {cantMaster} unidades por ${precioMaster.toLocaleString('es-AR')} — ahorrás ${ahorro.toLocaleString('es-AR')} vs unidades sueltas
        </p>
        <button
          type="button"
          onClick={() => onAceptar(cantMaster, precioMaster, 'master')}
          className="mt-2 w-full bg-purple-600 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-purple-700 transition-colors"
        >
          Sí, cambiar a caja master ({cantMaster}u)
        </button>
      </div>
    )
  }

  // Sugerencia caja chica: si la cantidad >= 50% de una caja chica
  if (cantChica && precioChica && cant >= cantChica * 0.5 && cant < cantChica) {
    const ahorro = (precioUnit * cantChica) - precioChica
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-2">
        <p className="text-xs font-semibold text-orange-700 mb-1">📦 ¿Llevás una caja chica?</p>
        <p className="text-xs text-orange-600">
          {cantChica} unidades por ${precioChica.toLocaleString('es-AR')} — ahorrás ${ahorro.toLocaleString('es-AR')} vs unidades sueltas
        </p>
        <button
          type="button"
          onClick={() => onAceptar(cantChica, precioChica, 'chica')}
          className="mt-2 w-full bg-orange-500 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-orange-600 transition-colors"
        >
          Sí, cambiar a caja chica ({cantChica}u)
        </button>
      </div>
    )
  }

  // Info embalaje disponible (cuando ya cargó cantidad completa)
  if (cantChica && precioChica && cant > 0 && cant % cantChica === 0) {
    const cajas = cant / cantChica
    const precioConCajas = cajas * precioChica
    const precioSinCajas = cant * precioUnit
    if (precioConCajas < precioSinCajas) {
      const ahorro = precioSinCajas - precioConCajas
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
          <p className="text-xs font-semibold text-green-700 mb-1">✅ Precio por cajas aplicable</p>
          <p className="text-xs text-green-600">
            {cajas} caja{cajas > 1 ? 's' : ''} chica{cajas > 1 ? 's' : ''} → ${precioConCajas.toLocaleString('es-AR')} (ahorrás ${ahorro.toLocaleString('es-AR')})
          </p>
          <button
            type="button"
            onClick={() => onAceptar(cant, precioConCajas / cant, 'chica_multiple')}
            className="mt-2 w-full bg-green-600 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-green-700 transition-colors"
          >
            Aplicar precio por cajas
          </button>
        </div>
      )
    }
  }

  return null
}

const PedidoModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [clienteInfo, setClienteInfo] = useState(null)
  const [nota, setNota] = useState('')
  const [lineas, setLineas] = useState([
    { producto_id: '', cantidad: 1, precio_unitario: 0, precio_original: 0, descuento_cascada: 0 }
  ])

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .single()

      const { data: cls } = await supabase
        .from('clientes')
        .select('id, razon_social, nombre_fantasia, lista_precio, descuento_cascada')
        .eq('activo', true)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('razon_social')

      const { data: prods } = await supabase
        .from('productos')
        .select('id, nombre, codigo, precio_venta, precio_lista_2, alicuota_iva, cantidad_caja_chica, precio_caja_chica, cantidad_caja_master, precio_caja_master')
        .eq('activo', true)
        .eq('empresa_id', usuarioData.empresa_id)
        .order('nombre')

      setClientes(cls || [])
      setProductos(prods || [])
    }
    fetchData()
  }, [])

  const calcularDescuentoCascada = (cascada) => {
    if (!cascada) return 0
    let precio = 100
    cascada.split('+').forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) precio = precio * (1 - val / 100)
    })
    return parseFloat((100 - precio).toFixed(2))
  }

  const aplicarCascada = (precio, cascada) => {
    if (!cascada) return precio
    let resultado = precio
    cascada.split('+').forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) resultado = resultado * (1 - val / 100)
    })
    return parseFloat(resultado.toFixed(2))
  }

  const handleClienteChange = (id) => {
    setClienteId(id)
    const cliente = clientes.find(c => c.id === id)
    setClienteInfo(cliente || null)

    if (cliente) {
      setLineas(prev => prev.map(linea => {
        if (!linea.producto_id) return linea
        const prod = productos.find(p => p.id === linea.producto_id)
        if (!prod) return linea
        const precioBase = cliente.lista_precio === 2 ? (prod.precio_lista_2 || prod.precio_venta) : prod.precio_venta
        const precioFinal = aplicarCascada(precioBase, cliente.descuento_cascada)
        return {
          ...linea,
          precio_original: precioBase,
          precio_unitario: precioFinal,
          descuento_cascada: calcularDescuentoCascada(cliente.descuento_cascada),
        }
      }))
    }
  }

  const handleLineaChange = (index, field, value) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index][field] = value

    if (field === 'producto_id') {
      const prod = productos.find(p => p.id === value)
      if (prod) {
        const cliente = clientes.find(c => c.id === clienteId)
        const precioBase = cliente?.lista_precio === 2
          ? (prod.precio_lista_2 || prod.precio_venta)
          : prod.precio_venta
        const precioFinal = cliente
          ? aplicarCascada(precioBase, cliente.descuento_cascada)
          : precioBase
        nuevasLineas[index].precio_original = precioBase
        nuevasLineas[index].precio_unitario = precioFinal
        nuevasLineas[index].descuento_cascada = calcularDescuentoCascada(cliente?.descuento_cascada)
      }
    }

    setLineas(nuevasLineas)
  }

  const handleUpsell = (index, cantidad, precioUnitario) => {
    const nuevasLineas = [...lineas]
    nuevasLineas[index].cantidad = cantidad
    nuevasLineas[index].precio_unitario = precioUnitario
    setLineas(nuevasLineas)
  }

  const agregarLinea = () => {
    setLineas([...lineas, { producto_id: '', cantidad: 1, precio_unitario: 0, precio_original: 0, descuento_cascada: 0 }])
  }

  const eliminarLinea = (index) => {
    setLineas(lineas.filter((_, i) => i !== index))
  }

  const calcularSubtotalLinea = (linea) => {
    return parseFloat((Number(linea.cantidad) * Number(linea.precio_unitario)).toFixed(2))
  }

  const calcularTotal = () => {
    return lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0)
  }

  const calcularSubtotalOriginal = () => {
    return lineas.reduce((acc, l) => acc + Number(l.cantidad) * Number(l.precio_original || l.precio_unitario), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!clienteId) { setError('Seleccioná un cliente.'); setLoading(false); return }
    if (lineas.some(l => !l.producto_id)) { setError('Todos los productos deben estar seleccionados.'); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id, id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) { setError('No se encontró la empresa.'); setLoading(false); return }

    const subtotal = calcularSubtotalOriginal()
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

    if (pedidoError) { setError('Error al crear el pedido.'); setLoading(false); return }

    const detalles = lineas.map(l => ({
      empresa_id: usuarioData.empresa_id,
      pedido_id: pedido.id,
      producto_id: l.producto_id,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      descuento: Number(l.cantidad) * (Number(l.precio_original || l.precio_unitario) - Number(l.precio_unitario)),
      subtotal: calcularSubtotalLinea(l),
    }))

    const { error: detalleError } = await supabase.from('pedidos_detalle').insert(detalles)
    if (detalleError) { setError('Error al guardar el detalle del pedido.'); setLoading(false); return }

    onGuardado()
    onClose()
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const descuentoTotal = clienteInfo ? calcularDescuentoCascada(clienteInfo.descuento_cascada) : 0
  const subtotalOriginal = calcularSubtotalOriginal()
  const total = calcularTotal()
  const ahorroTotal = subtotalOriginal - total

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
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
              onChange={(e) => handleClienteChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              required
            >
              <option value="">Seleccioná un cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.razon_social}{c.nombre_fantasia ? ` (${c.nombre_fantasia})` : ''}
                </option>
              ))}
            </select>

            {clienteInfo && (
              <div className="mt-2 flex gap-2 flex-wrap">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  clienteInfo.lista_precio === 2
                    ? 'bg-green-50 text-green-600'
                    : 'bg-blue-50 text-blue-600'
                }`}>
                  Lista {clienteInfo.lista_precio || 1} — {clienteInfo.lista_precio === 2 ? 'Mayorista' : 'Mostrador'}
                </span>
                {clienteInfo.descuento_cascada && (
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 font-medium">
                    Desc. {clienteInfo.descuento_cascada}% → {descuentoTotal}% real
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Productos */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Productos *</label>
              <button type="button" onClick={agregarLinea} className="text-xs text-[#00C896] hover:underline">
                + Agregar línea
              </button>
            </div>

            <div className="space-y-2">
              {lineas.map((linea, index) => {
                const prod = productos.find(p => p.id === linea.producto_id)
                return (
                  <div key={index} className="bg-gray-50 rounded-xl p-3 space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={linea.producto_id}
                        onChange={(e) => handleLineaChange(index, 'producto_id', e.target.value)}
                        className={`flex-1 ${inputClass}`}
                      >
                        <option value="">Seleccioná un producto</option>
                        {productos.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                          </option>
                        ))}
                      </select>
                      {lineas.length > 1 && (
                        <button type="button" onClick={() => eliminarLinea(index)} className="text-red-400 hover:text-red-600 text-lg shrink-0">✕</button>
                      )}
                    </div>

                    {linea.producto_id && (
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Cantidad</p>
                          <input
                            type="number"
                            value={linea.cantidad}
                            onChange={(e) => handleLineaChange(index, 'cantidad', e.target.value)}
                            min="1"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Precio unitario</p>
                          <input
                            type="number"
                            value={linea.precio_unitario}
                            onChange={(e) => handleLineaChange(index, 'precio_unitario', e.target.value)}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Subtotal</p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0F1F3D]">
                            ${calcularSubtotalLinea(linea).toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Upsell banner */}
                    {linea.producto_id && (
                      <UpsellBanner
                        producto={prod}
                        cantidad={linea.cantidad}
                        onAceptar={(cantidad, precioUnitario) => handleUpsell(index, cantidad, precioUnitario)}
                      />
                    )}

                    {linea.producto_id && linea.descuento_cascada > 0 && (
                      <div className="flex justify-between items-center bg-orange-50 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-orange-600">
                          Precio lista: ${Number(linea.precio_original).toLocaleString('es-AR')}
                        </p>
                        <p className="text-xs font-semibold text-orange-700">
                          -{linea.descuento_cascada}% aplicado
                        </p>
                      </div>
                    )}

                    {/* Info embalajes disponibles */}
                    {prod && (prod.cantidad_caja_chica || prod.cantidad_caja_master) && (
                      <div className="flex gap-2 flex-wrap">
                        {prod.cantidad_caja_chica && prod.precio_caja_chica && (
                          <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                            📦 Caja chica: {prod.cantidad_caja_chica}u · ${Number(prod.precio_caja_chica).toLocaleString('es-AR')}
                          </span>
                        )}
                        {prod.cantidad_caja_master && prod.precio_caja_master && (
                          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            🏭 Master: {prod.cantidad_caja_master}u · ${Number(prod.precio_caja_master).toLocaleString('es-AR')}
                          </span>
                        )}
                      </div>
                    )}

                    {prod && (
                      <p className="text-xs text-gray-400">IVA {prod.alicuota_iva ?? 21}%</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nota */}
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

          {/* Resumen */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {ahorroTotal > 0 && (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Subtotal lista</span>
                  <span className="text-gray-400 line-through">${subtotalOriginal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-orange-600 font-medium">Descuento aplicado</span>
                  <span className="text-orange-600 font-medium">-${ahorroTotal.toLocaleString('es-AR')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-sm text-gray-500">Total del pedido</span>
              <span className="text-2xl font-bold text-[#0F1F3D]">
                ${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Crear pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PedidoModal