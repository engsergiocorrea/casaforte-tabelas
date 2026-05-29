'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/admin/empreendimentos', label: 'Empreendimentos', icon: '🏗️' },
  { href: '/admin/unidades', label: 'Unidades', icon: '🏠' },
  { href: '/admin/vendas', label: 'Vendas', icon: '💼' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
{ href: '/admin/propostas', label: 'Propostas', icon: '📋' },
{ href: '/admin/usuarios', label: 'Usuários', icon: '👥' },]

function Sidebar({ onSignOut }: { onSignOut: () => void }) {
  const pathname = usePathname()
  return (
    <div style={{width:'220px',background:'#2A2A2A',display:'flex',flexDirection:'column',flexShrink:0,height:'100vh'}}>
      <div style={{padding:'16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" alt="Casa Forte" style={{width:'36px',height:'36px',objectFit:'contain',filter:'brightness(0) invert(1)'}} />
          <div>
            <div style={{color:'white',fontSize:'13px',fontWeight:'600'}}>Casa Forte</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>Tabelas de Vendas</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:'10px 8px'}}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'8px',marginBottom:'2px',fontSize:'13px',color:active?'white':'rgba(255,255,255,0.6)',background:active?'#E8390E':'transparent',textDecoration:'none',transition:'all 0.15s'}}>
              <span style={{fontSize:'16px'}}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:'4px'}}>
        <Link href="/" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius:'8px',fontSize:'12px',color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>
          🔗 Ver site público
        </Link>
        <button onClick={onSignOut} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius:'8px',fontSize:'12px',color:'rgba(255,255,255,0.4)',background:'none',border:'none',cursor:'pointer',width:'100%',textAlign:'left'}}>
          🚪 Sair
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && pathname !== '/admin/login') {
        router.push('/admin/login')
      } else {
        setAuthenticated(!!session)
      }
    })
  }, [pathname])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Página de login — sem sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // Aguardando verificação de autenticação
  if (authenticated === null) {
    return (
      <div style={{minHeight:'100vh',background:'#F5F3F0',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'#6b7280',fontSize:'14px'}}>Carregando...</div>
      </div>
    )
  }

  // Não autenticado
  if (!authenticated) return null

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#F5F3F0'}}>
      <Sidebar onSignOut={handleSignOut} />
      <main style={{flex:1,overflowY:'auto'}}>
        <div style={{maxWidth:'80rem',margin:'0 auto',padding:'2rem 1.5rem'}}>
          {children}
        </div>
      </main>
    </div>
  )
}
