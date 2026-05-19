import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import FacturaModal from '../components/FacturaModal'
import { generarFacturaPDF } from '../lib/generarPDF'

const tipoConfig = {
  A: { label: 'Factura A', color: 'bg-blue-50 text-blue-600' },
  B: { label: 'Factura B', color: 'bg-green-50 text-green-600' },
  C: { label: 'Factura C', color: 'bg-gray-100 text-gray-600' },
}

const estadoConfig = {
  pendiente: { label: 'Pendiente', color: 'bg-yellow-50 text-yellow-600' },
  emitida:   { label: 'Emitida',   color: 'bg-green-50 text-green-600' },
  anulada:   { label: 'Anulada',   color: 'bg-red-50 text-red-600' },
}

const Facturacion = () => {
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)

  const fetchFacturas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('facturas')
      .select(`
        *,
        clientes (id, razon_social, cuit, condicion_afip),
        usuarios (id, nombre)
      `)
      .order('created_at', { ascending: false })

    if (!error) setFacturas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchFacturas()
  }, [])

  const facturasFiltradas = filtroEstado === 'todos'
    ? facturas
    : facturas.filter(f => f.estado === filtroEstado)

  const totalEmitido = facturas
    .filter(f => f.estado === 'emitida')
    .reduce((acc, f) => acc + Number(f.total), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0F1F3D]">Facturación</h2>
          <p className="text-gray-500 mt-1">Emití y gestioná tus comprobantes electrónicos</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-[#00C896] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors"
        >
          + Nueva factura
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total facturado</p>
          <p className="text-2xl font-bold text-[#0F1F3D] mt-1">
            ${totalEmitido.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Facturas emitidas</p>
          <p className="text-2xl font-bold text-[#0F1F3D] mt-1">
            {facturas.filter(f => f.estado === 'emitida').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Pendientes de CAE</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {facturas.filter(f => f.estado === 'pendiente').length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['todos', 'pendiente', 'emitida', 'anulada'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filtroEstado === e
                ? 'bg-[#0F1F3D] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todas' : estadoConfig[e]?.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Comprobante</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Total</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">CAE</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">Cargando...</td>
              </tr>
            ) : facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                  No hay facturas todavía.
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => setFacturaSeleccionada(f)}
                  className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoConfig[f.tipo]?.color}`}>
                      {tipoConfig[f.tipo]?.label}
                    </span>
                    {f.numero && <p className="text-xs text-gray-400 mt-1">N° {f.numero}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">
                    {f.clientes?.razon_social}
                  </td>
                  <td className="px-5 py-3.5 text-sm font-bold text-[#0F1F3D]">
                    ${Number(f.total || 0).toLocaleString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5">
                    {f.cae ? (
                      <span className="text-xs text-green-600 font-medium">{f.cae}</span>
                    ) : (
                      <span className="text-xs text-yellow-600">Sin CAE</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {new Date(f.fecha_emision).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[f.estado]?.color}`}>
                      {estadoConfig[f.estado]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        generarFacturaPDF(f)
                      }}
                      className="text-xs text-[#00C896] hover:underline font-medium"
                    >
                      PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <FacturaModal
          onClose={() => setModalAbierto(false)}
          onGuardado={fetchFacturas}
        />
      )}
    </div>
  )
}

export default Facturacion