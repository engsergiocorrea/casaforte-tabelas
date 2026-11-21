'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LoginShell, Campo, Erro } from '@/components/cf-login/shell'
import { CampoSenha, BotaoEntrar } from '@/components/cf-login/senha'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: authError } = await createClient().auth.signInWithPassword({ email, password })
    if (authError) { setError('E-mail ou senha incorretos.'); setLoading(false); return }
    await fetch('/api/acesso-log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).catch(() => {})
    window.location.href = '/admin/dashboard'
  }

  return (
    <LoginShell sistema="Tabelas de Vendas" descricao="Área interna: empreendimentos, unidades, preços e convites." extra={<a className="cfl-link" href="/">Ver tabelas públicas →</a>}>
      <form onSubmit={handleSubmit}>
        <Campo rotulo="E-mail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" autoCapitalize="none" placeholder="seu@email.com" />
        <CampoSenha value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Erro>{error}</Erro>
        <BotaoEntrar carregando={loading} />
      </form>
    </LoginShell>
  )
}
