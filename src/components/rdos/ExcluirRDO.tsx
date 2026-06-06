'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ExcluirRDO({ rdoId }: { rdoId: string }) {
  const router = useRouter()
  const [confirmando, setConfirmando] = useState(false)
  const [loading, setLoading] = useState(false)

  async function excluir() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('relatorio_historico').delete().eq('relatorio_id', rdoId)
    await supabase.from('relatorio_atividades').delete().eq('relatorio_id', rdoId)
    await supabase.from('relatorio_mao_obra').delete().eq('relatorio_id', rdoId)
    await supabase.from('relatorio_imagens').delete().eq('relatorio_id', rdoId)
    await supabase.from('relatorio_destinatarios').delete().eq('relatorio_id', rdoId)
    await supabase.from('relatorios').delete().eq('id', rdoId)
    router.push('/admin/rdos')
  }

  if (!confirmando) {
    return (
      <button onClick={() => setConfirmando(true)}
        style={{ padding: '6px 14px', background: 'white', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
        🗑️ Excluir
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '13px', color: '#b91c1c' }}>Confirmar exclusão?</span>
      <button onClick={excluir} disabled={loading}
        style={{ padding: '6px 14px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
        {loading ? 'Excluindo...' : 'Sim, excluir'}
      </button>
      <button onClick={() => setConfirmando(false)}
        style={{ padding: '6px 14px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '13px', cursor: 'pointer' }}>
        Cancelar
      </button>
    </div>
  )
}
