import { useState, useEffect, useCallback } from 'react'

const Calculadora = () => {
  const [abierta, setAbierta] = useState(false)
  const [display, setDisplay] = useState('0')
  const [operacion, setOperacion] = useState(null)
  const [valorAnterior, setValorAnterior] = useState(null)
  const [esperandoNuevo, setEsperandoNuevo] = useState(false)

  const presionarNumero = useCallback((num) => {
    if (esperandoNuevo) {
      setDisplay(String(num))
      setEsperandoNuevo(false)
    } else {
      setDisplay(prev => prev === '0' ? String(num) : prev + num)
    }
  }, [esperandoNuevo])

  const presionarDecimal = useCallback(() => {
    if (esperandoNuevo) { setDisplay('0,'); setEsperandoNuevo(false); return }
    setDisplay(prev => prev.includes(',') ? prev : prev + ',')
  }, [esperandoNuevo])

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

  const presionarOperacion = useCallback((op) => {
    setValorAnterior(prev => {
      const valor = parseFloat(display.replace(',', '.'))
      if (prev !== null && !esperandoNuevo) {
        const resultado = calcular(prev, valor, operacion)
        setDisplay(formatear(resultado))
        return resultado
      }
      return valor
    })
    setEsperandoNuevo(true)
    setOperacion(op)
  }, [display, esperandoNuevo, operacion])

  const presionarIgual = useCallback(() => {
    if (operacion === null || valorAnterior === null) return
    const valor = parseFloat(display.replace(',', '.'))
    const resultado = calcular(valorAnterior, valor, operacion)
    setDisplay(formatear(resultado))
    setValorAnterior(null)
    setOperacion(null)
    setEsperandoNuevo(true)
  }, [display, operacion, valorAnterior])

  const limpiar = useCallback(() => {
    setDisplay('0')
    setOperacion(null)
    setValorAnterior(null)
    setEsperandoNuevo(false)
  }, [])

  const porcentaje = useCallback(() => {
    const valor = parseFloat(display.replace(',', '.'))
    if (valorAnterior !== null && operacion) {
      setDisplay(formatear(valorAnterior * (valor / 100)))
      setEsperandoNuevo(true)
    } else {
      setDisplay(formatear(valor / 100))
    }
  }, [display, valorAnterior, operacion])

  const cambiarSigno = useCallback(() => {
    setDisplay(prev => formatear(parseFloat(prev.replace(',', '.')) * -1))
  }, [])

  // Teclado
  useEffect(() => {
    if (!abierta) return

    const handleKeyDown = (e) => {
      // Evitar que el teclado interfiera con inputs del sistema
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      if (e.key >= '0' && e.key <= '9') {
        presionarNumero(e.key)
      } else if (e.key === ',' || e.key === '.') {
        presionarDecimal()
      } else if (e.key === '+') {
        presionarOperacion('+')
      } else if (e.key === '-') {
        presionarOperacion('−')
      } else if (e.key === '*') {
        presionarOperacion('×')
      } else if (e.key === '/') {
        e.preventDefault()
        presionarOperacion('÷')
      } else if (e.key === 'Enter' || e.key === '=') {
        presionarIgual()
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        limpiar()
      } else if (e.key === 'Backspace') {
        setDisplay(prev => prev.length > 1 ? prev.slice(0, -1) : '0')
      } else if (e.key === '%') {
        porcentaje()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [abierta, presionarNumero, presionarDecimal, presionarOperacion, presionarIgual, limpiar, porcentaje])

  const btnNum = "bg-white/90 active:bg-white/60 text-black font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"
  const btnOp = "bg-[#FF9500] active:bg-[#FFB143] text-white font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"
  const btnGray = "bg-[#A5A5A5] active:bg-[#BFBFBF] text-black font-normal rounded-full h-16 w-16 text-xl transition-all flex items-center justify-center shadow-sm"
  const btnOpActivo = "bg-white active:bg-white/80 text-[#FF9500] font-normal rounded-full h-16 w-16 text-2xl transition-all flex items-center justify-center shadow-sm"

  return (
    <>
      <button
        onClick={() => setAbierta(!abierta)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-12 h-12 bg-[#0F1F3D] text-white rounded-full shadow-lg hover:bg-[#1a2f5a] transition-all z-40 flex items-center justify-center text-lg"
        title="Calculadora (teclas del teclado)"
      >
        🧮
      </button>

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
              {/* Indicador teclado activo */}
              <p className="text-right text-gray-600 text-xs mt-1">⌨️ teclado activo</p>
            </div>

            {/* Botones */}
            <div className="grid grid-cols-4 gap-3">
              <button onClick={limpiar} className={btnGray}>{display === '0' ? 'AC' : 'C'}</button>
              <button onClick={cambiarSigno} className={btnGray}>+/−</button>
              <button onClick={porcentaje} className={btnGray}>%</button>
              <button onClick={() => presionarOperacion('÷')} className={operacion === '÷' && esperandoNuevo ? btnOpActivo : btnOp}>÷</button>

              <button onClick={() => presionarNumero('7')} className={btnNum}>7</button>
              <button onClick={() => presionarNumero('8')} className={btnNum}>8</button>
              <button onClick={() => presionarNumero('9')} className={btnNum}>9</button>
              <button onClick={() => presionarOperacion('×')} className={operacion === '×' && esperandoNuevo ? btnOpActivo : btnOp}>×</button>

              <button onClick={() => presionarNumero('4')} className={btnNum}>4</button>
              <button onClick={() => presionarNumero('5')} className={btnNum}>5</button>
              <button onClick={() => presionarNumero('6')} className={btnNum}>6</button>
              <button onClick={() => presionarOperacion('−')} className={operacion === '−' && esperandoNuevo ? btnOpActivo : btnOp}>−</button>

              <button onClick={() => presionarNumero('1')} className={btnNum}>1</button>
              <button onClick={() => presionarNumero('2')} className={btnNum}>2</button>
              <button onClick={() => presionarNumero('3')} className={btnNum}>3</button>
              <button onClick={() => presionarOperacion('+')} className={operacion === '+' && esperandoNuevo ? btnOpActivo : btnOp}>+</button>

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