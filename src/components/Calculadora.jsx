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
    if (esperandoNuevo) { setDisplay('0,'); setEsperandoNuevo(false); return }
    if (!display.includes(',')) setDisplay(display + ',')
  }

  const presionarOperacion = (op) => {
    const valor = parseFloat(display.replace(',', '.'))
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
      case '−': return a - b
      case '×': return a * b
      case '÷': return b !== 0 ? a / b : 0
      default: return b
    }
  }

  const formatear = (num) => {
    const str = String(parseFloat(num.toFixed(10)))
    return str.replace('.', ',')
  }

  const presionarIgual = () => {
    if (operacion === null || valorAnterior === null) return
    const valor = parseFloat(display.replace(',', '.'))
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
    const valor = parseFloat(display.replace(',', '.'))
    if (valorAnterior !== null && operacion) {
      const resultado = valorAnterior * (valor / 100)
      setDisplay(formatear(resultado))
      setEsperandoNuevo(true)
    } else {
      setDisplay(formatear(valor / 100))
    }
  }

  const cambiarSigno = () => {
    setDisplay(formatear(parseFloat(display.replace(',', '.')) * -1))
  }

  const btnNum = "bg-white/90 active:bg-white/60 text-black font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"
  const btnOp = "bg-[#FF9500] active:bg-[#FFB143] text-white font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"
  const btnGray = "bg-[#A5A5A5] active:bg-[#BFBFBF] text-black font-normal rounded-full h-16 w-16 text-xl transition-all flex items-center justify-center shadow-sm"
  const btnOpActivo = "bg-white active:bg-white/80 text-[#FF9500] font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setAbierta(!abierta)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-[#0F1F3D] text-white rounded-full shadow-lg hover:bg-[#1a2f5a] transition-all z-40 flex items-center justify-center text-lg"
        title="Calculadora"
      >
        🧮
      </button>

      {/* Panel calculadora */}
      {abierta && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAbierta(false)} />
          <div className="fixed bottom-36 right-4 md:bottom-22 md:right-6 z-50 bg-black rounded-3xl shadow-2xl overflow-hidden p-5 w-72">

            {/* Display */}
            <div className="mb-4 px-2">
              {operacion && (
                <p className="text-right text-gray-500 text-sm h-5">
                  {valorAnterior?.toString().replace('.', ',')} {operacion}
                </p>
              )}
              <p className={`text-right text-white font-light truncate ${display.length > 9 ? 'text-3xl' : 'text-5xl'}`}>
                {Number(display.replace(',', '.')).toLocaleString('es-AR', { maximumFractionDigits: 10 })}
                {display.endsWith(',') ? ',' : ''}
              </p>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-4 gap-3">
              {/* Fila 1 */}
              <button onClick={limpiar} className={btnGray}>{display === '0' ? 'AC' : 'C'}</button>
              <button onClick={cambiarSigno} className={btnGray}>+/−</button>
              <button onClick={porcentaje} className={btnGray}>%</button>
              <button onClick={() => presionarOperacion('÷')} className={operacion === '÷' && esperandoNuevo ? btnOpActivo : btnOp}>÷</button>

              {/* Fila 2 */}
              <button onClick={() => presionarNumero('7')} className={btnNum}>7</button>
              <button onClick={() => presionarNumero('8')} className={btnNum}>8</button>
              <button onClick={() => presionarNumero('9')} className={btnNum}>9</button>
              <button onClick={() => presionarOperacion('×')} className={operacion === '×' && esperandoNuevo ? btnOpActivo : btnOp}>×</button>

              {/* Fila 3 */}
              <button onClick={() => presionarNumero('4')} className={btnNum}>4</button>
              <button onClick={() => presionarNumero('5')} className={btnNum}>5</button>
              <button onClick={() => presionarNumero('6')} className={btnNum}>6</button>
              <button onClick={() => presionarOperacion('−')} className={operacion === '−' && esperandoNuevo ? btnOpActivo : btnOp}>−</button>

              {/* Fila 4 */}
              <button onClick={() => presionarNumero('1')} className={btnNum}>1</button>
              <button onClick={() => presionarNumero('2')} className={btnNum}>2</button>
              <button onClick={() => presionarNumero('3')} className={btnNum}>3</button>
              <button onClick={() => presionarOperacion('+')} className={operacion === '+' && esperandoNuevo ? btnOpActivo : btnOp}>+</button>

              {/* Fila 5 */}
              <button onClick={() => presionarNumero('0')} className="bg-white/90 active:bg-white/60 text-black font-normal rounded-full h-16 col-span-2 text-2xl transition-all flex items-center px-6 shadow-sm">0</button>
              <button onClick={presionarDecimal} className={btnNum}>,</button>
              <button onClick={presionarIgual} className={btnOp}>=</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Calculadora