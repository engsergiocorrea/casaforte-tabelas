'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    window.location.href = '/admin/dashboard'
  }

  return (
    <div style={{minHeight:'100vh',background:'#1E1E1E',display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}>
      <div style={{width:'100%',maxWidth:'24rem'}}>
        <div style={{textAlign:'center',marginBottom:'2rem'}}>
          <div style={{width:'64px',height:'64px',background:'#E8390E',borderRadius:'16px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1rem',fontSize:'24px',fontWeight:'bold',color:'white'}}>CF</div>
          <h1 style={{color:'white',fontSize:'1.5rem',fontWeight:'bold'}}>Casa Forte</h1>
          <p style={{color:'rgba(255,255,255,0.5)',fontSize:'0.875rem',marginTop:'0.25rem'}}>Tabelas de Vendas — Área Interna</p>
        </div>

        <div style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'1rem',padding:'2rem'}}>
          <h2 style={{color:'white',fontSize:'1.125rem',fontWeight:'600',marginBottom:'1.5rem'}}>Entrar no sistema</h2>

          {error && (
            <div style={{background:'rgba(220,38,38,0.1)',border:'1px solid rgba(220,38,38,0.3)',borderRadius:'8px',padding:'0.75rem',marginBottom:'1rem'}}>
              <p style={{color:'#fca5a5',fontSize:'0.875rem'}}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:'1rem'}}>
              <label style={{display:'block',color:'rgba(255,255,255,0.6)',fontSize:'0.75rem',fontWeight:'500',marginBottom:'0.375rem'}}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{width:'100%',padding:'0.625rem 0.875rem',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'white',fontSize:'0.875rem',outline:'none'}}
              />
            </div>

            <div style={{marginBottom:'1.5rem'}}>
              <label style={{display:'block',color:'rgba(255,255,255,0.6)',fontSize:'0.75rem',fontWeight:'500',marginBottom:'0.375rem'}}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{width:'100%',padding:'0.625rem 0.875rem',background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:'8px',color:'white',fontSize:'0.875rem',outline:'none'}}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{width:'100%',padding:'0.625rem',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'0.875rem',fontWeight:'600',cursor:'pointer'}}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <div style={{textAlign:'center',marginTop:'1.5rem'}}>
          <a href="/" style={{color:'rgba(255,255,255,0.3)',fontSize:'0.75rem'}}>Ver tabelas públicas →</a>
        </div>
      </div>
    </div>
  )
}
