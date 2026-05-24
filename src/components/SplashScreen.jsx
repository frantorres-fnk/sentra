import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer1 = setTimeout(() => setFadeOut(true), 2000)
    const timer2 = setTimeout(() => onFinish(), 2600)
    return () => { clearTimeout(timer1); clearTimeout(timer2) }
  }, [])

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-600 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ backgroundColor: '#0F1F3D' }}>

      {/* Logo */}
      <div className="flex flex-col items-center gap-6">
        <img
          src="/sentra-logo.png"
          alt="Sentra"
          className="w-28 h-28 object-contain drop-shadow-2xl"
          style={{ filter: 'brightness(1.1) contrast(1.05)' }}
        />

        {/* Nombre */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-widest">
            SENTRA
          </h1>
          <p className="text-xs text-blue-300 tracking-[0.3em] mt-1 uppercase">
            powered by FENIKSO
          </p>
        </div>

        {/* Loader */}
        <div className="w-32 h-0.5 bg-blue-900 rounded-full overflow-hidden mt-4">
          <div className="h-full bg-blue-400 rounded-full animate-[loading_2s_ease-in-out_forwards]" />
        </div>
      </div>
    </div>
  )
}
