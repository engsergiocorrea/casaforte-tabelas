'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const [info, setInfo] = useState('')

  useEffect(() => {
    const supabase = createClient()
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash

    supabase.auth.getSession().then(({ data: { session } }) => {
      setInfo(JSON.stringify({
        search: window.location.search,
        hash: hash,
        session: session ? { user: session.user.email } : null,
        all_params: Object.fromEntries(params.entries()),
      }, null, 2))
    })
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
      <h2>Debug Callback</h2>
      {info || 'Carregando...'}
    </div>
  )
}
