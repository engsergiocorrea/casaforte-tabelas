'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NovaSenhaPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sucesso, setSucesso] = useState(false)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    // Processa o code da URL
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          setError('Link inválido ou expirado. Solicite um novo.')
        }
        setPronto(true)
      })
    } else {
      setPronto(true)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('As senhas não coincidem'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    if (err) { setError('Erro: ' + err.message); setLoading(false); return }
    setSucesso(true)
    setLoading(false)
    setTimeout(() => { window.location.href = '/obras' }, 2000)
  }

  if (!pronto) return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Verificando link...</div>
    </div>
  )

  if (sucesso) return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #DDD9D3', padding: '2.5rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '8px' }}>Senha redefinida!</h2>
        <p style={{ fontSize: '14px', color: '#6b7280' }}>Redirecionando para o portal...</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #DDD9D3', padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
            alt="Casa Forte" style={{ height: '48px', objectFit: 'contain', marginBottom: '12px' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '4px' }}>Nova senha</h1>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>Defina sua nova senha de acesso</p>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Nova senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Confirmar senha</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '12px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
