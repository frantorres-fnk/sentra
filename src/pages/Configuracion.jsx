import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const Configuracion = () => {
  const [tab, setTab] = useState('empresa')
  const [empresa, setEmpresa] = useState(null)
  const [usuarios, setUsuarios] = useState([])
  const [depositos, setDepositos] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!usuarioData) return

    const [
      { data: emp },
      { data: usrs },
      { data: deps },
    ] = await Promise.all([
      supabase.from('empresas').select('*').eq('id', usuarioData.empresa_id).single(),
      supabase.from('usuarios').select('*, roles(nombre)').eq('empresa_id', usuarioData.empresa_id),
      supabase.from('depositos').select('*').eq('empresa_id', usuarioData.empresa_id).order('nombre'),
    ])

    setEmpresa(emp)
    setUsuarios(usrs || [])
    setDepositos(deps || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const guardarEmpresa = async (e) => {
    e.preventDefault()
    setGuardando(true)
    await supabase.from('empresas').update({
      nombre: empresa.nombre,
      cuit: empresa.cuit,
    }).eq('id', empresa.id)
    setMensaje('Datos guardados correctamente.')
    setGuardando(false)
    setTimeout(() => setMensaje(null), 3000)
  }

  const agregarDeposito = async (e) => {
    e.preventDefault()
    const nombre = e.target.nombre.value
    const direccion = e.target.direccion.value
    await supabase.from('depositos').insert([{
      empresa_id: empresa.id,
      nombre,
      direccion,
    }])
    e.target.reset()
    fetchData()
  }

  const desactivarDeposito = async (id) => {
    await supabase.from('depositos').update({ activo: false }).eq('id', id)
    fetchData()
  }

  const desactivarUsuario = async (id) => {
    await supabase.from('usuarios').update({ activo: false }).eq('id', id)
    fetchData()
  }

  const planLabel = { starter: 'Starter', business: 'Business', enterprise: 'Enterprise' }
  const planColor = { starter: 'bg-gray-100 text-gray-600', business: 'bg-blue-50 text-blue-600', enterprise: 'bg-purple-50 text-purple-600' }

  if (loading) return <div className="text-center py-12 text-gray-400">Cargando...</div>

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0F1F3D]">Configuración</h2>
        <p className="text-gray-500 mt-1">Gestioná tu empresa, usuarios y depósitos</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {['empresa', 'usuarios', 'depositos'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors capitalize ${
              tab === t
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {t === 'empresa' ? 'Mi empresa' : t === 'usuarios' ? 'Usuarios' : 'Depósitos'}
          </button>
        ))}
      </div>

      {/* Tab Empresa */}
      {tab === 'empresa' && empresa && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg">
          <div className="flex items-center gap-3 mb-5">
            <h3 className="text-sm font-semibold text-[#0F1F3D]">Datos de la empresa</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${planColor[empresa.plan]}`}>
              Plan {planLabel[empresa.plan]}
            </span>
          </div>

          <form onSubmit={guardarEmpresa} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                value={empresa.nombre}
                onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
              <input
                value={empresa.cuit || ''}
                onChange={(e) => setEmpresa({ ...empresa, cuit: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subdominio</label>
              <input
                value={empresa.subdominio}
                disabled
                className="w-full border border-gray-100 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400"
              />
            </div>

            {mensaje && <p className="text-green-600 text-sm">{mensaje}</p>}

            <button
              type="submit"
              disabled={guardando}
              className="bg-[#00C896] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Usuarios */}
      {tab === 'usuarios' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
            <p className="text-sm font-medium text-[#0F1F3D]">
              {usuarios.filter(u => u.activo).length} usuarios activos
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="px-5 py-3.5"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-t border-gray-50">
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">{u.nombre}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{u.roles?.nombre}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${u.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {u.activo && (
                      <button
                        onClick={() => desactivarUsuario(u.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Desactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Depósitos */}
      {tab === 'depositos' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody>
                {depositos.map(d => (
                  <tr key={d.id} className="border-t border-gray-50">
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">{d.nombre}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{d.direccion || '-'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${d.activo ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {d.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {d.activo && (
                        <button
                          onClick={() => desactivarDeposito(d.id)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Agregar depósito */}
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 max-w-md">
            <h3 className="text-sm font-semibold text-[#0F1F3D] mb-4">Agregar depósito</h3>
            <form onSubmit={agregarDeposito} className="space-y-3">
              <input
                name="nombre"
                placeholder="Nombre del depósito *"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                required
              />
              <input
                name="direccion"
                placeholder="Dirección (opcional)"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
              />
              <button
                type="submit"
                className="bg-[#00C896] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors w-full"
              >
                + Agregar depósito
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Configuracion