'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PropostaAcoes({ propostaId, statusAtual }: { propostaId: string, statusAtual: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [showMotivo, setShowMotivo] = useState(false)
  const [acao, setAcao] = useState<string>('')

  async function executarAcao(novoStatus: string) {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('propostas')
      .update({ status_proposta: novoStatus, observacoes: motivo || undefined })
      .eq('id', propostaId)

    if (!error) {
      router.refresh()
      setShowMotivo(false)
      setMotivo('')
    }
    setLoading(false)
  }

  function confirmar(novoStatus: string) {
    if (novoStatus === 'recusada' || novoStatus === 'cancelada') {
      setAcao(novoStatus)
      setShowMotivo(true)
    } else {
      executarAcao(novoStatus)
    }
  }

  if (statusAtual === 'aprovada') {
    return (
      <div style={{background:'#f0fdf4',border:'1px solid #bbf7d0',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <span style={{fontWeight:'600',color:'#15803d',fontSize:'14px'}}>✅ Proposta aprovada — unidade reservada automaticamente</span>
          <p style={{fontSize:'12px',color:'#6b7280',marginTop:'2px'}}>Para cancelar a reserva, use o botão abaixo.</p>
        </div>
        <button onClick={() => confirmar('cancelada')} disabled={loading}
          style={{padding:'8px 16px',background:'white',border:'1px solid #fecaca',borderRadius:'8px',fontSize:'13px',fontWeight:'500',color:'#b91c1c',cursor:'pointer'}}>
          🚫 Cancelar reserva
        </button>
        {showMotivo && (
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
            <div style={{background:'white',borderRadius:'12px',padding:'24px',maxWidth:'400px',width:'90%'}}>
              <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'12px'}}>Motivo do cancelamento</h3>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Descreva o motivo (opcional)..."
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical',boxSizing:'border-box'}} />
              <div style={{display:'flex',gap:'10px',marginTop:'14px',justifyContent:'flex-end'}}>
                <button onClick={() => setShowMotivo(false)} style={{padding:'8px 16px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'13px',background:'white',cursor:'pointer'}}>Voltar</button>
                <button onClick={() => executarAcao(acao)} disabled={loading}
                  style={{padding:'8px 16px',background:'#b91c1c',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}>
                  {loading ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (statusAtual === 'cancelada' || statusAtual === 'recusada') {
    return (
      <div style={{background:'#f3f4f6',border:'1px solid #e5e7eb',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:'14px',color:'#6b7280'}}>
          {statusAtual === 'cancelada' ? '🚫 Proposta cancelada — unidade disponível novamente' : '❌ Proposta recusada'}
        </span>
        <button onClick={() => confirmar('pendente')} disabled={loading}
          style={{padding:'8px 16px',background:'white',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'13px',fontWeight:'500',color:'#374151',cursor:'pointer'}}>
          ↩️ Reabrir proposta
        </button>
      </div>
    )
  }

  return (
    <div style={{background:'white',border:'1px solid #DDD9D3',borderRadius:'12px',padding:'16px 20px',marginBottom:'16px'}}>
      <p style={{fontSize:'13px',color:'#6b7280',marginBottom:'12px',fontWeight:'500'}}>⏳ Proposta aguardando análise — escolha uma ação:</p>
      <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
        <button onClick={() => confirmar('aprovada')} disabled={loading}
          style={{padding:'10px 20px',background:'#15803d',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'600',cursor:'pointer'}}>
          ✅ Aprovar proposta
        </button>
        <button onClick={() => confirmar('recusada')} disabled={loading}
          style={{padding:'10px 20px',background:'white',border:'1px solid #fecaca',color:'#b91c1c',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
          ❌ Recusar proposta
        </button>
      </div>

      {showMotivo && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}}>
          <div style={{background:'white',borderRadius:'12px',padding:'24px',maxWidth:'400px',width:'90%'}}>
            <h3 style={{fontSize:'15px',fontWeight:'700',marginBottom:'12px'}}>
              {acao === 'recusada' ? 'Motivo da recusa' : 'Motivo do cancelamento'}
            </h3>
            <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Descreva o motivo (opcional)..."
              style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical',boxSizing:'border-box'}} />
            <div style={{display:'flex',gap:'10px',marginTop:'14px',justifyContent:'flex-end'}}>
              <button onClick={() => setShowMotivo(false)} style={{padding:'8px 16px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'13px',background:'white',cursor:'pointer'}}>Voltar</button>
              <button onClick={() => executarAcao(acao)} disabled={loading}
                style={{padding:'8px 16px',background:'#b91c1c',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',cursor:'pointer'}}>
                {loading ? 'Salvando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
