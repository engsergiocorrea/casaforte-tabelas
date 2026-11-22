import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function PropostasPage() {
  const supabase = await createClient()

  const { data: propostas } = await supabase
    .from('propostas')
    .select('*, empreendimentos(nome), unidades(unidade, pavimento)')
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, {bg:string,color:string,label:string}> = {
    pendente:  {bg:'#fef3c7',color:'#92400e',label:'⏳ Pendente'},
    aprovada:  {bg:'#dcfce7',color:'#15803d',label:'✅ Aprovada'},
    recusada:  {bg:'#fee2e2',color:'#b91c1c',label:'❌ Recusada'},
    cancelada: {bg:'#F2F2F7',color:'#6E6E73',label:'🚫 Cancelada'},
  }

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Propostas</h1>
        <p style={{fontSize:'0.875rem',color:'#6E6E73',marginTop:'0.25rem'}}>{propostas?.length ?? 0} propostas recebidas</p>
      </div>

      <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',overflow:'hidden'}}>
        {!propostas || propostas.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem',color:'#8E8E93'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📋</div>
            <p style={{fontSize:'1rem',color:'#3A3A3C',fontWeight:'500'}}>Nenhuma proposta recebida ainda</p>
            <p style={{fontSize:'0.875rem',marginTop:'0.5rem'}}>As propostas aparecerão aqui quando corretores preencherem o formulário</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead>
                <tr style={{background:'#F5F5F7',borderBottom:'1px solid rgba(0,0,0,.08)'}}>
                  {['Data','Empreendimento','Unidade','Comprador','Corretor','Valor','Segue tabela','Status',''].map(h => (
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propostas.map(p => {
                  const sc = statusConfig[p.status_proposta ?? 'pendente'] ?? statusConfig.pendente
                  return (
                    <tr key={p.id} style={{borderBottom:'1px solid #F2F2F7'}}>
                      <td style={{padding:'10px 14px',color:'#6E6E73',whiteSpace:'nowrap'}}>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                      <td style={{padding:'10px 14px',fontWeight:'500',color:'#111'}}>{(p.empreendimentos as any)?.nome}</td>
                      <td style={{padding:'10px 14px',color:'#6E6E73'}}>{(p.unidades as any)?.unidade} — {(p.unidades as any)?.pavimento}</td>
                      <td style={{padding:'10px 14px',color:'#111'}}>{p.comprador1_nome}</td>
                      <td style={{padding:'10px 14px',color:'#6E6E73'}}>{p.corretor_nome ?? '—'}</td>
                      <td style={{padding:'10px 14px',fontWeight:'600',color:'#15803d',whiteSpace:'nowrap'}}>R$ {Number(p.valor_proposto).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                      <td style={{padding:'10px 14px',textAlign:'center'}}>
                        <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:p.segue_tabela?'#dcfce7':'#fef3c7',color:p.segue_tabela?'#15803d':'#92400e'}}>
                          {p.segue_tabela ? 'Sim' : 'Não'}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:sc.bg,color:sc.color}}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <Link href={`/admin/propostas/${p.id}`} style={{padding:'3px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                          Ver detalhes
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
