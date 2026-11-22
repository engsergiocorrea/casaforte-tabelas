import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function EmpreendimentosPage() {
  const supabase = await createClient()
  const { data: empreendimentos } = await supabase
    .from('empreendimentos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Empreendimentos</h1>
          <p style={{fontSize:'0.875rem',color:'#6E6E73',marginTop:'0.25rem'}}>Gerencie seus empreendimentos</p>
        </div>
        <Link href="/admin/empreendimentos/novo" style={{display:'inline-flex',alignItems:'center',gap:'6px',padding:'8px 16px',background:'#E8390E',color:'white',borderRadius: '10px',fontSize:'14px',fontWeight:'500',textDecoration:'none'}}>
          + Novo empreendimento
        </Link>
      </div>

      <div style={{background:'white',borderRadius: '16px',border:'1px solid rgba(0,0,0,.1)',overflow:'hidden'}}>
        {!empreendimentos || empreendimentos.length === 0 ? (
          <div style={{textAlign:'center',padding:'4rem 2rem',color:'#8E8E93'}}>
            <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🏗️</div>
            <p style={{fontSize:'1rem',marginBottom:'0.5rem',color:'#3A3A3C',fontWeight:'500'}}>Nenhum empreendimento cadastrado</p>
            <p style={{fontSize:'0.875rem'}}>Clique em "Novo empreendimento" para começar</p>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'14px'}}>
            <thead>
              <tr style={{background:'#F5F5F7',borderBottom:'1px solid rgba(0,0,0,.08)'}}>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>Nome</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>Cidade</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>Status</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>Público</th>
                <th style={{padding:'12px 16px',textAlign:'left',fontSize:'12px',fontWeight:'600',color:'#6E6E73',textTransform:'uppercase'}}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {empreendimentos.map((emp) => (
                <tr key={emp.id} style={{borderBottom:'1px solid #F2F2F7'}}>
                  <td style={{padding:'12px 16px',fontWeight:'500',color:'#111'}}>{emp.nome}</td>
                  <td style={{padding:'12px 16px',color:'#6E6E73'}}>{emp.cidade}, {emp.estado}</td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'500',background:'#dbeafe',color:'#1d4ed8'}}>
                      {emp.status}
                    </span>
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <span style={{padding:'2px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'500',background:emp.ativo_publico?'#dcfce7':'#F2F2F7',color:emp.ativo_publico?'#15803d':'#6E6E73'}}>
                      {emp.ativo_publico ? 'Ativo' : 'Inativo'}
                    </span>
                    {emp.visibilidade === 'diretoria' && (
                      <span style={{marginLeft:'6px',padding:'2px 10px',borderRadius:'20px',fontSize:'12px',fontWeight:'500',background:'#111827',color:'white'}}>🔒 Só diretoria</span>
                    )}
                  </td>
                  <td style={{padding:'12px 16px'}}>
                    <div style={{display:'flex',gap:'8px'}}>
                      <Link href={`/admin/empreendimentos/${emp.id}/unidades`} style={{padding:'4px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                        Unidades
                      </Link>
                      <Link href={`/admin/empreendimentos/${emp.id}/editar`} style={{padding:'4px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                        Editar
                      </Link>
                      <Link href={`/empreendimentos/${emp.slug}`} target="_blank" style={{padding:'4px 10px',border:'1px solid rgba(0,0,0,.08)',borderRadius: '8px',fontSize:'12px',color:'#3A3A3C',textDecoration:'none'}}>
                        Ver público
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
