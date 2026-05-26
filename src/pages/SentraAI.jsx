import { useState } from 'react'
import { supabase } from '../lib/supabase'

const SentraAI = () => {
  const [mensaje, setMensaje] = useState('')
  const [conversacion, setConversacion] = useState([])
  const [loading, setLoading] = useState(false)

  const consultarDatos = async (pregunta) => {
    const q = pregunta.toLowerCase()
    let contexto = ''

    // Clientes
    if (q.includes('cliente') || q.includes('debe') || q.includes('deuda') || q.includes('saldo') || q.includes('moroso')) {
      const { data } = await supabase
        .from('clientes')
        .select('razon_social, saldo_cc, activo, bloqueado, zona')
        .order('saldo_cc', { ascending: false })
        .limit(20)
      contexto += `\nCLIENTES:\n${JSON.stringify(data)}`
    }

    // Stock
    if (q.includes('stock') || q.includes('producto') || q.includes('inventario') || q.includes('queda')) {
      const { data } = await supabase
        .from('stock')
        .select('cantidad, stock_minimo, productos(nombre, codigo, precio_venta)')
        .limit(30)
      contexto += `\nSTOCK:\n${JSON.stringify(data)}`
    }

    // Pedidos
    if (q.includes('pedido') || q.includes('venta') || q.includes('vendí') || q.includes('vendi') || q.includes('pendiente')) {
      const { data } = await supabase
        .from('pedidos')
        .select('estado, total, fecha_pedido, clientes(razon_social), usuarios!pedidos_vendedor_id_fkey(nombre)')
        .order('fecha_pedido', { ascending: false })
        .limit(20)
      contexto += `\nPEDIDOS:\n${JSON.stringify(data)}`
    }

    // Cobranzas
    if (q.includes('cobr') || q.includes('caja') || q.includes('pago') || q.includes('cobrado')) {
      const { data } = await supabase
        .from('cobros')
        .select('monto, estado, medio_pago, created_at, clientes(razon_social)')
        .order('created_at', { ascending: false })
        .limit(20)
      contexto += `\nCOBRANZAS:\n${JSON.stringify(data)}`
    }

    // Proveedores
    if (q.includes('proveedor') || q.includes('provee')) {
      const { data } = await supabase
        .from('proveedores')
        .select('razon_social, saldo_cc, telefono, email')
        .limit(20)
      contexto += `\nPROVEEDORES:\n${JSON.stringify(data)}`
    }

    // Cotizaciones
    if (q.includes('cotizacion') || q.includes('cotización') || q.includes('presupuesto')) {
      const { data } = await supabase
        .from('cotizaciones')
        .select('estado, total, vencimiento, clientes(razon_social)')
        .order('created_at', { ascending: false })
        .limit(20)
      contexto += `\nCOTIZACIONES:\n${JSON.stringify(data)}`
    }

    return contexto
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

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1000,
          system: `Sos SENTRA AI, el asistente inteligente de Eléctrica Urbano. 
Respondés en español rioplatense, de forma clara, directa y amigable.
Tenés acceso a los datos reales del negocio.
Cuando te pregunten por números, mostrá los datos concretos.
Nunca inventés datos — solo usá lo que te dan en el contexto.
Si no tenés datos suficientes, decilo claramente.
Usá emojis con moderación para hacer las respuestas más amigables.
Siempre que puedas, terminá con una sugerencia o acción concreta.

DATOS ACTUALES DEL SISTEMA:
${contexto || 'No se encontraron datos relevantes para esta consulta.'}`,
          messages: [{ role: 'user', content: pregunta }],
        }),
      })

      const data = await response.json()
      const respuesta = data.content?.[0]?.text || 'No pude procesar la consulta.'

      setConversacion([...nuevaConversacion, { rol: 'ai', texto: respuesta }])
    } catch (error) {
      setConversacion([...nuevaConversacion, {
        rol: 'ai',
        texto: '❌ Hubo un error al consultar. Intentá de nuevo.',
      }])
    }

    setLoading(false)
  }

  const generarResumenDiario = async () => {
    const hoy = new Date().toISOString().split('T')[0]

    const [
      { data: pedidosHoy },
      { data: cobrosHoy },
      { data: stockCritico },
      { data: cajaHoy },
    ] = await Promise.all([
      supabase.from('pedidos')
        .select('estado, total, clientes(razon_social), usuarios!pedidos_vendedor_id_fkey(nombre)')
        .gte('fecha_pedido', hoy)
        .order('fecha_pedido', { ascending: false }),
      supabase.from('cobros')
        .select('monto, estado, medio_pago, clientes(razon_social)')
        .gte('created_at', hoy),
      supabase.from('stock')
        .select('cantidad, stock_minimo, productos(nombre, codigo)')
        .filter('cantidad', 'lte', 'stock_minimo')
        .limit(10),
      supabase.from('operaciones_internas')
        .select('tipo, monto, concepto')
        .gte('created_at', hoy),
    ])

    const preguntaResumen = `Generame un resumen ejecutivo del día de hoy con estos datos reales:
PEDIDOS DE HOY: ${JSON.stringify(pedidosHoy)}
COBROS DE HOY: ${JSON.stringify(cobrosHoy)}
STOCK CRÍTICO: ${JSON.stringify(stockCritico)}
CAJA CHICA HOY: ${JSON.stringify(cajaHoy)}

El resumen debe incluir:
- Total vendido hoy y cantidad de pedidos
- Total cobrado hoy
- Alertas de stock crítico si hay
- Movimientos de caja chica si hay
- Una conclusión con el estado general del negocio
Sé conciso, usa emojis y formato claro.`

    await enviarMensaje(preguntaResumen)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviarMensaje()
    }
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
    <div className="flex flex-col h-full">

      {/* Header v2 */}
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F1F3D] rounded-xl flex items-center justify-center text-xl">
            🤖
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#0F1F3D]">SENTRA AI</h2>
            <p className="text-xs text-gray-500">Tu asistente inteligente de negocio</p>
          </div>
          <span className="ml-auto text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full font-medium">
            ● En línea
          </span>
        </div>
      </div>

      {/* Conversación */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0">
        {conversacion.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-sm text-gray-600">
                👋 ¡Hola! Soy SENTRA AI v2. Puedo consultarte datos reales de tu negocio al instante. ¿En qué te ayudo?
              </p>
            </div>
            <p className="text-xs text-gray-400 font-medium px-1">Sugerencias</p>
            <div className="space-y-2">
              {sugerencias.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setMensaje(s)}
                  className="w-full text-left text-sm bg-white border border-gray-100 rounded-xl px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm text-gray-600"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversacion.map((msg, i) => (
            <div key={i} className={`flex ${msg.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.rol === 'usuario'
                  ? 'bg-[#0F1F3D] text-white rounded-tr-sm'
                  : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed">{msg.texto}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
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
      <button
        onClick={generarResumenDiario}
        disabled={loading}
        className="w-full bg-[#0F1F3D] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#1a2f5a] transition-colors disabled:opacity-50 mb-2"
      >
        {loading ? 'Generando resumen...' : '📊 Resumen del día'}
      </button>

      {/* Input */}
      <div className="flex gap-2 items-end">
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Preguntá cualquier cosa sobre tu negocio..."
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
  )
}

export default SentraAI
