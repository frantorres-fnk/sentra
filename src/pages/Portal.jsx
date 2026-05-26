import { useState, useEffect, useRef } from 'react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const calcularDescuento = (precio, descuentoCascada) => {
  if (!descuentoCascada || precio == null) return parseFloat(precio) || 0
  const escalones = String(descuentoCascada).split('+').map(Number).filter(n => !isNaN(n) && n > 0)
  let p = parseFloat(precio)
  for (const d of escalones) p *= (1 - d / 100)
  return p
}

const fmt = (n) => Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const Portal = () => {
  const [paso, setPaso] = useState('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [segundos, setSegundos] = useState(60)
  const [pedidos, setPedidos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [saldoCC, setSaldoCC] = useState(0)
  const [seccion, setSeccion] = useState('inicio')
  const inputsRef = useRef([])

  const [vistaNewPedido, setVistaNewPedido] = useState(false)
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState({})
  const [nota, setNota] = useState('')
  const [loadingProductos, setLoadingProductos] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [errorPedido, setErrorPedido] = useState(null)
  const [mostrarConfirmar, setMostrarConfirmar] = useState(false)

  useEffect(() => {
    if (paso !== 'otp') return
    setSegundos(60)
    const timer = setInterval(() => {
      setSegundos(s => {
        if (s <= 1) { clearInterval(timer); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [paso])

  const callPortalOTP = async (body) => {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/portal-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = await callPortalOTP({ email })
    if (data.success) { setPaso('otp') } else { setError(data.message) }
    setLoading(false)
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const nuevo = [...otp]
    nuevo[index] = value.slice(-1)
    setOtp(nuevo)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
    if (nuevo.every(d => d !== '')) verificarOTP(nuevo.join(''))
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputsRef.current[index - 1]?.focus()
  }

  const verificarOTP = async (codigo) => {
    setLoading(true)
    setError(null)
    const data = await callPortalOTP({ email, otp: codigo })
    if (data.success) {
      setCliente(data)
      setSaldoCC(data.saldo_cc ?? 0)
      await fetchDatosPortal(data.cliente_id)
      setPaso('portal')
    } else {
      setError(data.message)
      setOtp(['', '', '', '', '', ''])
      inputsRef.current[0]?.focus()
    }
    setLoading(false)
  }

  const fetchDatosPortal = async (clienteId) => {
    const headers = {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
    const [pedidosRes, cotizacionesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/pedidos?cliente_id=eq.${clienteId}&order=fecha_pedido.desc&select=id,estado,total,subtotal,descuento,fecha_pedido,nota`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?cliente_id=eq.${clienteId}&order=created_at.desc&select=id,estado,total,vencimiento,created_at`, { headers }),
    ])
    const pedidosData = await pedidosRes.json()
    const cotizacionesData = await cotizacionesRes.json()
    setPedidos(Array.isArray(pedidosData) ? pedidosData : [])
    setCotizaciones(Array.isArray(cotizacionesData) ? cotizacionesData : [])
  }

  const fetchProductos = async () => {
    setLoadingProductos(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/portal-productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          empresa_id: cliente?.empresa_id,
          lista_precio: cliente?.lista_precio || 1,
        }),
      })
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch {
      setProductos([])
    } finally {
      setLoadingProductos(false)
    }
  }

  const abrirNuevoPedido = async () => {
    setCarrito({})
    setBusqueda('')
    setNota('')
    setErrorPedido(null)
    setVistaNewPedido(true)
    if (productos.length === 0) await fetchProductos()
  }

  const confirmarPedido = async () => {
    setConfirmando(true)
    setErrorPedido(null)
    try {
      const headers = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation',
      }

      const items = Object.entries(carrito)
        .filter(([, cant]) => cant > 0)
        .map(([id, cantidad]) => {
          const prod = productos.find(p => p.id === id)
          if (!prod) return null
          const precioBase = Number(cliente?.lista_precio) === 2
            ? parseFloat(prod.precio_lista_2 || prod.precio_venta)
            : parseFloat(prod.precio_venta)
          const precioDesc = calcularDescuento(precioBase, cliente?.descuento_cascada)
          return { prod, cantidad, precioBase, precioDesc }
        })
        .filter(Boolean)

      const subtotal = items.reduce((a, i) => a + i.precioBase * i.cantidad, 0)
      const total    = items.reduce((a, i) => a + i.precioDesc * i.cantidad, 0)
      const descuento = subtotal - total

      const pedidoRes = await fetch(`${SUPABASE_URL}/rest/v1/pedidos`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          empresa_id: cliente?.empresa_id,
          cliente_id: cliente.cliente_id,
          estado: 'pendiente',
          subtotal: parseFloat(subtotal.toFixed(2)),
          descuento: parseFloat(descuento.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          nota: nota.trim() || null,
          fecha_pedido: new Date().toISOString(),
        }),
      })

      if (!pedidoRes.ok) {
        const err = await pedidoRes.json().catch(() => ({}))
        setErrorPedido(err?.message || 'No se pudo crear el pedido.')
        return
      }

      const pedidoData = await pedidoRes.json()
      const pedidoId = Array.isArray(pedidoData) ? pedidoData[0]?.id : pedidoData?.id

      if (pedidoId) {
        await fetch(`${SUPABASE_URL}/rest/v1/pedido_items`, {
          method: 'POST',
          headers,
          body: JSON.stringify(items.map(i => ({
            pedido_id: pedidoId,
            producto_id: i.prod.id,
            cantidad: i.cantidad,
            precio_unitario: parseFloat(i.precioBase.toFixed(2)),
            precio_con_descuento: parseFloat(i.precioDesc.toFixed(2)),
            subtotal: parseFloat((i.precioBase * i.cantidad).toFixed(2)),
            total: parseFloat((i.precioDesc * i.cantidad).toFixed(2)),
          }))),
        }).catch(() => {})
      }

      await fetchDatosPortal(cliente.cliente_id)
      setCarrito({})
      setNota('')
      setBusqueda('')
      setMostrarConfirmar(false)
      setVistaNewPedido(false)
    } catch {
      setErrorPedido('Error al enviar el pedido. Intentá de nuevo.')
    } finally {
      setConfirmando(false)
    }
  }

  const estadoPedidoColor = {
    pendiente:  'bg-yellow-50 text-yellow-600',
    aprobado:   'bg-green-50 text-green-600',
    en_reparto: 'bg-blue-50 text-blue-600',
    entregado:  'bg-purple-50 text-purple-600',
    rechazado:  'bg-red-50 text-red-600',
    cancelado:  'bg-gray-100 text-gray-400',
  }

  const estadoPedidoLabel = {
    pendiente:  'Pendiente',
    aprobado:   'Aprobado',
    en_reparto: 'En reparto',
    entregado:  'Entregado',
    rechazado:  'Rechazado',
    cancelado:  'Cancelado',
  }

  const estadoCotColor = {
    borrador:  'bg-gray-100 text-gray-500',
    enviada:   'bg-blue-50 text-blue-600',
    aprobada:  'bg-green-50 text-green-600',
    rechazada: 'bg-red-50 text-red-600',
    vencida:   'bg-gray-100 text-gray-400',
  }

  const estadoCotLabel = {
    borrador:  'Borrador',
    enviada:   'Enviada',
    aprobada:  'Aprobada',
    rechazada: 'Rechazada',
    vencida:   'Vencida',
  }

  // ── LOGIN EMAIL ──────────────────────────────────────────────────────
  if (paso === 'email') return (
    <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <img src="/sentra-logo.png" alt="Sentra" className="h-12 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-[#0F1F3D] text-center mb-1">Portal de clientes</h2>
        <p className="text-sm text-gray-400 text-center mb-6">Ingresá tu email para continuar</p>
        <form onSubmit={handleEmail} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
          />
          {error && <p className="text-red-500 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00C896] text-white rounded-xl py-3 text-sm font-semibold hover:bg-[#00b386] transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Continuar →'}
          </button>
        </form>
      </div>
    </div>
  )

  // ── OTP ──────────────────────────────────────────────────────────────
  if (paso === 'otp') return (
    <div className="min-h-screen bg-[#0F1F3D] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <img src="/sentra-logo.png" alt="Sentra" className="h-12 mx-auto mb-6" />
        <h2 className="text-xl font-bold text-[#0F1F3D] text-center mb-1">Revisá tu email</h2>
        <p className="text-sm text-gray-400 text-center mb-2">
          Enviamos un código a <span className="font-medium text-[#0F1F3D]">{email}</span>
        </p>
        <div className={`text-center mb-6 text-2xl font-bold ${segundos <= 10 ? 'text-red-500' : 'text-[#00C896]'}`}>
          00:{String(segundos).padStart(2, '0')}
        </div>
        <div className="flex gap-2 justify-center mb-4">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputsRef.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleOtpChange(i, e.target.value)}
              onKeyDown={e => handleOtpKeyDown(i, e)}
              className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#00C896] transition-colors"
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-xs text-center mb-3">{error}</p>}
        {segundos === 0 && (
          <button
            onClick={() => { setOtp(['', '', '', '', '', '']); setPaso('email') }}
            className="w-full text-sm text-[#00C896] hover:underline text-center"
          >
            Solicitar nuevo código
          </button>
        )}
        {loading && <p className="text-center text-sm text-gray-400 mt-2">Verificando...</p>}
      </div>
    </div>
  )

  // ── PORTAL ───────────────────────────────────────────────────────────
  const pendientes    = pedidos.filter(p => p.estado === 'pendiente').length
  const enReparto     = pedidos.filter(p => p.estado === 'en_reparto').length
  const cotsPendientes = cotizaciones.filter(c => c.estado === 'enviada').length

  const itemsCarritoCalculados = Object.entries(carrito)
    .filter(([, cant]) => cant > 0)
    .map(([id, cantidad]) => {
      const prod = productos.find(p => p.id === id)
      if (!prod) return null
      const precioBase = Number(cliente?.lista_precio) === 2
        ? parseFloat(prod.precio_lista_2 || prod.precio_venta)
        : parseFloat(prod.precio_venta)
      const precioDesc = calcularDescuento(precioBase, cliente?.descuento_cascada)
      return { ...prod, cantidad, precioBase, precioDesc }
    })
    .filter(Boolean)

  const totalItemsCarrito = itemsCarritoCalculados.reduce((a, i) => a + i.cantidad, 0)
  const subtotalCarrito   = itemsCarritoCalculados.reduce((a, i) => a + i.precioBase * i.cantidad, 0)
  const totalCarrito      = itemsCarritoCalculados.reduce((a, i) => a + i.precioDesc * i.cantidad, 0)
  const descuentoCarrito  = subtotalCarrito - totalCarrito

  const productosFiltrados = productos.filter(p =>
    !busqueda ||
    p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.codigo?.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <nav className="bg-[#0F1F3D] px-4 py-3 flex justify-between items-center">
        <img src="/sentra-logo.png" alt="Sentra" className="h-10 brightness-0 invert" />
        <div className="flex items-center gap-3">
          <span className="text-white text-sm hidden md:block">{cliente?.razon_social}</span>
          <button
            onClick={() => { setCliente(null); setPaso('email'); setEmail(''); setPedidos([]); setCotizaciones([]); setSaldoCC(0) }}
            className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Nav secciones */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-1 max-w-2xl mx-auto overflow-x-auto">
          {[
            { id: 'inicio',       label: '🏠 Inicio' },
            { id: 'pedidos',      label: '🛒 Pedidos' },
            { id: 'cotizaciones', label: '📋 Cotizaciones' },
            { id: 'cuenta',       label: '💰 Mi cuenta' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                seccion === s.id
                  ? 'border-[#00C896] text-[#00C896]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {s.label}
              {s.id === 'pedidos' && pendientes > 0 && (
                <span className="ml-1 bg-yellow-100 text-yellow-600 text-xs px-1.5 rounded-full">{pendientes}</span>
              )}
              {s.id === 'cotizaciones' && cotsPendientes > 0 && (
                <span className="ml-1 bg-blue-100 text-blue-600 text-xs px-1.5 rounded-full">{cotsPendientes}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">

        {/* INICIO */}
        {seccion === 'inicio' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-[#0F1F3D] mb-1">Hola, {cliente?.razon_social} 👋</h2>
              <p className="text-sm text-gray-400">Bienvenido a tu portal de cliente</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-[#0F1F3D]">{pedidos.length}</p>
                <p className="text-xs text-gray-400 mt-1">Pedidos</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-yellow-500">{pendientes}</p>
                <p className="text-xs text-gray-400 mt-1">Pendientes</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <p className="text-2xl font-bold text-blue-500">{enReparto}</p>
                <p className="text-xs text-gray-400 mt-1">En reparto</p>
              </div>
            </div>
            {saldoCC > 0 && (
              <div onClick={() => setSeccion('cuenta')} className="bg-red-50 border border-red-100 rounded-xl p-4 cursor-pointer hover:bg-red-100 transition-colors">
                <p className="text-sm font-semibold text-red-700">💰 Tenés un saldo pendiente de ${Number(saldoCC).toLocaleString('es-AR')}</p>
                <p className="text-xs text-red-400 mt-0.5">Tocá para ver tu cuenta →</p>
              </div>
            )}
            {cotsPendientes > 0 && (
              <div onClick={() => setSeccion('cotizaciones')} className="bg-blue-50 border border-blue-100 rounded-xl p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                <p className="text-sm font-semibold text-blue-700">
                  📋 Tenés {cotsPendientes} cotización{cotsPendientes > 1 ? 'es' : ''} esperando tu aprobación
                </p>
                <p className="text-xs text-blue-500 mt-0.5">Tocá para ver →</p>
              </div>
            )}
          </div>
        )}

        {/* PEDIDOS */}
        {seccion === 'pedidos' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mis pedidos</h3>
              <button
                onClick={abrirNuevoPedido}
                className="bg-[#00C896] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#00b386] transition-colors"
              >
                ＋ Nuevo pedido
              </button>
            </div>
            {pedidos.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No tenés pedidos todavía.</div>
            ) : pedidos.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{p.id.slice(-6).toUpperCase()}</p>
                    <p className="text-lg font-bold text-[#0F1F3D] mt-0.5">${Number(p.total || 0).toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📅 {new Date(p.fecha_pedido).toLocaleDateString('es-AR')}</p>
                    {p.nota && <p className="text-xs text-gray-500 mt-1">📝 {p.nota}</p>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoPedidoColor[p.estado] || 'bg-gray-100 text-gray-500'}`}>
                    {estadoPedidoLabel[p.estado] || p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* COTIZACIONES */}
        {seccion === 'cotizaciones' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mis cotizaciones</h3>
            {cotizaciones.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No tenés cotizaciones todavía.</div>
            ) : cotizaciones.map(c => (
              <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{c.id.slice(-6).toUpperCase()}</p>
                    <p className="text-lg font-bold text-[#0F1F3D] mt-0.5">${Number(c.total || 0).toLocaleString('es-AR')}</p>
                    <p className="text-xs text-gray-400 mt-0.5">📅 {new Date(c.created_at).toLocaleDateString('es-AR')}</p>
                    {c.vencimiento && (
                      <p className={`text-xs mt-0.5 ${new Date(c.vencimiento) < new Date() ? 'text-red-400' : 'text-gray-400'}`}>
                        ⏱ Vence: {new Date(c.vencimiento).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoCotColor[c.estado] || 'bg-gray-100 text-gray-500'}`}>
                    {estadoCotLabel[c.estado] || c.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CUENTA */}
        {seccion === 'cuenta' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mi cuenta corriente</h3>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs text-gray-400 mb-1 text-center">Saldo actual</p>
              <p className={`text-3xl font-bold text-center ${saldoCC > 0 ? 'text-red-500' : 'text-[#00C896]'}`}>
                ${Number(saldoCC || 0).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {saldoCC > 0 ? 'Tenés saldo pendiente de pago' : 'Sin deuda pendiente ✓'}
              </p>
            </div>
          </div>
        )}

      </div>

      {/* ── VISTA NUEVO PEDIDO ─────────────────────────────────────────── */}
      {vistaNewPedido && (
        <div className="fixed inset-0 z-40 bg-gray-50 flex flex-col">

          <div className="bg-[#0F1F3D] px-4 py-3 flex items-center gap-3 shrink-0">
            <button
              onClick={() => { setVistaNewPedido(false); setCarrito({}); setBusqueda(''); setNota('') }}
              className="text-white/80 hover:text-white text-sm font-medium"
            >
              ← Volver
            </button>
            <h2 className="text-white font-semibold flex-1">Nuevo pedido</h2>
            <span className="text-white/60 text-xs">Lista {cliente?.lista_precio}</span>
          </div>

          <div className="px-4 py-3 bg-white border-b border-gray-100 shrink-0">
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
            />
          </div>

          <div className="flex-1 overflow-y-auto pb-28 px-4 py-3 space-y-2">
            {loadingProductos ? (
              <div className="text-center py-12 text-gray-400 text-sm">Cargando productos...</div>
            ) : productosFiltrados.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin productos disponibles.'}
              </div>
            ) : productosFiltrados.map(prod => {
              const precioBase = Number(cliente?.lista_precio) === 2
                ? parseFloat(prod.precio_lista_2 || prod.precio_venta)
                : parseFloat(prod.precio_venta)
              const precioDesc = calcularDescuento(precioBase, cliente?.descuento_cascada)
              const tieneDescuento = cliente?.descuento_cascada && precioDesc < precioBase - 0.001
              const cantidad = carrito[prod.id] || 0
              return (
                <div key={prod.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-400">{prod.codigo}</p>
                    <p className="text-sm font-semibold text-[#0F1F3D] leading-tight mt-0.5">{prod.nombre}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base font-bold text-[#0F1F3D]">${fmt(precioDesc)}</span>
                      {tieneDescuento && (
                        <span className="text-xs text-gray-400 line-through">${fmt(precioBase)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cantidad > 0 ? (
                      <>
                        <button
                          onClick={() => setCarrito(c => {
                            const next = { ...c, [prod.id]: (c[prod.id] || 0) - 1 }
                            if (next[prod.id] <= 0) delete next[prod.id]
                            return next
                          })}
                          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-bold hover:bg-gray-200 transition-colors"
                        >−</button>
                        <span className="w-6 text-center text-sm font-bold text-[#0F1F3D]">{cantidad}</span>
                        <button
                          onClick={() => setCarrito(c => ({ ...c, [prod.id]: (c[prod.id] || 0) + 1 }))}
                          className="w-8 h-8 rounded-full bg-[#00C896] text-white flex items-center justify-center text-lg font-bold hover:bg-[#00b386] transition-colors"
                        >+</button>
                      </>
                    ) : (
                      <button
                        onClick={() => setCarrito(c => ({ ...c, [prod.id]: 1 }))}
                        className="w-8 h-8 rounded-full bg-[#00C896] text-white flex items-center justify-center text-lg font-bold hover:bg-[#00b386] transition-colors"
                      >+</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalItemsCarrito > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#0F1F3D] px-4 py-4 shadow-2xl">
              <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/60 text-xs">{totalItemsCarrito} producto{totalItemsCarrito !== 1 ? 's' : ''}</p>
                  <p className="text-white font-bold text-lg">${fmt(totalCarrito)}</p>
                </div>
                <button
                  onClick={() => setMostrarConfirmar(true)}
                  className="bg-[#00C896] text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#00b386] transition-colors"
                >
                  Confirmar pedido →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL CONFIRMAR PEDIDO ─────────────────────────────────────── */}
      {mostrarConfirmar && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-end"
          onClick={() => !confirmando && setMostrarConfirmar(false)}
        >
          <div
            className="bg-white w-full rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#0F1F3D]">Confirmar pedido</h3>
              <button
                onClick={() => !confirmando && setMostrarConfirmar(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >✕</button>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {itemsCarritoCalculados.map(i => (
                <div key={i.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-mono text-gray-400">{i.codigo}</p>
                    <p className="text-sm text-[#0F1F3D] truncate">{i.nombre}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{i.cantidad} × ${fmt(i.precioDesc)}</p>
                    <p className="text-sm font-bold text-[#0F1F3D]">${fmt(i.precioDesc * i.cantidad)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>${fmt(subtotalCarrito)}</span>
              </div>
              {descuentoCarrito > 0.001 && (
                <div className="flex justify-between text-sm text-[#00C896]">
                  <span>Descuento</span>
                  <span>−${fmt(descuentoCarrito)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-[#0F1F3D] pt-1.5 border-t border-gray-200 mt-1">
                <span>Total</span>
                <span>${fmt(totalCarrito)}</span>
              </div>
            </div>

            <textarea
              placeholder="Nota opcional (ej: horario de entrega, referencias...)"
              value={nota}
              onChange={e => setNota(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896] mb-4 resize-none"
            />

            {errorPedido && <p className="text-red-500 text-xs text-center mb-3">{errorPedido}</p>}

            <button
              onClick={confirmarPedido}
              disabled={confirmando}
              className="w-full bg-[#00C896] text-white rounded-xl py-3 font-semibold text-sm hover:bg-[#00b386] transition-colors disabled:opacity-50"
            >
              {confirmando ? 'Procesando...' : 'Enviar pedido'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default Portal
