'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function AprovarRecusarButtons({ propostaId }: { propostaId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function atualizar(status: 'aprovada' | 'recusada') {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('propostas').update({ status_proposta: status }).eq('id', propostaId)
    router.refresh()
    setLoading(false)
  }

  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '13px', color: '#6b7280', flex: 1 }}>⏳ Proposta aguardando análise — escolha uma ação:</span>
      <button onClick={() => atualizar('aprovada')} disabled={loading}
        style={{ padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        ✅ Aprovar proposta
      </button>
      <button onClick={() => atualizar('recusada')} disabled={loading}
        style={{ padding: '8px 20px', background: 'white', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
        ❌ Recusar proposta
      </button>
    </div>
  )
}
