'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const type = params.get('type')
    const next = params.get('next')

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (!error) {
          if (type === 'recovery' || next === 'nova-senha') {
            window.location.href = '/obras/nova-senha'
          } else {
            window.location.href = '/obras'
          }
        } else {
          window.location.href = '/obras/login'
        }
      })
    } else {
      // Tenta pegar sessão do hash (implicit flow)
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          if (type === 'recovery' || next === 'nova-senha') {
            window.location.href = '/obras/nova-senha'
          } else {
            window.location.href = '/obras'
          }
        } else {
          window.location.href = '/obras/login'
        }
      })
    }
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Verificando acesso...</div>
    </div>
  )
}
