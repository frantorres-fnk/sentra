import { useAuth } from '../context/AuthContext'
import { NavLink } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Calculadora from '../components/Calculadora'
import { useRol } from '../hooks/useRol'

const bottomItems = [
  { label: 'Inicio',    path: '/',          icon: '📊', permiso: null },
  { label: 'Clientes',  path: '/clientes',  icon: '👥', permiso: 'ver_clientes' },
  { label: 'Pedidos',   path: '/pedidos',   icon: '🛒', permiso: 'ver_pedidos' },
  { label: 'Productos', path: '/productos', icon: '📦', permiso: 'ver_stock' },
  { label: 'Más',       path: '/configuracion', icon: '☰', permiso: null },
]

const BottomNav = () => {
  const { puedeVer } = useRol()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0F1F3D] border-t border-white/10 z-30 flex">
      {bottomItems.map((item) => {
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
    </nav>
  )
}

const AppLayout = ({ children }) => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">

      {/* Navbar desktop */}
      <nav className="hidden md:flex bg-[#0F1F3D] px-6 py-1.5 justify-between items-center z-10">
        <img src="/sentra-logo.png" alt="SENTRA" className="h-20 w-auto brightness-0 invert" />
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{user?.email}</span>
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
        <img src="/sentra-logo.png" alt="SENTRA" className="h-10 w-auto brightness-0 invert" />
        <button
          onClick={signOut}
          className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          Salir
        </button>
      </nav>

      <div className="flex flex-1">
        {/* Sidebar solo desktop */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Contenido — padding bottom extra en mobile para que no tape el bottom nav */}
        <main className="flex-1 p-4 md:p-6 bg-gray-50 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      <Calculadora />
      <BottomNav />
    </div>
  )
}

export default AppLayout