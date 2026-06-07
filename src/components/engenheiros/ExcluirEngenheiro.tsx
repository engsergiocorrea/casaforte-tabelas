'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ExcluirEngenheiro({ engenheiroId, usuarioId }: { engenheiroId: string; usuarioId?: string }) {
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function excluir() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('engenheiros').delete().eq('id', engenheiroId)
    if (usuarioId) {
      await fetch('/api/admin/excluir-usuario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario_id: usuarioId }),
      })
    }
    window.location.href = '/admin/engenheiros'
  }

  if (confirmando) return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <span style={{ fontSize: '13px', color: '#b91c1c' }}>Confirmar exclusão?</span>
      <button onClick={excluir} disabled={loading}
        style={{ padding: '6px 14px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
        {loading ? 'Excluindo...' : 'Sim, excluir'}
      </button>
      <button onClick={() => setConfirmando(false)}
        style={{ padding: '6px 14px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
        Cancelar
      </button>
    </div>
  )

  return (
    <button onClick={() => setConfirmando(true)}
      style={{ padding: '8px 16px', background: 'white', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
      🗑️ Excluir
    </button>
  )
}
