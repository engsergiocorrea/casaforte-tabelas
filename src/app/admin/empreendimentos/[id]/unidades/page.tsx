import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function UnidadesPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: emp } = await supabase
    .from('empreendimentos')
    .select('id, nome, slug')
    .eq('id', params.id)
    .single()

  if (!emp) notFound()

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', params.id)
    .order('pavimento').order('unidade')

  const statusColors: Record<string, {bg:string,color:string}> = {
    disponivel: {bg:'#dcfce7',color:'#15803d'},
    reservada: {bg:'#fef3c7',color:'#92400e'},
    vendida: {bg:'#fee2e2',color:'#b91c1c'},
    bloqueada: {bg:'#f3f4f6',color:'#6b7280'},
    indisponivel: {bg:'#f3f4f6',color:'#9ca3af'},
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'4px'}}>
            <Link href="/admin/empreendimentos" style={{color:'#6b7280',textDecoration:'none'}}>Empreendimentos</Link>
            {' → '}{emp.nome}
          </div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Unidades</h1>
          <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>{unidades?.length ?? 0} unidades cadastradas</p>
        </div>
        <div style={{display:'flex',gap:'10px'}}>
          <Link href={`/empreendimentos/${emp.slug}`} target="_blank"
            style={{padding:'8px 16px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',color:'#374151',textDecoration:'none',background:'white'}}>
            Ver tabela pública
          </Link>
          <Link href={`/admin/empreendimentos/${params.id}/unidades/nova`}
            style={{padding:'8px 16px',background:'#E8390E',color:'white',borderRadius:'8px',fontSize:'14px',fontWeight:'500',textDecoration:'none'}}>
            + Nova unidade
          </Link>
        </div>
      </div>

      <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',overflow:'hidden'}}>
        {!unidades || unidades.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 2rem',color:'#9ca3af'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🏠</div>
            <p style={{fontSize:'1rem',marginBottom:'0.5rem',color:'#374151',fontWeight:'500'}}>Nenhuma unidade cadastrada</p>
            <p style={{fontSize:'0.875rem'}}>Clique em "Nova unidade" para começar</p>
          </div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'900px'}}>
              <thead>
                <tr style={{background:'#f9fafb',borderBottom:'1px solid #e5e7eb'}}>
                  {['Unidade','Pavimento','Área Total','Quartos','Valor','Sinal','Parcelas','Status','Ações'].map(h => (
                    <th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unidades.map(u => {
                  const sc = statusColors[u.status] ?? statusColors.indisponivel
                  return (
                    <tr key={u.id} style={{borderBottom:'1px solid #f3f4f6'}}>
                      <td style={{padding:'10px 12px',fontWeight:'600',color:'#111'}}>{u.unidade}</td>
                      <td style={{padding:'10px 12px',color:'#6b7280'}}>{u.pavimento ?? '—'}</td>
                      <td style={{padding:'10px 12px',color:'#6b7280'}}>{u.area_total ? `${u.area_total}m²` : '—'}</td>
                      <td style={{padding:'10px 12px',color:'#6b7280',textAlign:'center'}}>{u.quartos ?? '—'}</td>
                      <td style={{padding:'10px 12px',fontWeight:'500',color:'#111'}}>{u.valor_imovel ? `R$ ${Number(u.valor_imovel).toLocaleString('pt-BR')}` : '—'}</td>
                      <td style={{padding:'10px 12px',color:'#6b7280'}}>{u.valor_sinal ? `R$ ${Number(u.valor_sinal).toLocaleString('pt-BR')}` : '—'}</td>
                      <td style={{padding:'10px 12px',color:'#6b7280'}}>{u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x R$ ${Number(u.valor_parcela).toLocaleString('pt-BR')}` : '—'}</td>
                      <td style={{padding:'10px 12px'}}>
                        <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:sc.bg,color:sc.color}}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{padding:'10px 12px'}}>
                        <Link href={`/admin/unidades/${u.id}/editar`}
                          style={{padding:'3px 10px',border:'1px solid #e5e7eb',borderRadius:'6px',fontSize:'12px',color:'#374151',textDecoration:'none'}}>
                          Editar
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
