import { NavLink } from 'react-router-dom'
import { useRol } from '../hooks/useRol'

const menu = [
  { label: 'Dashboard',    path: '/',            icon: '📊', permiso: null },
  { label: 'Clientes',     path: '/clientes',    icon: '👥', permiso: 'ver_clientes' },
  { label: 'Productos',    path: '/productos',   icon: '📦', permiso: 'ver_stock' },
  { label: 'Stock',        path: '/stock',       icon: '🏭', permiso: 'ver_stock' },
  { label: 'Pedidos',      path: '/pedidos',     icon: '🛒', permiso: 'ver_pedidos' },
  { label: 'Facturación',  path: '/facturacion', icon: '🧾', permiso: 'ver_facturacion' },
  { label: 'Cobranzas',    path: '/cobranzas',   icon: '💰', permiso: 'ver_caja' },
  { label: 'Proveedores',  path: '/proveedores', icon: '🏪', permiso: 'ver_proveedores' },
  { label: 'Reportes',     path: '/reportes',    icon: '📈', permiso: 'ver_reportes' },
  { label: 'Configuración',path: '/configuracion',icon: '⚙️', permiso: 'gestionar_usuarios' },
]

const Sidebar = () => {
  const { puedeVer, loading } = useRol()

  if (loading) return (
    <aside className="w-56 min-h-screen bg-[#0F1F3D]" />
  )

  return (
    <aside className="w-56 min-h-screen bg-[#0F1F3D] flex flex-col">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          if (item.permiso && !puedeVer(item.permiso)) return null
          return (
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
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar