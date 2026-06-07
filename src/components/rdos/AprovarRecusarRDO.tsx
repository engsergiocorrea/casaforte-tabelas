'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AprovarRecusarRDO({ rdoId }: { rdoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [recusando, setRecusando] = useState(false)
  const [motivo, setMotivo] = useState('')

  async function aprovar() {
    setLoading(true)
    const supabase = createClient()

    // Atualiza status
    await supabase.from('relatorios').update({ status: 'aprovado', aprovado_em: new Date().toISOString() }).eq('id', rdoId)
    await supabase.from('relatorio_historico').insert({ relatorio_id: rdoId, acao: 'aprovacao', observacao: 'RDO aprovado pela diretoria' })

    // Busca dados do RDO e engenheiro para WhatsApp
    const { data: rdo } = await supabase
      .from('relatorios')
      .select('numero, data_relatorio, obras(nome), engenheiros(nome, telefone)')
      .eq('id', rdoId)
      .single()

    const telefone = (rdo?.engenheiros as any)?.telefone
    const nomeEngenheiro = (rdo?.engenheiros as any)?.nome
    const nomeObra = (rdo?.obras as any)?.nome
    const dataRdo = rdo?.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR') : '—'
    const linkRdo = `https://tabelas.casaforteinc.com.br/obras/rdos/${rdoId}`

    if (telefone) {
      const numero = telefone.replace(/\D/g, '')
      const mensagem = `✅ *RDO #${rdo?.numero} Aprovado*\n\nOlá, ${nomeEngenheiro}!\n\nSeu Relatório Diário de Obra foi *aprovado* pela diretoria.\n\n📋 *Obra:* ${nomeObra}\n📅 *Data:* ${dataRdo}\n\nAcesse o relatório pelo link:\n${linkRdo}`

      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, mensagem }),
      })
    }

    router.refresh()
    setLoading(false)
  }

  async function recusar() {
    if (!motivo) { alert('Informe o motivo da recusa'); return }
    setLoading(true)
    const supabase = createClient()

    await supabase.from('relatorios').update({ status: 'recusado', recusado_em: new Date().toISOString(), motivo_recusa: motivo }).eq('id', rdoId)
    await supabase.from('relatorio_historico').insert({ relatorio_id: rdoId, acao: 'recusa', observacao: motivo })

    // Busca dados do RDO e engenheiro para WhatsApp
    const { data: rdo } = await supabase
      .from('relatorios')
      .select('numero, data_relatorio, obras(nome), engenheiros(nome, telefone)')
      .eq('id', rdoId)
      .single()

    const telefone = (rdo?.engenheiros as any)?.telefone
    const nomeEngenheiro = (rdo?.engenheiros as any)?.nome
    const nomeObra = (rdo?.obras as any)?.nome
    const dataRdo = rdo?.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR') : '—'

    if (telefone) {
      const numero = telefone.replace(/\D/g, '')
      const mensagem = `❌ *RDO #${rdo?.numero} Recusado*\n\nOlá, ${nomeEngenheiro}!\n\nSeu Relatório Diário de Obra foi *recusado* pela diretoria.\n\n📋 *Obra:* ${nomeObra}\n📅 *Data:* ${dataRdo}\n\n📝 *Motivo:* ${motivo}\n\nAcesse o portal para corrigir e reenviar:\nhttps://tabelas.casaforteinc.com.br/obras`
      
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numero, mensagem }),
      })
    }

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
            {loading ? 'Aprovando...' : '✅ Aprovar'}
          </button>
          <button onClick={() => setRecusando(true)} disabled={loading}
            style={{ padding: '8px 20px', background: 'white', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            ❌ Recusar
          </button>
        </div>
      ) : (
        <div>
          <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3}
            placeholder="Informe o motivo da recusa..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const, marginBottom: '8px' }} />
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={recusar} disabled={loading}
              style={{ padding: '8px 20px', background: '#b91c1c', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {loading ? 'Recusando...' : 'Confirmar recusa'}
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
