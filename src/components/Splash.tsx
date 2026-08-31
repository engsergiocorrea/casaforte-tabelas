'use client'

import { useEffect, useState } from 'react'

// Tela de carregamento (splash) exibida ao abrir/recarregar o app. Aparece por
// ~1,2s e some com um fade. Fica no layout raiz, então NÃO reaparece nas
// navegações internas (só em load/refresh de página). Provisória: usa a logo da
// Casa Forte até termos a marca própria do sistema.
const LOGO =
  'https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png'

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

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#E8390E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: saindo ? 0 : 1,
        transition: 'opacity 420ms ease',
        pointerEvents: saindo ? 'none' : 'auto',
      }}
    >
      {/* logo no centro exato da tela */}
      <img
        src={LOGO}
        alt="Casa Forte"
        style={{ height: '64px', maxWidth: '70vw', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
      />
      {/* pontinhos logo abaixo do rodapé, sem deslocar a logo */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '16%', display: 'flex', justifyContent: 'center', gap: '9px' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ffffff',
              animation: `cfSplashPulse 1s ${i * 0.16}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes cfSplashPulse{0%,100%{opacity:.25;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`}</style>
    </div>
  )
}
