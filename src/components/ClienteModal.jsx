import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ClienteModal = ({ onClose, onGuardado }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [vendedores, setVendedores] = useState([])
  const [form, setForm] = useState({
    razon_social: '',
    nombre_fantasia: '',
    cuit: '',
    condicion_afip: 'responsable_inscripto',
    email: '',
    telefono: '',
    direccion: '',
    provincia: '',
    codigo_postal: '',
    zona: '',
    vendedor_id: '',
    lista_precio: 1,
    descuento_cascada: '',
  })

  const [escalones, setEscalones] = useState(['', '', '', ''])

  useEffect(() => {
    const fetchVendedores = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: usuarioData } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('auth_user_id', user.id)
        .single()
      if (!usuarioData) return
      const { data } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .eq('empresa_id', usuarioData.empresa_id)
        .eq('activo', true)
      setVendedores(data || [])
    }
    fetchVendedores()
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleEscalonChange = (index, value) => {
    const nuevos = [...escalones]
    nuevos[index] = value
    setEscalones(nuevos)
    setForm({ ...form, descuento_cascada: nuevos.filter(e => parseFloat(e) > 0).join('+') })
  }

  const calcularDescuentoReal = (escalones) => {
    let precio = 100
    escalones.forEach(e => {
      const val = parseFloat(e)
      if (!isNaN(val) && val > 0) precio = precio * (1 - val / 100)
    })
    return (100 - precio).toFixed(2)
  }

  const tieneDescuento = escalones.some(e => parseFloat(e) > 0)
  const descuentoReal = calcularDescuentoReal(escalones)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('auth_user_id', user.id)
      .single()

    if (usuarioError || !usuarioData) {
      setError('No se encontró la empresa asociada a tu usuario.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('clientes')
      .insert([{
        ...form,
        empresa_id: usuarioData.empresa_id,
        vendedor_id: form.vendedor_id || null,
      }])

    if (error) {
      setError('Error al guardar el cliente. Intentá de nuevo.')
      setLoading(false)
    } else {
      onGuardado()
      onClose()
    }
  }

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C896]"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-[#0F1F3D]">Nuevo cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className={labelClass}>Razón social *</label>
            <input name="razon_social" value={form.razon_social} onChange={handleChange} className={inputClass} required />
          </div>

          <div>
            <label className={labelClass}>Nombre fantasía</label>
            <input name="nombre_fantasia" value={form.nombre_fantasia} onChange={handleChange} placeholder="Como lo conocen en el mercado" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CUIT</label>
              <input name="cuit" value={form.cuit} onChange={handleChange} placeholder="20-12345678-9" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Condición AFIP</label>
              <select name="condicion_afip" value={form.condicion_afip} onChange={handleChange} className={inputClass}>
                <option value="responsable_inscripto">Responsable Inscripto</option>
                <option value="monotributista">Monotributista</option>
                <option value="consumidor_final">Consumidor Final</option>
                <option value="exento">Exento</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Para envío de facturas" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="11-1234-5678" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Calle, número, piso/depto" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Provincia</label>
              <select name="provincia" value={form.provincia} onChange={handleChange} className={inputClass}>
                <option value="">Seleccionar...</option>
                <option value="Buenos Aires">Buenos Aires</option>
                <option value="CABA">CABA</option>
                <option value="Catamarca">Catamarca</option>
                <option value="Chaco">Chaco</option>
                <option value="Chubut">Chubut</option>
                <option value="Córdoba">Córdoba</option>
                <option value="Corrientes">Corrientes</option>
                <option value="Entre Ríos">Entre Ríos</option>
                <option value="Formosa">Formosa</option>
                <option value="Jujuy">Jujuy</option>
                <option value="La Pampa">La Pampa</option>
                <option value="La Rioja">La Rioja</option>
                <option value="Mendoza">Mendoza</option>
                <option value="Misiones">Misiones</option>
                <option value="Neuquén">Neuquén</option>
                <option value="Río Negro">Río Negro</option>
                <option value="Salta">Salta</option>
                <option value="San Juan">San Juan</option>
                <option value="San Luis">San Luis</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="Santa Fe">Santa Fe</option>
                <option value="Santiago del Estero">Santiago del Estero</option>
                <option value="Tierra del Fuego">Tierra del Fuego</option>
                <option value="Tucumán">Tucumán</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Código postal</label>
              <input name="codigo_postal" value={form.codigo_postal} onChange={handleChange} placeholder="Ej: 1706" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Zona de reparto</label>
            <input name="zona" value={form.zona} onChange={handleChange} placeholder="Ej: Norte, Centro, Sur, Haedo" className={inputClass} />
          </div>

          {/* Vendedor asignado */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Asignación comercial</p>
            <label className={labelClass}>Vendedor asignado *</label>
            <select name="vendedor_id" value={form.vendedor_id} onChange={handleChange} className={inputClass} required>
              <option value="">Seleccioná un vendedor</option>
              {vendedores.map(v => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>

          {/* Condiciones comerciales */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 border-b pb-1">Condiciones comerciales</p>

            <div className="mb-4">
              <label className={labelClass}>Lista de precios</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setForm({ ...form, lista_precio: 1 })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.lista_precio === 1 ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-500'
                  }`}>
                  📋 Lista 1
                  <p className="text-xs font-normal mt-0.5">Mostrador</p>
                </button>
                <button type="button" onClick={() => setForm({ ...form, lista_precio: 2 })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.lista_precio === 2 ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-500'
                  }`}>
                  🏷️ Lista 2
                  <p className="text-xs font-normal mt-0.5">Mayorista</p>
                </button>
              </div>
            </div>

            <div>
              <label className={labelClass}>Descuentos en cascada</label>
              <p className="text-xs text-gray-400 mb-2">Ingresá hasta 4 escalones de descuento</p>
              <div className="flex gap-2 items-center">
                {escalones.map((e, i) => (
                  <div key={i} className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      value={e}
                      onChange={(ev) => handleEscalonChange(i, ev.target.value)}
                      placeholder="0"
                      min="0"
                      max="100"
                      className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#00C896]"
                    />
                    {i < 3 && <span className="text-gray-400 text-sm shrink-0">+</span>}
                  </div>
                ))}
                <span className="text-gray-400 text-sm shrink-0">%</span>
              </div>
              {tieneDescuento && (
                <div className="mt-3 bg-orange-50 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs font-semibold text-orange-600">Descuento real aplicado</p>
                      <p className="text-xs text-orange-400 font-mono">
                        {escalones.filter(e => parseFloat(e) > 0).map(e => e + '%').join(' → ')}
                      </p>
                    </div>
                    <p className="text-xl font-bold text-orange-700">{descuentoReal}%</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-[#00C896] text-white rounded-lg py-2.5 text-sm font-medium hover:bg-[#00b386] transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ClienteModal