import { NavLink } from 'react-router-dom'

const menu = [
  { label: 'Dashboard', path: '/', icon: '📊' },
  { label: 'Clientes', path: '/clientes', icon: '👥' },
  { label: 'Productos', path: '/productos', icon: '📦' },
  { label: 'Stock', path: '/stock', icon: '🏭' },
  { label: 'Pedidos', path: '/pedidos', icon: '🛒' },
  { label: 'Facturación', path: '/facturacion', icon: '🧾' },
  { label: 'Cobranzas', path: '/cobranzas', icon: '💰' },
  { label: 'Proveedores', path: '/proveedores', icon: '🏪' },
  { label: 'Reportes', path: '/reportes', icon: '📈' },
]

const Sidebar = () => {
  return (
    <aside className="w-56 min-h-screen bg-[#0F1F3D] flex flex-col">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#00C896] text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar