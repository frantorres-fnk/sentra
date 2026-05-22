import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const Portal = () => {
  const [paso, setPaso] = useState('email') // email | otp | portal
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [segundos, setSegundos] = useState(60)
  const [pedidos, setPedidos] = useState([])
  const [cotizaciones, setCotizaciones] = useState([])
  const [seccion, setSeccion] = useState('inicio')
  const inputsRef = useRef([])
  const navigate = useNavigate()

  // Countdown OTP
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
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    })
    return res.json()
  }

  const handleEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const data = await callPortalOTP({ email })
    if (data.success) {
      setPaso('otp')
    } else {
      setError(data.message)
    }
    setLoading(false)
  }

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return
    const nuevo = [...otp]
    nuevo[index] = value.slice(-1)
    setOtp(nuevo)
    if (value && index < 5) inputsRef.current[index + 1]?.focus()
    if (nuevo.every(d => d !== '')) {
      verificarOTP(nuevo.join(''))
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const verificarOTP = async (codigo) => {
    setLoading(true)
    setError(null)
    const data = await callPortalOTP({ email, otp: codigo })
    if (data.success) {
      setCliente(data)
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
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'apikey': SUPABASE_ANON_KEY,
    }

    const [pedidosRes, cotizacionesRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/pedidos?cliente_id=eq.${clienteId}&order=fecha_pedido.desc&select=*`, { headers }),
      fetch(`${SUPABASE_URL}/rest/v1/cotizaciones?cliente_id=eq.${clienteId}&order=created_at.desc&select=*`, { headers }),
    ])

    const pedidosData = await pedidosRes.json()
    const cotizacionesData = await cotizacionesRes.json()
    setPedidos(Array.isArray(pedidosData) ? pedidosData : [])
    setCotizaciones(Array.isArray(cotizacionesData) ? cotizacionesData : [])
  }

  const estadoPedidoColor = {
    pendiente:  'bg-yellow-50 text-yellow-600',
    aprobado:   'bg-green-50 text-green-600',
    en_reparto: 'bg-blue-50 text-blue-600',
    entregado:  'bg-purple-50 text-purple-600',
    rechazado:  'bg-red-50 text-red-600',
    cancelado:  'bg-gray-100 text-gray-400',
  }

  const estadoCotColor = {
    borrador:  'bg-gray-100 text-gray-500',
    enviada:   'bg-blue-50 text-blue-600',
    aprobada:  'bg-green-50 text-green-600',
    rechazada: 'bg-red-50 text-red-600',
    vencida:   'bg-gray-100 text-gray-400',
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

        {/* Countdown */}
        <div className={`text-center mb-6 text-2xl font-bold ${segundos <= 10 ? 'text-red-500' : 'text-[#00C896]'}`}>
          00:{String(segundos).padStart(2, '0')}
        </div>

        {/* Inputs OTP */}
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
  const pendientes = pedidos.filter(p => p.estado === 'pendiente').length
  const cotsPendientes = cotizaciones.filter(c => c.estado === 'enviada').length

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <nav className="bg-[#0F1F3D] px-4 py-3 flex justify-between items-center">
        <img src="/sentra-logo.png" alt="Sentra" className="h-10 brightness-0 invert" />
        <div className="flex items-center gap-3">
          <span className="text-white text-sm hidden md:block">{cliente?.razon_social}</span>
          <button
            onClick={() => { setCliente(null); setPaso('email'); setEmail('') }}
            className="text-xs bg-white/10 text-white px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* Nav secciones */}
      <div className="bg-white border-b border-gray-100 px-4">
        <div className="flex gap-1 max-w-2xl mx-auto">
          {[
            { id: 'inicio',       label: '🏠 Inicio' },
            { id: 'pedidos',      label: '🛒 Pedidos' },
            { id: 'cotizaciones', label: '📋 Cotizaciones' },
            { id: 'cuenta',       label: '💰 Mi cuenta' },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
              <h2 className="text-lg font-bold text-[#0F1F3D] mb-1">
                Hola, {cliente?.razon_social} 👋
              </h2>
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
                <p className="text-2xl font-bold text-blue-500">{cotsPendientes}</p>
                <p className="text-xs text-gray-400 mt-1">Cotizaciones</p>
              </div>
            </div>
          </div>
        )}

        {/* PEDIDOS */}
        {seccion === 'pedidos' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Mis pedidos</h3>
            {pedidos.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">No tenés pedidos todavía.</div>
            ) : pedidos.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-mono text-gray-400">#{p.id.slice(-6).toUpperCase()}</p>
                    <p className="text-sm font-semibold text-[#0F1F3D] mt-0.5">
                      ${Number(p.total || 0).toLocaleString('es-AR')}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(p.fecha_pedido).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoPedidoColor[p.estado] || 'bg-gray-100 text-gray-500'}`}>
                    {p.estado}
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
                    <p className="text-sm font-semibold text-[#0F1F3D] mt-0.5">
                      ${Number(c.total || 0).toLocaleString('es-AR')}
                    </p>
                    {c.vencimiento && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Vence: {new Date(c.vencimiento).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${estadoCotColor[c.estado] || 'bg-gray-100 text-gray-500'}`}>
                    {c.estado}
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
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
              <p className="text-xs text-gray-400 mb-1">Saldo actual</p>
              <p className="text-3xl font-bold text-[#0F1F3D]">
                ${Number(0).toLocaleString('es-AR')}
              </p>
              <p className="text-xs text-gray-400 mt-2">Contactá a tu vendedor para más detalles</p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default Portal