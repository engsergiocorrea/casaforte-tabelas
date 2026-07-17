'use client'
import { useState } from 'react'
import {
  CORRETOR_COOKIE,
  CORRETOR_COOKIE_MAX_AGE,
  encodeCorretor,
} from '@/lib/corretor'

// Tela de identificação exibida ANTES de mostrar os empreendimentos.
// Ao confirmar: grava o cookie do corretor, registra o acesso e libera a
// navegação (voltando para `next`, se houver).
export default function CorretorGate({ next }: { next?: string }) {
  const [nome, setNome] = useState('')
  const [creci, setCreci] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nomeTrim = nome.trim()
    const creciTrim = creci.trim()
    if (!nomeTrim) {
      setErro('Informe seu nome ou o nome da imobiliária.')
      return
    }
    if (!creciTrim) {
      setErro('Informe o CRECI.')
      return
    }
    setSaving(true)
    setErro('')

    // Cookie (não httpOnly, para o cliente ler ao pré-preencher a proposta).
    document.cookie = `${CORRETOR_COOKIE}=${encodeCorretor({
      nome: nomeTrim,
      creci: creciTrim,
    })}; path=/; max-age=${CORRETOR_COOKIE_MAX_AGE}; samesite=lax`

    // Registra o acesso (best-effort) e marca a sessão p/ o AcessoTracker não duplicar.
    try {
      await fetch('/api/corretor-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: nomeTrim, creci: creciTrim }),
      })
      try {
        sessionStorage.setItem('cf_acesso_sessao', '1')
      } catch {}
    } catch {}

    window.location.href = next && next.startsWith('/') ? next : '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 h-16">
            <img
              src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
              alt="Casa Forte"
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
            <div>
              <div className="font-semibold text-gray-900 text-sm leading-tight">Casa Forte</div>
              <div className="text-xs text-gray-500 leading-tight">Tabelas de Vendas</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 sm:p-9">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🔑</div>
              <h1 className="text-xl font-bold text-gray-900">Acesso às tabelas</h1>
              <p className="text-sm text-gray-500 mt-2">
                Para visualizar os empreendimentos e valores, identifique-se abaixo.
              </p>
            </div>

            {erro && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corretor ou imobiliária *
                </label>
                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome ou o da imobiliária"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E8390E] focus:ring-1 focus:ring-[#E8390E]"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CRECI *</label>
                <input
                  value={creci}
                  onChange={(e) => setCreci(e.target.value)}
                  placeholder="Ex.: CRECI 12345-F"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#E8390E] focus:ring-1 focus:ring-[#E8390E]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[#E8390E] py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? 'Entrando…' : 'Ver empreendimentos →'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-gray-400">
              Seus dados são usados apenas para acompanhamento comercial da Casa Forte.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
