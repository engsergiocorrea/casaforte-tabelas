'use client'
import { useEffect } from 'react'
import { lerCorretorDoNavegador } from '@/lib/corretor'

// Registra 1 acesso por SESSÃO do corretor já identificado que volta ao site
// (dedupe via sessionStorage — cada nova visita/sessão conta como 1 acesso, mas
// recarregar/navegar na mesma sessão não duplica). O acesso da identificação
// inicial já é registrado pelo CorretorGate.
export const ACESSO_SESSAO_KEY = 'cf_acesso_sessao'

export default function AcessoTracker() {
  useEffect(() => {
    try {
      const info = lerCorretorDoNavegador()
      if (!info) return
      if (sessionStorage.getItem(ACESSO_SESSAO_KEY)) return
      fetch('/api/corretor-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(info),
      })
        .then(() => {
          try {
            sessionStorage.setItem(ACESSO_SESSAO_KEY, '1')
          } catch {}
        })
        .catch(() => {})
    } catch {}
  }, [])
  return null
}
