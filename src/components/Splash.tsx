'use client'

import { useEffect, useState } from 'react'
import { SplashScreen } from './SplashScreen'

// Splash inicial (abertura/refresh do app): mostra a tela de carregamento por
// ~1,2s e some com um fade. Fica no layout raiz. As transições ENTRE páginas
// usam os loading.tsx das rotas (mesmo visual, SplashScreen).
export function Splash() {
  const [visivel, setVisivel] = useState(true)
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setSaindo(true), 1200)
    const t2 = setTimeout(() => setVisivel(false), 1650)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!visivel) return null
  return <SplashScreen style={{ opacity: saindo ? 0 : 1, transition: 'opacity 420ms ease', pointerEvents: saindo ? 'none' : 'auto' }} />
}
