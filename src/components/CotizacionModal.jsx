import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const CotizacionModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [clientes, setClientes] = useState([])
  const [productos, setProductos] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [clienteInfo, setClienteInfo] = useState(null)
  const [nota, setNota] = useState('')
  const [vencimientoDias, setVencimientoDias] = useState(48)
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
        .select('id, nombre, codigo, precio_venta, precio_lista_2, alicuota_iva')
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
        const precioFinal = cliente ? aplicarCascada(precioBase, cliente.descuento_cascada) : precioBase
        nuevasLineas[index].precio_original = precioBase
        nuevasLineas[index].precio_unitario = precioFinal
        nuevasLineas[index].descuento_cascada = calcularDescuentoCascada(cliente?.descuento_cascada)
      }
    }
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

  const calcularTotal = () => lineas.reduce((acc, l) => acc + calcularSubtotalLinea(l), 0)
  const calcularSubtotalOriginal = () => lineas.reduce((acc, l) => acc + Number(l.cantidad) * Number(l.precio_original || l.precio_unitario), 0)

  const handleSubmit = async (e, estadoInicial = 'borrador') => {
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

    const vencimiento = new Date()
    vencimiento.setHours(vencimiento.getHours() + Number(vencimientoDias))

    const { data: cotizacion, error: cotError } = await supabase
      .from('cotizaciones')
      .insert([{
        empresa_id: usuarioData.empresa_id,
        cliente_id: clienteId,
        vendedor_id: usuarioData.id,
        estado: estadoInicial,
        subtotal,
        descuento: subtotal - total,
        total,
        nota,
        vencimiento: vencimiento.toISOString(),
      }])
      .select()
      .single()

    if (cotError) { setError('Error al crear la cotización.'); setLoading(false); return }

    const detalles = lineas.map(l => ({
      empresa_id: usuarioData.empresa_id,
      cotizacion_id: cotizacion.id,
      producto_id: l.producto_id,
      cantidad: Number(l.cantidad),
      precio_unitario: Number(l.precio_unitario),
      descuento: Number(l.cantidad) * (Number(l.precio_original || l.precio_unitario) - Number(l.precio_unitario)),
      subtotal: calcularSubtotalLinea(l),
    }))

    const { error: detError } = await supabase.from('cotizaciones_detalle').insert(detalles)
    if (detError) { setError('Error al guardar el detalle.'); setLoading(false); return }

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
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nueva cotización</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={(e) => handleSubmit(e, 'borrador')} className="space-y-5">

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
                  clienteInfo.lista_precio === 2 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
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

          {/* Vencimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Válida por</label>
            <select
              value={vencimientoDias}
              onChange={(e) => setVencimientoDias(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            >
              <option value={24}>24 horas</option>
              <option value={48}>48 horas</option>
              <option value={72}>72 horas</option>
              <option value={168}>7 días</option>
              <option value={360}>15 días</option>
              <option value={720}>30 días</option>
            </select>
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
                          <input type="number" value={linea.cantidad} onChange={(e) => handleLineaChange(index, 'cantidad', e.target.value)} min="1" className={inputClass} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Precio unitario</p>
                          <input type="number" value={linea.precio_unitario} onChange={(e) => handleLineaChange(index, 'precio_unitario', e.target.value)} className={inputClass} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 mb-1">Subtotal</p>
                          <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold text-[#0F1F3D]">
                            ${calcularSubtotalLinea(linea).toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>
                    )}

                    {linea.producto_id && linea.descuento_cascada > 0 && (
                      <div className="flex justify-between items-center bg-orange-50 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-orange-600">Precio lista: ${Number(linea.precio_original).toLocaleString('es-AR')}</p>
                        <p className="text-xs font-semibold text-orange-700">-{linea.descuento_cascada}% aplicado</p>
                      </div>
                    )}

                    {prod && <p className="text-xs text-gray-400">IVA {prod.alicuota_iva ?? 21}%</p>}
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
              placeholder="Observaciones para el cliente..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            />
          </div>

          {/* Resumen */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            {ahorroTotal > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal lista</span>
                  <span className="text-gray-400 line-through">${subtotalOriginal.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-orange-600 font-medium">Descuento aplicado</span>
                  <span className="text-orange-600 font-medium">-${ahorroTotal.toLocaleString('es-AR')}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-sm text-gray-500">Total cotización</span>
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
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'borrador')}
              disabled={loading}
              className="flex-1 border border-[#0F1F3D] text-[#0F1F3D] rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, 'enviada')}
              disabled={loading}
              className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
            >
              {loading ? 'Guardando...' : '📤 Guardar y enviar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CotizacionModal