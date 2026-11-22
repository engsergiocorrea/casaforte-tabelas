'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// O módulo de Obras/RDO foi transferido para o projeto casaforte-obras
// (obras.casaforteinc.com.br). O Tabelas foca em empreendimentos, unidades,
// tabelas de preço, reajustes, bloqueios, propostas e relatórios comerciais.
const NAV = [
  { href: '/admin/dashboard', label: 'Início', icon: '📊' },
  { href: '/admin/empreendimentos', label: 'Empreendimentos', icon: '🏗️' },
  { href: '/admin/unidades', label: 'Unidades', icon: '🏠' },
  { href: '/admin/vendas', label: 'Vendas', icon: '💼' },
  { href: '/admin/relatorios', label: 'Relatórios', icon: '📈' },
  { href: '/admin/propostas', label: 'Propostas', icon: '📋' },
  { href: '/admin/acessos', label: 'Acessos', icon: '👣' },
]

function Sidebar({ onSignOut, open, onNav }: { onSignOut: () => void; open: boolean; onNav: () => void }) {
  const pathname = usePathname()
  return (
    <div className={`tb-admin-side${open ? ' open' : ''}`}>
      <div style={{padding:'16px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <img src="/apple-icon.png" alt="Casa Forte" style={{width:'36px',height:'36px',objectFit:'contain',borderRadius: '10px'}} />
          <div>
            <div style={{color:'white',fontSize:'13px',fontWeight:'600'}}>Casa Forte</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:'11px'}}>Tabelas de Vendas</div>
          </div>
        </div>
      </div>
      <nav style={{flex:1,padding:'10px 8px',overflowY:'auto'}}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} onClick={onNav} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius: '10px',marginBottom:'2px',fontSize:'13px',color:active?'white':'rgba(255,255,255,0.6)',background:active?'#E8390E':'transparent',textDecoration:'none',transition:'all 0.15s'}}>
              <span style={{fontSize:'16px'}}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div style={{padding:'12px 8px',borderTop:'1px solid rgba(255,255,255,0.08)',display:'flex',flexDirection:'column',gap:'4px'}}>
        <Link href="/" target="_blank" style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius: '10px',fontSize:'12px',color:'rgba(255,255,255,0.4)',textDecoration:'none'}}>
          🔗 Ver site público
        </Link>
        <button onClick={onSignOut} style={{display:'flex',alignItems:'center',gap:'8px',padding:'7px 12px',borderRadius: '10px',fontSize:'12px',color:'rgba(255,255,255,0.4)',background:'none',border:'none',cursor:'pointer',width:'100%',textAlign:'left'}}>
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
  const [menuAberto, setMenuAberto] = useState(false)

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

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (authenticated === null) {
    return (
      <div style={{minHeight:'100vh',background:'#F5F5F7',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{color:'#6E6E73',fontSize:'14px'}}>Carregando...</div>
      </div>
    )
  }

  if (!authenticated) return null

  return (
    <div className="tb-admin-shell">
      <div className={`tb-admin-overlay${menuAberto ? ' show' : ''}`} onClick={() => setMenuAberto(false)} />
      <Sidebar onSignOut={handleSignOut} open={menuAberto} onNav={() => setMenuAberto(false)} />
      <main className="tb-admin-main">
        <div className="tb-admin-topbar">
          <button className="tb-ham" onClick={() => setMenuAberto(true)} aria-label="Abrir menu">☰</button>
          <img src="/apple-icon.png" alt="Casa Forte" style={{ width: 26, height: 26, objectFit: 'contain', borderRadius: 6 }} />
          <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>Casa Forte · Tabelas</span>
        </div>
        <div className="tb-admin-content">{children}</div>
      </main>
    </div>
  )
}
