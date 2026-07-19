'use client'
import { useState } from 'react'
import {
  CORRETOR_COOKIE,
  CORRETOR_COOKIE_MAX_AGE,
  encodeCorretor,
} from '@/lib/corretor'

const LARANJA = '#E8390E'
const BORDA = '#DDD9D3'

// Tela de identificação exibida ANTES de mostrar os empreendimentos.
// Ao confirmar: grava o cookie do corretor, registra o acesso e libera a
// navegação (voltando para `next`, se houver).
export default function CorretorGate({ next }: { next?: string }) {
  const [nome, setNome] = useState('')
  const [creci, setCreci] = useState('')
  const [saving, setSaving] = useState(false)
  const [erro, setErro] = useState('')
  const [foco, setFoco] = useState<'' | 'nome' | 'creci'>('')

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

  const inputStyle = (campo: 'nome' | 'creci'): React.CSSProperties => ({
    width: '100%',
    padding: '11px 13px',
    border: `1.5px solid ${foco === campo ? LARANJA : BORDA}`,
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
    background: '#fff',
  })

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg,#F7F5F2 0%,#EDE8E2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 360,
          background: '#fff',
          borderRadius: 16,
          border: '1px solid #ECE7E1',
          boxShadow: '0 12px 40px rgba(30,20,10,0.10)',
          overflow: 'hidden',
        }}
      >
        {/* Faixa superior com a marca */}
        <div
          style={{
            background: '#1E1E1E',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <img
            src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
            alt="Casa Forte"
            style={{ width: 30, height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
          <div>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>Casa Forte</div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, lineHeight: 1.2 }}>Tabelas de Vendas</div>
          </div>
        </div>

        <div style={{ padding: '24px 22px 20px' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1E1E1E', margin: 0 }}>Acesso às tabelas</h1>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '6px 0 18px', lineHeight: 1.4 }}>
            Identifique-se para ver os empreendimentos e valores.
          </p>

          {erro && (
            <div
              style={{
                marginBottom: 14,
                borderRadius: 9,
                background: '#fef2f2',
                border: '1px solid #fecaca',
                padding: '9px 11px',
                fontSize: 13,
                color: '#b91c1c',
              }}
            >
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 13 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                Corretor ou imobiliária *
              </label>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onFocus={() => setFoco('nome')}
                onBlur={() => setFoco('')}
                placeholder="Seu nome ou o da imobiliária"
                style={inputStyle('nome')}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
                CRECI *
              </label>
              <input
                value={creci}
                onChange={(e) => setCreci(e.target.value)}
                onFocus={() => setFoco('creci')}
                onBlur={() => setFoco('')}
                placeholder="Ex.: CRECI 12345-F"
                style={inputStyle('creci')}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: LARANJA,
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14.5,
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                opacity: saving ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(232,57,14,0.28)',
              }}
            >
              {saving ? 'Entrando…' : 'Ver empreendimentos →'}
            </button>
          </form>

          <p style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: '#9ca3af', lineHeight: 1.5 }}>
            Registramos seu nome, CRECI e acesso (data, hora e IP) para acompanhamento comercial e segurança.
            Veja a{' '}
            <a href="/privacidade" target="_blank" rel="noreferrer" style={{ color: '#9ca3af', textDecoration: 'underline' }}>Política de Privacidade</a>.
          </p>
        </div>
      </div>
    </div>
  )
}
