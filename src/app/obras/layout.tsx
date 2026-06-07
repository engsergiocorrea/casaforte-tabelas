'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ObrasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [perfil, setPerfil] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session && pathname !== '/obras/login') {
        router.push('/obras/login')
        return
      }
      if (session) {
        const { data: eng } = await supabase.from('engenheiros').select('*').eq('usuario_id', session.user.id).single()
        const { data: cli } = await supabase.from('clientes').select('*').eq('usuario_id', session.user.id).single()
        setPerfil(eng ? { ...eng, tipo: 'engenheiro' } : cli ? { ...cli, tipo: 'cliente' } : null)
        setAuthenticated(true)
      }
    })
  }, [pathname])

  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/obras/login'
  }

  if (pathname === '/obras/login') return <>{children}</>

  if (authenticated === null) return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Carregando...</div>
    </div>
  )

  if (!authenticated) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0' }}>
      <header style={{ background: '#1E1E1E', padding: '0 24px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
            alt="Casa Forte" style={{ height: '28px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }} />
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>Portal de Obras</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {perfil && (
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
              {perfil.tipo === 'engenheiro' ? '👷 ' : '👤 '}{perfil.nome}
            </span>
          )}
          <button onClick={handleSignOut}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </header>
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {children}
      </main>
    </div>
  )
}
