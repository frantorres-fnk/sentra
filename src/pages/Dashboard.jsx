import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  const cards = [
    { label: 'Clientes activos', value: '0', icon: '👥' },
    { label: 'Pedidos hoy', value: '0', icon: '🛒' },
    { label: 'Productos con stock bajo', value: '0', icon: '📦' },
    { label: 'Caja del día', value: '$0', icon: '💰' },
  ]

  const nombre = user?.email?.split('@')[0] || 'usuario'
  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-[#0F1F3D] px-6 py-1.5 flex justify-between items-center">
        <img src="/sentra-logo.png" alt="SENTRA" className="h-30 w-auto brightness-0 invert" />
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

      {/* Contenido */}
      <main className="p-6 max-w-6xl mx-auto">

        {/* Saludo */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#0F1F3D]">
            {saludo}, {nombre} 👋
          </h2>
          <p className="text-gray-500 mt-1">Esto es lo que está pasando hoy en tu negocio.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card, i) => (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="text-2xl mb-3">{card.icon}</div>
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-[#0F1F3D] mt-1">{card.value}</p>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

export default Dashboard