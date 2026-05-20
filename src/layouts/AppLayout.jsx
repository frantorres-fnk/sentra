import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { NavLink, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Calculadora from '../components/Calculadora'
import { useRol } from '../hooks/useRol'
import SentraAIPanel from '../components/SentraAIPanel'

const todosLosItems = [
  { label: 'Dashboard',     path: '/',              icon: '📊', permiso: null },
  { label: 'Clientes',      path: '/clientes',      icon: '👥', permiso: 'ver_clientes' },
  { label: 'Productos',     path: '/productos',     icon: '📦', permiso: 'ver_stock' },
  { label: 'Stock',         path: '/stock',         icon: '🏭', permiso: 'ver_stock' },
  { label: 'Pedidos',       path: '/pedidos',       icon: '🛒', permiso: 'ver_pedidos' },
  { label: 'Facturación',   path: '/facturacion',   icon: '🧾', permiso: 'ver_facturacion' },
  { label: 'Cobranzas',     path: '/cobranzas',     icon: '💰', permiso: 'ver_caja' },
  { label: 'Proveedores',   path: '/proveedores',   icon: '🏪', permiso: 'ver_proveedores' },
  { label: 'Reportes',      path: '/reportes',      icon: '📈', permiso: 'ver_reportes' },
  { label: 'Caja Chica',    path: '/caja-chica',    icon: '🔒', permiso: 'ver_zona_privada' },
  { label: 'Configuración', path: '/configuracion', icon: '⚙️', permiso: 'gestionar_usuarios' },
]

const bottomPrimarios = ['/', '/clientes', '/pedidos', '/productos']

const BottomNav = ({ onMasClick }) => {
  const { puedeVer } = useRol()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1F3D] border-t border-white/10 z-30 flex">
      {bottomPrimarios.map((path) => {
        const item = todosLosItems.find(i => i.path === path)
        if (!item) return null
        if (item.permiso && !puedeVer(item.permiso)) return null
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs transition-colors ${
                isActive ? 'text-[#00C896]' : 'text-gray-400'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        )
      })}
      <button
        onClick={onMasClick}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs text-gray-400 active:text-white transition-colors"
      >
        <span className="text-lg">☰</span>
        <span>Más</span>
      </button>
    </nav>
  )
}

const MenuMas = ({ onClose }) => {
  const { puedeVer } = useRol()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const extras = todosLosItems.filter(i => !bottomPrimarios.includes(i.path))

  const handleClick = (path) => {
    navigate(path)
    onClose()
  }

  return (
    <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl shadow-2xl p-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-[#0F1F3D]">Todos los módulos</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {extras.map((item) => {
            if (item.permiso && !puedeVer(item.permiso)) return null
            return (
              <button
                key={item.path}
                onClick={() => handleClick(item.path)}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gray-50 active:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs text-gray-600 text-center leading-tight">{item.label}</span>
              </button>
            )
          })}
        </div>
        <button
          onClick={() => { signOut(); onClose() }}
          className="mt-4 w-full py-3 rounded-xl border border-red-100 text-red-500 text-sm font-medium active:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

const AppLayout = ({ children }) => {
  const { user, signOut } = useAuth()
  const [menuMasAbierto, setMenuMasAbierto] = useState(false)
  const [aiAbierto, setAiAbierto] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">

      {/* Navbar desktop */}
      <nav className="hidden md:flex bg-[#0F1F3D] px-6 py-1.5 justify-between items-center z-10">
        <img src="/sentra-logo.png" alt="SENTRA" className="h-20 w-auto brightness-0 invert" />
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300">{user?.email}</span>
          <button
            onClick={() => setAiAbierto(true)}
            className="flex items-center gap-2 bg-[#00C896] hover:bg-[#00b386] text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            🤖 SENTRA AI
          </button>
          <button
            onClick={signOut}
            className="text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      {/* Navbar mobile */}
      <nav className="md:hidden bg-[#0F1F3D] px-4 py-2 flex justify-between items-center z-10">
        <img src="/sentra-logo.png" alt="SENTRA" className="h-14 w-auto brightness-0 invert" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiAbierto(true)}
            className="flex items-center gap-1.5 bg-[#00C896] hover:bg-[#00b386] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            🤖 AI
          </button>
          <button
            onClick={signOut}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      <div className="flex flex-1">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 md:p-6 bg-gray-50 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <Calculadora />
      <BottomNav onMasClick={() => setMenuMasAbierto(true)} />
      {menuMasAbierto && <MenuMas onClose={() => setMenuMasAbierto(false)} />}
      {aiAbierto && <SentraAIPanel onClose={() => setAiAbierto(false)} />}
    </div>
  )
}

export default AppLayout