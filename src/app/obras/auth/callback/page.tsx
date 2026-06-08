'use client'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
  const [info, setInfo] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hash = window.location.hash
    setInfo(JSON.stringify({
      search: window.location.search,
      hash: hash,
      code: params.get('code'),
      type: params.get('type'),
      next: params.get('next'),
      token_hash: params.get('token_hash'),
      all: Object.fromEntries(params.entries()),
    }, null, 2))
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
      <h2>Debug Callback</h2>
      {info}
    </div>
  )
}
