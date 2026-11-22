import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function UnidadesPage() {
  const supabase = await createClient()

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*, empreendimentos(nome, slug)')
    .order('empreendimento_id')
    .order('pavimento')
    .order('unidade')

  const statusColors: Record<string, {bg:string,color:string}> = {
    disponivel: {bg:'#dcfce7',color:'#15803d'},
    reservada: {bg:'#fef3c7',color:'#92400e'},
    vendida: {bg:'#fee2e2',color:'#b91c1c'},
    bloqueada: {bg:'#F2F2F7',color:'#6E6E73'},
    indisponivel: {bg:'#F2F2F7',color:'#8E8E93'},
  }

  const statusLabels: Record<string, string> = {
    disponivel: 'Disponível',
    reservada: 'Reservada',
    vendida: 'Vendida',
    bloqueada: 'Bloqueada',
    indisponivel: 'Indisponível',
  }

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Unidades</h1>
          <p style={{fontSize:'0.875rem',color:'#6E6E73',marginTop:'0.25rem'}}>{unidades?.length ?? 0} unidades cadastradas</p>
        </div>
      </div>

      {/* Resumo por status */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'10px',marginBottom:'20px'}}>
        {(['disponivel','reservada','vendida','bloqueada','indisponivel'] as const).map(s => {
          const count = unidades?.filter(u => u.status === s).length ?? 0
          const sc = statusColors[s]
          return (
            <div key={s} style={{background:'white',borderRadius:'10px',border:'1px solid rgba(0,0,0,.1)',padding:'12px 16px'}}>
              <div style={{fontSize:'11px',color:'#6E6E73',marginBottom:'4px',textTransform:'uppercase',fontWeight:'600'}}>{statusLabels[s]}</div>
              <div style={{fontSize:'24px',fontWeight:'700',color:sc.color}}>{count}</div>
            </div>
          )
        })}
      </div>

      <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'900px'}}>
            <thead>
              <tr style={{background:'#F5F5F7',borderBottom:'1px solid rgba(0,0,0,.08)'}}>
                {['Empreendimento','Unidade','Pavimento','Posição','Área','Quartos','Valor','Status','Ações'].map(h => (
                  <th key={h} style={{padding:'10px 14px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase',whiteSpace:'nowrap'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {unidades?.map(u => {
                const sc = statusColors[u.status] ?? statusColors.indisponivel
                const emp = u.empreendimentos as any
                return (
                  <tr key={u.id} style={{borderBottom:'1px solid #F2F2F7'}}>
                    <td style={{padding:'10px 14px',fontWeight:'500',color:'#111'}}>{emp?.nome}</td>
                    <td style={{padding:'10px 14px',fontWeight:'600',color:'#111'}}>{u.unidade}</td>
                    <td style={{padding:'10px 14px',color:'#6E6E73'}}>{u.pavimento ?? '—'}</td>
                    <td style={{padding:'10px 14px',color:'#6E6E73',textTransform:'capitalize'}}>{u.posicao?.replace('_',' ') ?? '—'}</td>
                    <td style={{padding:'10px 14px',color:'#6E6E73',whiteSpace:'nowrap'}}>{u.area_construida ? `${u.area_construida}m²` : '—'}</td>
                    <td style={{padding:'10px 14px',color:'#6E6E73',textAlign:'center'}}>{u.quartos ?? '—'}</td>
                    <td style={{padding:'10px 14px',fontWeight:'500',color:'#111',whiteSpace:'nowrap'}}>{u.valor_imovel ? `R$ ${Number(u.valor_imovel).toLocaleString('pt-BR')}` : '—'}</td>
                    <td style={{padding:'10px 14px'}}>
                      <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',background:sc.bg,color:sc.color}}>
                        {statusLabels[u.status]}
                      </span>
                    </td>
                    <td style={{padding:'10px 14px'}}>
                      <div style={{display:'flex',gap:'6px'}}>
                        <Link href={`/admin/unidades/${u.id}/editar`}
                          style={{padding:'3px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                          Editar
                        </Link>
                        <Link href={`/admin/empreendimentos/${u.empreendimento_id}/unidades`}
                          style={{padding:'3px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                          Ver todas
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
