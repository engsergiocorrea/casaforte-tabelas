import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function VendasPage() {
  const supabase = await createClient()

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*, empreendimentos(nome), unidades(unidade)')
    .order('data_venda', { ascending: false })

  const total = vendas?.reduce((acc, v) => acc + (v.valor_venda ?? 0), 0) ?? 0

  const statusColors: Record<string, {bg:string,color:string}> = {
    aguardando_contrato: {bg:'#fef3c7',color:'#92400e'},
    contrato_enviado: {bg:'#dbeafe',color:'#1e40af'},
    contrato_assinado: {bg:'#dcfce7',color:'#15803d'},
    distrato: {bg:'#fee2e2',color:'#b91c1c'},
  }
  const statusLabels: Record<string, string> = {
    aguardando_contrato: 'Aguardando contrato',
    contrato_enviado: 'Contrato enviado',
    contrato_assinado: 'Contrato assinado',
    distrato: 'Distrato',
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Vendas</h1>
          <p style={{fontSize:'0.875rem',color:'#6E6E73',marginTop:'0.25rem'}}>{vendas?.length ?? 0} vendas registradas</p>
        </div>
        <Link href="/admin/vendas/nova" style={{padding:'8px 16px',background:'#E8390E',color:'white',borderRadius: '10px',fontSize:'14px',fontWeight:'500',textDecoration:'none'}}>
          + Registrar venda
        </Link>
      </div>

      {/* Resumo */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px'}}>
        <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',padding:'16px'}}>
          <div style={{fontSize:'12px',color:'#6E6E73',marginBottom:'4px'}}>Total de vendas</div>
          <div style={{fontSize:'24px',fontWeight:'700',color:'#111'}}>{vendas?.length ?? 0}</div>
        </div>
        <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',padding:'16px'}}>
          <div style={{fontSize:'12px',color:'#6E6E73',marginBottom:'4px'}}>Volume total</div>
          <div style={{fontSize:'20px',fontWeight:'700',color:'#15803d'}}>R$ {total.toLocaleString('pt-BR',{minimumFractionDigits:2})}</div>
        </div>
        <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',padding:'16px'}}>
          <div style={{fontSize:'12px',color:'#6E6E73',marginBottom:'4px'}}>Ticket médio</div>
          <div style={{fontSize:'20px',fontWeight:'700',color:'#111'}}>R$ {vendas?.length ? (total/(vendas?.length)).toLocaleString('pt-BR',{minimumFractionDigits:2}) : '0,00'}</div>
        </div>
      </div>

      <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',overflow:'hidden'}}>
        {!vendas || vendas.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 2rem',color:'#8E8E93'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>💼</div>
            <p style={{fontSize:'1rem',marginBottom:'0.5rem',color:'#3A3A3C',fontWeight:'500'}}>Nenhuma venda registrada</p>
            <Link href="/admin/vendas/nova" style={{color:'#E8390E',fontSize:'14px'}}>Registrar primeira venda →</Link>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'900px'}}>
              <thead>
                <tr style={{background:'#F5F5F7',borderBottom:'1px solid rgba(0,0,0,.08)'}}>
                  {['Data','Empreendimento','Unidade','Comprador','Corretor','Valor','Status',''].map(h => (
                    <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {vendas.map(v => {
                  const sc = statusColors[v.status_contrato] ?? statusColors.aguardando_contrato
                  return (
                    <tr key={v.id} style={{borderBottom:'1px solid #F2F2F7'}}>
                      <td style={{padding:'10px 14px',color:'#6E6E73',whiteSpace:'nowrap'}}>{new Date(v.data_venda).toLocaleDateString('pt-BR')}</td>
                      <td style={{padding:'10px 14px',fontWeight:'500',color:'#111'}}>{(v.empreendimentos as any)?.nome}</td>
                      <td style={{padding:'10px 14px',color:'#6E6E73'}}>{(v.unidades as any)?.unidade}</td>
                      <td style={{padding:'10px 14px',color:'#111'}}>{v.comprador_nome}</td>
                      <td style={{padding:'10px 14px',color:'#6E6E73'}}>{v.corretor_responsavel ?? '—'}</td>
                      <td style={{padding:'10px 14px',fontWeight:'600',color:'#15803d',whiteSpace:'nowrap'}}>R$ {Number(v.valor_venda).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                      <td style={{padding:'10px 14px'}}>
                        <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:sc.bg,color:sc.color}}>
                          {statusLabels[v.status_contrato]}
                        </span>
                      </td>
                      <td style={{padding:'10px 14px'}}>
                        <Link href={`/admin/vendas/${v.id}/editar`} style={{padding:'3px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>Editar</Link>
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
