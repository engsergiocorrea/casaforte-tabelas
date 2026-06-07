'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ObrasLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modo, setModo] = useState<'login' | 'recuperar'>('login')
  const [enviado, setEnviado] = useState(false)

  useEffect(() => {
    // Limpa qualquer sessão residual ao abrir o login
    createClient().auth.signOut()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('E-mail ou senha inválidos'); setLoading(false); return }
    await new Promise(resolve => setTimeout(resolve, 500))
    window.location.replace('/obras')
  }

  async function handleRecuperar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://obras.casaforteinc.com.br/obras/auth/callback',
})
    if (err) { setError('Erro ao enviar email: ' + err.message); setLoading(false); return }
    setEnviado(true)
    setLoading(false)
  }

  if (enviado) return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #DDD9D3', padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📧</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Email enviado!</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>
        <button onClick={() => { setModo('login'); setEnviado(false) }}
          style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Voltar ao login
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #DDD9D3', padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
            alt="Casa Forte" style={{ height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '4px' }}>Portal de Obras</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Casa Forte Incorporações</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {modo === 'login' ? (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ textAlign: 'right', marginBottom: '20px' }}>
              <button type="button" onClick={() => { setModo('recuperar'); setError('') }}
                style={{ background: 'none', border: 'none', color: '#E8390E', fontSize: '13px', cursor: 'pointer', padding: '0' }}>
                Esqueci minha senha
              </button>
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRecuperar}>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' }}>
              {loading ? 'Enviando...' : 'Enviar link de recuperação'}
            </button>
            <button type="button" onClick={() => { setModo('login'); setError('') }}
              style={{ width: '100%', padding: '12px', background: 'white', color: '#374151', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
