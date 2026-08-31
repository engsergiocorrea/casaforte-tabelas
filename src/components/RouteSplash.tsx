'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { SplashScreen } from './SplashScreen'

// Garante a tela de carregamento em TODA navegação entre páginas (públicas):
// quando a rota muda, mostra a splash por um instante curto e some. Complementa
// os loading.tsx (que só aparecem quando o servidor demora). Não roda no /admin
// e pula o primeiro render (a splash de abertura já cobre isso).
export function RouteSplash() {
  const pathname = usePathname()
  const [visivel, setVisivel] = useState(false)
  const primeiro = useRef(true)

  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false
      return
    }
    if (pathname?.startsWith('/admin')) return
    setVisivel(true)
    const t = setTimeout(() => setVisivel(false), 650)
    return () => clearTimeout(t)
  }, [pathname])

  return visivel ? <SplashScreen /> : null
}
