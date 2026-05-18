import { useAuth } from '../context/AuthContext'

const Dashboard = () => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0F1F3D] text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wide">SENTRA</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">{user?.email}</span>
          <button
            onClick={signOut}
            className="text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="p-6">
        <h2 className="text-2xl font-bold text-[#0F1F3D]">Bienvenido a SENTRA</h2>
        <p className="text-gray-500 mt-1">Panel de control</p>
      </main>
    </div>
  )
}

export default Dashboard