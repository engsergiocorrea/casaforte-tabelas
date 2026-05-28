// src/app/admin/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
      setError('E-mail ou senha incorretos. Tente novamente.')
      setLoading(false)
      return
    }

    const redirectTo = searchParams.get('redirectTo') ?? '/admin/dashboard'
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] flex items-center justify-center p-4">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E8390E]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E8390E]/3 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#E8390E] rounded-2xl mb-4 shadow-lg shadow-[#E8390E]/30">
            <span className="text-white font-bold text-2xl tracking-tight">CF</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Casa Forte</h1>
            <p className="text-sm text-white/50 mt-0.5">Tabelas de Vendas — Área Interna</p>
          </div>
        </div>

        {/* Card de login */}
        <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Entrar no sistema</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg
                           text-sm text-white placeholder:text-white/30
                           focus:outline-none focus:ring-2 focus:ring-[#E8390E]/40 focus:border-[#E8390E]/50
                           transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg
                           text-sm text-white placeholder:text-white/30
                           focus:outline-none focus:ring-2 focus:ring-[#E8390E]/40 focus:border-[#E8390E]/50
                           transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#E8390E] text-white text-sm font-semibold rounded-lg
                         hover:bg-[#B8290A] active:scale-[0.98] transition-all duration-150
                         disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* Link público */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            Ver tabelas públicas →
          </a>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mt-8">
          © {new Date().getFullYear()} Casa Forte Construtora e Incorporadora
        </p>
      </div>
    </div>
  )
}
