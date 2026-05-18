import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'

const AppLayout = ({ children }) => {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-[#0F1F3D] px-6 py-1.5 flex justify-between items-center z-10">
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
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}

export default AppLayout