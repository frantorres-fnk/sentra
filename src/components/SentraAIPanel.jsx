import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SentraAIPanel = ({ onClose }) => {
  const [mensaje, setMensaje] = useState('')
  const [conversacion, setConversacion] = useState([])
  const [loading, setLoading] = useState(false)

  const consultarDatos = async (pregunta) => {
    const q = pregunta.toLowerCase()
    let contexto = ''

    if (q.includes('cliente') || q.includes('debe') || q.includes('deuda') || q.includes('saldo') || q.includes('moroso')) {
      const { data } = await supabase.from('clientes').select('razon_social, saldo_cc, activo, bloqueado, zona').order('saldo_cc', { ascending: false }).limit(20)
      contexto += `\nCLIENTES:\n${JSON.stringify(data)}`
    }
    if (q.includes('stock') || q.includes('producto') || q.includes('inventario') || q.includes('queda')) {
      const { data } = await supabase.from('stock').select('cantidad, stock_minimo, productos(nombre, codigo, precio_venta)').limit(30)
      contexto += `\nSTOCK:\n${JSON.stringify(data)}`
    }
    if (q.includes('pedido') || q.includes('venta') || q.includes('vendí') || q.includes('vendi') || q.includes('pendiente')) {
      const { data } = await supabase.from('pedidos').select('estado, total, fecha_pedido, clientes(razon_social), usuarios!pedidos_vendedor_id_fkey(nombre)').order('fecha_pedido', { ascending: false }).limit(20)
      contexto += `\nPEDIDOS:\n${JSON.stringify(data)}`
    }
    if (q.includes('cobr') || q.includes('caja') || q.includes('pago') || q.includes('cobrado')) {
      const { data } = await supabase.from('cobros').select('monto, estado, medio_pago, created_at, clientes(razon_social)').order('created_at', { ascending: false }).limit(20)
      contexto += `\nCOBRANZAS:\n${JSON.stringify(data)}`
    }
    if (q.includes('proveedor') || q.includes('provee')) {
      const { data } = await supabase.from('proveedores').select('razon_social, saldo_cc, telefono, email').limit(20)
      contexto += `\nPROVEEDORES:\n${JSON.stringify(data)}`
    }
    if (q.includes('cotizacion') || q.includes('cotización') || q.includes('presupuesto')) {
      const { data } = await supabase.from('cotizaciones').select('estado, total, vencimiento, clientes(razon_social)').order('created_at', { ascending: false }).limit(20)
      contexto += `\nCOTIZACIONES:\n${JSON.stringify(data)}`
    }

    return contexto
  }

  const generarResumenDiario = async () => {
    const hoy = new Date().toISOString().split('T')[0]
    const [
      { data: pedidosHoy },
      { data: cobrosHoy },
      { data: stockCritico },
      { data: cajaHoy },
    ] = await Promise.all([
      supabase.from('pedidos').select('estado, total, clientes(razon_social), usuarios!pedidos_vendedor_id_fkey(nombre)').gte('fecha_pedido', hoy).order('fecha_pedido', { ascending: false }),
      supabase.from('cobros').select('monto, estado, medio_pago, clientes(razon_social)').gte('created_at', hoy),
      supabase.from('stock').select('cantidad, stock_minimo, productos(nombre, codigo)').filter('cantidad', 'lte', 'stock_minimo').limit(10),
      supabase.from('operaciones_internas').select('tipo, monto, concepto').gte('created_at', hoy),
    ])
    const preguntaResumen = `Generame un resumen ejecutivo del día de hoy con estos datos reales:
PEDIDOS DE HOY: ${JSON.stringify(pedidosHoy)}
COBROS DE HOY: ${JSON.stringify(cobrosHoy)}
STOCK CRÍTICO: ${JSON.stringify(stockCritico)}
CAJA CHICA HOY: ${JSON.stringify(cajaHoy)}
El resumen debe incluir: total vendido hoy, total cobrado, alertas de stock crítico, movimientos de caja chica, conclusión del estado general. Sé conciso, usa emojis y formato claro.`
    await enviarMensaje(preguntaResumen)
  }

  const enviarMensaje = async (textoDirecto) => {
    const pregunta = (textoDirecto || mensaje).trim()
    if (!pregunta || loading) return
    if (!textoDirecto) setMensaje('')
    setLoading(true)

    const nuevaConversacion = [...conversacion, { rol: 'usuario', texto: pregunta }]
    setConversacion(nuevaConversacion)

    try {
      const contexto = await consultarDatos(pregunta)

      const { data, error } = await supabase.functions.invoke('sentra-ai', {
        body: {
          system: `Sos SENTRA AI, el asistente inteligente de Eléctrica Urbano.
Respondés en español rioplatense, de forma clara, directa y amigable.
Tenés acceso a TODOS los datos reales del negocio.
Cuando te pregunten por números, mostrá los datos concretos.
Nunca inventés datos — solo usá lo que te dan en el contexto.
Si no encontrás algo, buscá bien antes de decir que no existe.
Usá emojis con moderación.
Siempre que puedas, terminá con una sugerencia o acción concreta.
Si te preguntan por un cliente específico, buscalo por nombre aunque esté mal escrito.

DATOS COMPLETOS DEL SISTEMA:
${contexto}`,
          messages: [{ role: 'user', content: pregunta }],
        },
      })

      if (error) throw error

      const respuesta = data?.content?.[0]?.text || 'No pude procesar la consulta.'
      setConversacion([...nuevaConversacion, { rol: 'ai', texto: respuesta }])
    } catch (error) {
      setConversacion([...nuevaConversacion, { rol: 'ai', texto: '❌ Hubo un error. Intentá de nuevo.' }])
    }

    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensaje() }
  }

  const sugerencias = [
    '📊 ¿Cómo viene el día?',
    '¿Quiénes son mis morosos?',
    '¿Qué productos tienen stock bajo?',
    '¿Cuánto vendí esta semana?',
    '¿Qué pedidos están pendientes?',
    '¿Cuánto cobré hoy?',
  ]

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed z-50
        bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl
        md:bottom-0 md:right-0 md:left-auto md:top-0 md:w-96 md:h-screen md:rounded-none
        bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-[#0F1F3D] md:rounded-none rounded-t-2xl shrink-0">
          <div className="w-8 h-8 bg-[#00C896] rounded-lg flex items-center justify-center text-base">🤖</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">SENTRA AI</p>
            <p className="text-white/50 text-xs">Asistente inteligente</p>
          </div>
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">● En línea</span>
          <button onClick={onClose} className="text-white/60 hover:text-white text-xl ml-2">✕</button>
        </div>

        {/* Conversación */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {conversacion.length === 0 ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <p className="text-sm text-gray-600">👋 ¡Hola! Soy SENTRA AI. Preguntame cualquier cosa sobre tu negocio.</p>
              </div>
              <p className="text-xs text-gray-400 font-medium">Sugerencias</p>
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setMensaje(s)}
                  className="w-full text-left text-sm bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-600"
                >
                  {s}
                </button>
              ))}
            </div>
          ) : (
            conversacion.map((msg, i) => (
              <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.rol === 'usuario'
                    ? 'bg-[#0F1F3D] text-white rounded-tr-sm'
                    : 'bg-gray-50 border border-gray-100 text-gray-700 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-[#00C896] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#00C896] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#00C896] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resumen del día */}
        <div className="px-4 pt-3 shrink-0">
          <button
            onClick={generarResumenDiario}
            disabled={loading}
            className="w-full bg-[#0F1F3D] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#1a2f5a] transition-colors disabled:opacity-50"
          >
            {loading ? 'Generando resumen...' : '📊 Resumen del día'}
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Preguntá sobre tu negocio..."
              rows={1}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896] resize-none"
            />
            <button
              onClick={enviarMensaje}
              disabled={!mensaje.trim() || loading}
              className="bg-[#00C896] text-white w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#00b386] transition-colors disabled:opacity-40 shrink-0"
            >
              ➤
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default SentraAIPanel