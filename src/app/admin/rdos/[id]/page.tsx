'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AprovarRecusarRDO from '@/app/admin/rdos/[id]/AprovarRecusarRDO'

export default function AprovarRecusarRDO({ rdoId }: { rdoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recusando, setRecusando] = useState(false)
  const [motivo, setMotivo] = useState('')

  async function aprovar() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('relatorios').update({ status: 'aprovado', aprovado_em: new Date().toISOString() }).eq('id', rdoId)
    await supabase.from('relatorio_historico').insert({ relatorio_id: rdoId, acao: 'aprovacao', observacao: 'RDO aprovado pela diretoria' })
    router.refresh()
    setLoading(false)
  }

  async function recusar() {
    if (!motivo) { alert('Informe o motivo da recusa'); return }
    setLoading(true)
    const supabase = createClient()
    await supabase.from('relatorios').update({ status: 'recusado', recusado_em: new Date().toISOString(), motivo_recusa: motivo }).eq('id', rdoId)
    await supabase.from('relatorio_historico').insert({ relatorio_id: rdoId, acao: 'recusa', observacao: motivo })
    router.refresh()
    setLoading(false)
    setRecusando(false)
  }

  return (
    <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '16px' }}>
      <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>⏳ RDO aguardando aprovação — escolha uma ação:</p>
      {!recusando ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={aprovar} disabled={loading}
            style={{ padding: '8px 20px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            ✅ Aprovar
          </button>
          <button onClick={() => setRecusando(true)} disabled={loading}
            style={{ padding: '8px 20px', background: 'white', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            ❌ Recusar
          </button>
        </div>
      ) : (
        <div>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Informe o motivo da recusa..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={recusar} disabled={loading}
              style={{ padding: '8px 20px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              Confirmar recusa
            </button>
            <button onClick={() => setRecusando(false)}
              style={{ padding: '8px 20px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
