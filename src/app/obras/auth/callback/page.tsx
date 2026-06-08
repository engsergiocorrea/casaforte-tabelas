'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
    const type = params.get('type') ?? hashParams.get('type')
    const next = params.get('next')
    const error = hashParams.get('error')

    if (error) {
      window.location.href = '/obras/login'
      return
    }

    // O Supabase client processa o hash automaticamente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        if (type === 'recovery' || next === 'nova-senha') {
          window.location.href = '/obras/nova-senha'
        } else {
          window.location.href = '/obras'
        }
      } else {
        // Tenta onAuthStateChange para pegar sessão do hash
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          subscription.unsubscribe()
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
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Verificando acesso...</div>
    </div>
  )
}
