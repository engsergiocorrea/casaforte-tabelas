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
    const tokenHash = params.get('token_hash')

    async function process() {
      // Token hash direto (generateLink)
      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        })
        if (!error) {
          window.location.href = '/obras/nova-senha'
          return
        }
      }

      // Authorization code (PKCE)
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data.session) {
          if (type === 'recovery' || next === 'nova-senha') {
            window.location.href = '/obras/nova-senha'
          } else {
            window.location.href = '/obras'
          }
          return
        }
      }

      window.location.href = '/obras/login'
    }

    process()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#6b7280', fontSize: '14px' }}>Verificando acesso...</div>
    </div>
  )
}
