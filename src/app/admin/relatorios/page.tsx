import { createClient } from '@/lib/supabase/server'

export default async function RelatoriosPage() {
  const supabase = await createClient()

  const { data: empreendimentos } = await supabase
    .from('vw_resumo_empreendimento')
    .select('*')
    .order('nome')

  const { data: vendas } = await supabase
    .from('vendas')
    .select('*, empreendimentos(nome), unidades(unidade, pavimento)')
    .order('data_venda', { ascending: false })

  const totalVGV = empreendimentos?.reduce((a, e) => a + (e.vgv_total ?? 0), 0) ?? 0
  const totalVendido = empreendimentos?.reduce((a, e) => a + (e.vgv_vendido ?? 0), 0) ?? 0
  const totalDisponivel = empreendimentos?.reduce((a, e) => a + (e.vgv_disponivel ?? 0), 0) ?? 0
  const totalUnidades = empreendimentos?.reduce((a, e) => a + (e.total_unidades ?? 0), 0) ?? 0
  const totalVendidas = empreendimentos?.reduce((a, e) => a + (e.vendidas ?? 0), 0) ?? 0
  const totalDisponiveis = empreendimentos?.reduce((a, e) => a + (e.disponiveis ?? 0), 0) ?? 0
  const totalReservadas = empreendimentos?.reduce((a, e) => a + (e.reservadas ?? 0), 0) ?? 0
  const percentualGeral = totalUnidades > 0 ? Math.round((totalVendidas / totalUnidades) * 100) : 0

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', {minimumFractionDigits:2})}`

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Relatórios</h1>
        <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>Visão consolidada de todos os empreendimentos</p>
      </div>

      {/* KPIs gerais */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
        {[
          {label:'VGV Total',value:fmt(totalVGV),color:'#111'},
          {label:'VGV Vendido',value:fmt(totalVendido),color:'#15803d'},
          {label:'VGV Disponível',value:fmt(totalDisponivel),color:'#1d4ed8'},
          {label:'% Vendido Geral',value:`${percentualGeral}%`,color:'#E8390E'},
        ].map(k => (
          <div key={k.label} style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'16px'}}>
            <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>{k.label}</div>
            <div style={{fontSize:'20px',fontWeight:'700',color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
        {[
          {label:'Total de unidades',value:totalUnidades,color:'#111'},
          {label:'Disponíveis',value:totalDisponiveis,color:'#15803d'},
          {label:'Reservadas',value:totalReservadas,color:'#b45309'},
          {label:'Vendidas',value:totalVendidas,color:'#b91c1c'},
        ].map(k => (
          <div key={k.label} style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'16px'}}>
            <div style={{fontSize:'12px',color:'#6b7280',marginBottom:'4px'}}>{k.label}</div>
            <div style={{fontSize:'28px',fontWeight:'700',color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Por empreendimento */}
      <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',overflow:'hidden',marginBottom:'24px'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e7eb'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111'}}>Por empreendimento</h2>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                {['Empreendimento','Cidade','Total','Disp.','Reserv.','Vendidas','% Vendido','VGV Total','VGV Vendido','Ticket Médio'].map(h => (
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {empreendimentos?.map(e => (
                <tr key={e.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'10px 14px',fontWeight:'500',color:'#111'}}>{e.nome}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280'}}>{e.cidade}</td>
                  <td style={{padding:'10px 14px',textAlign:'center',color:'#111'}}>{e.total_unidades}</td>
                  <td style={{padding:'10px 14px',textAlign:'center',color:'#15803d',fontWeight:'600'}}>{e.disponiveis}</td>
                  <td style={{padding:'10px 14px',textAlign:'center',color:'#b45309',fontWeight:'600'}}>{e.reservadas}</td>
                  <td style={{padding:'10px 14px',textAlign:'center',color:'#b91c1c',fontWeight:'600'}}>{e.vendidas}</td>
                  <td style={{padding:'10px 14px',textAlign:'center'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                      <div style={{flex:1,height:'6px',background:'#f3f4f6',borderRadius:'3px',overflow:'hidden'}}>
                        <div style={{height:'100%',background:'#E8390E',width:`${Math.min(e.percentual_vendido ?? 0, 100)}%`,borderRadius:'3px'}} />
                      </div>
                      <span style={{fontSize:'12px',fontWeight:'600',color:'#E8390E',whiteSpace:'nowrap'}}>{e.percentual_vendido ?? 0}%</span>
                    </div>
                  </td>
                  <td style={{padding:'10px 14px',color:'#111',whiteSpace:'nowrap'}}>{fmt(e.vgv_total ?? 0)}</td>
                  <td style={{padding:'10px 14px',color:'#15803d',fontWeight:'600',whiteSpace:'nowrap'}}>{fmt(e.vgv_vendido ?? 0)}</td>
                  <td style={{padding:'10px 14px',color:'#111',whiteSpace:'nowrap'}}>{e.ticket_medio ? fmt(e.ticket_medio) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Últimas vendas */}
      <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'1px solid #e5e7eb'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111'}}>Últimas vendas registradas</h2>
        </div>
        {!vendas || vendas.length === 0 ? (
          <div style={{textAlign:'center',padding:'3rem',color:'#9ca3af'}}>Nenhuma venda registrada ainda</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                {['Data','Empreendimento','Unidade','Comprador','Corretor','Valor'].map(h => (
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendas.slice(0, 20).map(v => (
                <tr key={v.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                  <td style={{padding:'10px 14px',color:'#6b7280',whiteSpace:'nowrap'}}>{new Date(v.data_venda).toLocaleDateString('pt-BR')}</td>
                  <td style={{padding:'10px 14px',fontWeight:'500',color:'#111'}}>{(v.empreendimentos as any)?.nome}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280'}}>{(v.unidades as any)?.unidade}</td>
                  <td style={{padding:'10px 14px',color:'#111'}}>{v.comprador_nome}</td>
                  <td style={{padding:'10px 14px',color:'#6b7280'}}>{v.corretor_responsavel ?? '—'}</td>
                  <td style={{padding:'10px 14px',fontWeight:'600',color:'#15803d',whiteSpace:'nowrap'}}>{fmt(v.valor_venda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
