// Visual da tela de carregamento (fundo laranja da marca, logo Casa Forte
// centralizada e grande, 3 pontinhos animados). Sem 'use client': é só CSS, então
// serve tanto pra splash inicial (Splash.tsx) quanto pros loading.tsx das rotas
// (transição entre páginas). Provisório até a marca própria do sistema — trocar
// LOGO e a cor de fundo.
import type { CSSProperties } from 'react'

export const SPLASH_LOGO =
  'https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png'
export const SPLASH_BG = '#E8390E'

export function SplashScreen({ style }: { style?: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: SPLASH_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <img
        src={SPLASH_LOGO}
        alt="Casa Forte"
        style={{ height: '300px', maxWidth: '90vw', objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
      />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: '15%', display: 'flex', justifyContent: 'center', gap: '10px' }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: '11px',
              height: '11px',
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
