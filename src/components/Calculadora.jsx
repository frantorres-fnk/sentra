import { useState } from 'react'

const Calculadora = () => {
  const [abierta, setAbierta] = useState(false)
  const [display, setDisplay] = useState('0')
  const [operacion, setOperacion] = useState(null)
  const [valorAnterior, setValorAnterior] = useState(null)
  const [esperandoNuevo, setEsperandoNuevo] = useState(false)

  const presionarNumero = (num) => {
    if (esperandoNuevo) {
      setDisplay(String(num))
      setEsperandoNuevo(false)
    } else {
      setDisplay(display === '0' ? String(num) : display + num)
    }
  }

  const presionarDecimal = () => {
    if (esperandoNuevo) {
      setDisplay('0.')
      setEsperandoNuevo(false)
      return
    }
    if (!display.includes('.')) setDisplay(display + '.')
  }

  const presionarOperacion = (op) => {
    const valor = parseFloat(display)
    if (valorAnterior !== null && !esperandoNuevo) {
      const resultado = calcular(valorAnterior, valor, operacion)
      setDisplay(formatear(resultado))
      setValorAnterior(resultado)
    } else {
      setValorAnterior(valor)
    }
    setEsperandoNuevo(true)
    setOperacion(op)
  }

  const calcular = (a, b, op) => {
    switch (op) {
      case '+': return a + b
      case '-': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const formatear = (num) => {
    const str = String(parseFloat(num.toFixed(10)))
    return str
  }

  const presionarIgual = () => {
    if (operacion === null || valorAnterior === null) return
    const valor = parseFloat(display)
    const resultado = calcular(valorAnterior, valor, operacion)
    setDisplay(formatear(resultado))
    setValorAnterior(null)
    setOperacion(null)
    setEsperandoNuevo(true)
  }

  const limpiar = () => {
    setDisplay('0')
    setOperacion(null)
    setValorAnterior(null)
    setEsperandoNuevo(false)
  }

  const porcentaje = () => {
    setDisplay(formatear(parseFloat(display) / 100))
  }

  const cambiarSigno = () => {
    setDisplay(formatear(parseFloat(display) * -1))
  }

  const btnNum = "bg-white hover:bg-gray-50 text-[#0F1F3D] font-medium rounded-xl h-12 text-sm transition-colors border border-gray-100 shadow-sm"
  const btnOp = "bg-[#00C896] hover:bg-[#00b386] text-white font-semibold rounded-xl h-12 text-sm transition-colors shadow-sm"
  const btnGray = "bg-gray-100 hover:bg-gray-200 text-[#0F1F3D] font-medium rounded-xl h-12 text-sm transition-colors"

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierta(!abierta)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-[#0F1F3D] text-white rounded-full shadow-lg hover:bg-[#1a2f5a] transition-all z-40 flex items-center justify-center text-lg"
        title="Calculadora"
      >
        🧮
      </button>

      {/* Panel calculadora */}
      {abierta && (
        <div className="fixed bottom-22 right-6 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-[#0F1F3D]">
            <span className="text-white text-sm font-semibold">Calculadora</span>
            <button onClick={() => setAbierta(false)} className="text-white/60 hover:text-white text-lg">✕</button>
          </div>

          {/* Display */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            {operacion && (
              <p className="text-xs text-gray-400 text-right h-4">
                {valorAnterior} {operacion}
              </p>
            )}
            <p className="text-right text-2xl font-light text-[#0F1F3D] truncate">
              {Number(display).toLocaleString('es-AR', { maximumFractionDigits: 10 })}
            </p>
          </div>

          {/* Botones */}
          <div className="p-3 grid grid-cols-4 gap-2">
            <button onClick={limpiar} className={btnGray}>AC</button>
            <button onClick={cambiarSigno} className={btnGray}>+/-</button>
            <button onClick={porcentaje} className={btnGray}>%</button>
            <button onClick={() => presionarOperacion('÷')} className={`${btnOp} ${operacion === '÷' ? 'ring-2 ring-[#00C896]/50' : ''}`}>÷</button>

            <button onClick={() => presionarNumero('7')} className={btnNum}>7</button>
            <button onClick={() => presionarNumero('8')} className={btnNum}>8</button>
            <button onClick={() => presionarNumero('9')} className={btnNum}>9</button>
            <button onClick={() => presionarOperacion('×')} className={`${btnOp} ${operacion === '×' ? 'ring-2 ring-[#00C896]/50' : ''}`}>×</button>

            <button onClick={() => presionarNumero('4')} className={btnNum}>4</button>
            <button onClick={() => presionarNumero('5')} className={btnNum}>5</button>
            <button onClick={() => presionarNumero('6')} className={btnNum}>6</button>
            <button onClick={() => presionarOperacion('-')} className={`${btnOp} ${operacion === '-' ? 'ring-2 ring-[#00C896]/50' : ''}`}>-</button>

            <button onClick={() => presionarNumero('1')} className={btnNum}>1</button>
            <button onClick={() => presionarNumero('2')} className={btnNum}>2</button>
            <button onClick={() => presionarNumero('3')} className={btnNum}>3</button>
            <button onClick={() => presionarOperacion('+')} className={`${btnOp} ${operacion === '+' ? 'ring-2 ring-[#00C896]/50' : ''}`}>+</button>

            <button onClick={() => presionarNumero('0')} className={`${btnNum} col-span-2`}>0</button>
            <button onClick={presionarDecimal} className={btnNum}>,</button>
            <button onClick={presionarIgual} className={btnOp}>=</button>
          </div>
        </div>
      )}
    </>
  )
}

export default Calculadora