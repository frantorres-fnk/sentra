import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clientes from './pages/Clientes'
import Productos from './pages/Productos'
import Stock from './pages/Stock'
import Pedidos from './pages/Pedidos'
import Proveedores from './pages/Proveedores'
import Cobranzas from './pages/Cobranzas'
import Reportes from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import Facturacion from './pages/Facturacion'
import CajaChica from './pages/CajaChica'
import SentraAI from './pages/SentraAI'
import Cotizaciones from './pages/Cotizaciones'
import AppLayout from './layouts/AppLayout'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

const Layout = ({ children }) => (
  <ProtectedRoute>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
)

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/clientes" element={<Layout><Clientes /></Layout>} />
      <Route path="/productos" element={<Layout><Productos /></Layout>} />
      <Route path="/stock" element={<Layout><Stock /></Layout>} />
      <Route path="/pedidos" element={<Layout><Pedidos /></Layout>} />
      <Route path="/cotizaciones" element={<Layout><Cotizaciones /></Layout>} />
      <Route path="/proveedores" element={<Layout><Proveedores /></Layout>} />
      <Route path="/cobranzas" element={<Layout><Cobranzas /></Layout>} />
      <Route path="/reportes" element={<Layout><Reportes /></Layout>} />
      <Route path="/configuracion" element={<Layout><Configuracion /></Layout>} />
      <Route path="/facturacion" element={<Layout><Facturacion /></Layout>} />
      <Route path="/caja-chica" element={<Layout><CajaChica /></Layout>} />
      <Route path="/sentra-ai" element={<Layout><SentraAI /></Layout>} />
    </Routes>
  )
}

export default App