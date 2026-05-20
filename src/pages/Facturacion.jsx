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

  const fetchFacturas = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('facturas')
      .select(`*, clientes (id, razon_social, cuit, condicion_afip), usuarios (id, nombre)`)
      .order('created_at', { ascending: false })
    if (!error) setFacturas(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchFacturas() }, [])

  const facturasFiltradas = filtroEstado === 'todos' ? facturas : facturas.filter(f => f.estado === filtroEstado)
  const totalEmitido = facturas.filter(f => f.estado === 'emitida').reduce((acc, f) => acc + Number(f.total), 0)

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-[#0F1F3D]">Facturación</h2>
          <p className="text-gray-500 text-sm mt-0.5">Emití y gestioná tus comprobantes</p>
        </div>
        <button onClick={() => setModalAbierto(true)} className="bg-[#00C896] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#00b386] transition-colors">
          + Nueva
        </button>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Total facturado</p>
          <p className="text-lg md:text-2xl font-bold text-[#0F1F3D] mt-1">${totalEmitido.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Emitidas</p>
          <p className="text-lg md:text-2xl font-bold text-[#0F1F3D] mt-1">{facturas.filter(f => f.estado === 'emitida').length}</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Sin CAE</p>
          <p className="text-lg md:text-2xl font-bold text-yellow-600 mt-1">{facturas.filter(f => f.estado === 'pendiente').length}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['todos', 'pendiente', 'emitida', 'anulada'].map(e => (
          <button
            key={e}
            onClick={() => setFiltroEstado(e)}
            className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
              filtroEstado === e ? 'bg-[#0F1F3D] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {e === 'todos' ? 'Todas' : estadoConfig[e]?.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
      ) : facturasFiltradas.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No hay facturas todavía.</div>
      ) : (
        <>
          {/* MOBILE — tarjetas */}
          <div className="md:hidden space-y-3">
            {facturasFiltradas.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tipoConfig[f.tipo]?.color}`}>
                        {tipoConfig[f.tipo]?.label}
                      </span>
                      {f.numero && <span className="text-xs text-gray-400">N° {f.numero}</span>}
                    </div>
                    <p className="text-sm font-semibold text-[#0F1F3D] truncate">{f.clientes?.razon_social}</p>
                    {f.cae
                      ? <p className="text-xs text-green-600 font-medium">CAE: {f.cae}</p>
                      : <p className="text-xs text-yellow-600">Sin CAE</p>
                    }
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-2 shrink-0">
                    <span className="text-sm font-bold text-[#0F1F3D]">${Number(f.total || 0).toLocaleString('es-AR')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${estadoConfig[f.estado]?.color}`}>
                      {estadoConfig[f.estado]?.label}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                  <span className="text-xs text-gray-400">📅 {new Date(f.fecha_emision).toLocaleDateString('es-AR')}</span>
                  <button
                    onClick={() => generarFacturaPDF(f)}
                    className="text-xs text-[#00C896] font-medium hover:underline"
                  >
                    📄 PDF
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* DESKTOP — tabla */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                {facturasFiltradas.map((f) => (
                  <tr key={f.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${tipoConfig[f.tipo]?.color}`}>{tipoConfig[f.tipo]?.label}</span>
                      {f.numero && <p className="text-xs text-gray-400 mt-1">N° {f.numero}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-sm font-medium text-[#0F1F3D]">{f.clientes?.razon_social}</td>
                    <td className="px-5 py-3.5 text-sm font-bold text-[#0F1F3D]">${Number(f.total || 0).toLocaleString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      {f.cae ? <span className="text-xs text-green-600 font-medium">{f.cae}</span> : <span className="text-xs text-yellow-600">Sin CAE</span>}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{new Date(f.fecha_emision).toLocaleDateString('es-AR')}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-1 rounded-full ${estadoConfig[f.estado]?.color}`}>{estadoConfig[f.estado]?.label}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={(e) => { e.stopPropagation(); generarFacturaPDF(f) }} className="text-xs text-[#00C896] hover:underline font-medium">PDF</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalAbierto && <FacturaModal onClose={() => setModalAbierto(false)} onGuardado={fetchFacturas} />}
    </div>
  )
}

export default Facturacion