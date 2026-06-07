'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ObrasLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('Erro: ' + err.message); setLoading(false); return }
    window.location.href = '/obras'
  }

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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
