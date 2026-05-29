import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PropostaDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('propostas')
    .select('*, empreendimentos(nome,slug), unidades(unidade,pavimento,posicao,area_construida,quartos,valor_imovel)')
    .eq('id', id)
    .single()

  if (!p) notFound()

  const emp = p.empreendimentos as any
  const uni = p.unidades as any
  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—'
  const fmtDate = (v: any) => v ? new Date(v+'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
      <h2 style={{fontSize:'15px',fontWeight:'700',color:'#111',marginBottom:'16px'}}>{title}</h2>
      {children}
    </div>
  )

  const Row = ({ label, value }: { label: string, value: any }) => (
    <div style={{display:'flex',gap:'8px',padding:'8px 0',borderBottom:'1px solid #f3f4f6'}}>
      <span style={{fontSize:'13px',color:'#6b7280',width:'200px',flexShrink:0}}>{label}</span>
      <span style={{fontSize:'13px',color:'#111',fontWeight:'500'}}>{value || '—'}</span>
    </div>
  )

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.5rem'}}>
        <div>
          <div style={{fontSize:'13px',color:'#6b7280',marginBottom:'4px'}}>
            <Link href="/admin/propostas" style={{color:'#6b7280',textDecoration:'none'}}>Propostas</Link> → {p.comprador1_nome}
          </div>
          <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Proposta — {emp?.nome}</h1>
          <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>
            Unidade {uni?.unidade} · {uni?.pavimento} · Recebida em {new Date(p.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <Section title="🏠 Unidade">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px'}}>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Unidade</div><div style={{fontWeight:'700',fontSize:'16px'}}>{uni?.unidade}</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Pavimento</div><div style={{fontWeight:'600'}}>{uni?.pavimento}</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Área</div><div style={{fontWeight:'600'}}>{uni?.area_construida}m²</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Valor tabela</div><div style={{fontWeight:'600',color:'#E8390E'}}>{fmt(uni?.valor_imovel)}</div></div>
        </div>
      </Section>

      <Section title="👤 Comprador">
        <Row label="Nome completo" value={p.comprador1_nome} />
        <Row label="CPF" value={p.comprador1_cpf} />
        <Row label="RG" value={p.comprador1_rg} />
        <Row label="Profissão" value={p.comprador1_profissao} />
        <Row label="Data de nascimento" value={fmtDate(p.comprador1_nascimento)} />
        <Row label="Estado civil" value={p.comprador1_estado_civil} />
        <Row label="E-mail" value={p.comprador1_email} />
        <Row label="Telefone" value={p.comprador1_telefone} />
      </Section>

      {p.conjuge_nome && (
        <Section title="💑 Cônjuge">
          <Row label="Nome completo" value={p.conjuge_nome} />
          <Row label="CPF" value={p.conjuge_cpf} />
          <Row label="RG" value={p.conjuge_rg} />
          <Row label="Profissão" value={p.conjuge_profissao} />
          <Row label="Data de nascimento" value={fmtDate(p.conjuge_nascimento)} />
          <Row label="E-mail" value={p.conjuge_email} />
          <Row label="Telefone" value={p.conjuge_telefone} />
        </Section>
      )}

      {p.comprador2_nome && (
        <Section title="👤 Segundo Comprador">
          <Row label="Nome completo" value={p.comprador2_nome} />
          <Row label="CPF" value={p.comprador2_cpf} />
          <Row label="RG" value={p.comprador2_rg} />
          <Row label="Profissão" value={p.comprador2_profissao} />
          <Row label="Data de nascimento" value={fmtDate(p.comprador2_nascimento)} />
          <Row label="Estado civil" value={p.comprador2_estado_civil} />
          <Row label="E-mail" value={p.comprador2_email} />
          <Row label="Telefone" value={p.comprador2_telefone} />
        </Section>
      )}

      <Section title="🏢 Corretor / Imobiliária">
        <Row label="Nome" value={p.corretor_nome} />
        <Row label="CPF/CNPJ" value={p.corretor_cpf_cnpj} />
        <Row label="CRECI" value={p.corretor_creci} />
        <Row label="E-mail" value={p.corretor_email} />
        <Row label="Telefone" value={p.corretor_telefone} />
        <Row label="Imobiliária" value={p.imobiliaria_nome} />
      </Section>

      <Section title="💰 Condições de Pagamento">
        <div style={{padding:'12px',background:p.segue_tabela?'#f0fdf4':'#fffbeb',borderRadius:'8px',marginBottom:'16px',border:`1px solid ${p.segue_tabela?'#bbf7d0':'#fde68a'}`}}>
          <span style={{fontWeight:'600',color:p.segue_tabela?'#15803d':'#92400e'}}>
            {p.segue_tabela ? '✅ Segue os valores da tabela' : '⚠️ Propõe condições diferentes da tabela'}
          </span>
        </div>
        <Row label="Valor proposto" value={<span style={{color:'#E8390E',fontWeight:'700',fontSize:'16px'}}>{fmt(p.valor_proposto)}</span>} />
        <Row label="Sinal" value={fmt(p.valor_sinal)} />
        <Row label="Parcelas mensais" value={p.quantidade_parcelas ? `${p.quantidade_parcelas}x de ${fmt(p.valor_parcela)}` : '—'} />
        <Row label="Intercaladas" value={p.quantidade_intercaladas ? `${p.quantidade_intercaladas}x de ${fmt(p.valor_intercalada)} (${p.periodicidade_intercaladas})` : '—'} />
        <Row label="Chaves" value={fmt(p.valor_chaves)} />
        <div style={{marginTop:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'14px',color:'#374151',fontWeight:'500'}}>Somatório:</span>
          <span style={{fontSize:'18px',fontWeight:'700',color:'#15803d'}}>
            {fmt((Number(p.valor_sinal)||0) + ((Number(p.quantidade_parcelas)||0)*(Number(p.valor_parcela)||0)) + ((Number(p.quantidade_intercaladas)||0)*(Number(p.valor_intercalada)||0)) + (Number(p.valor_chaves)||0))}
          </span>
        </div>
        {p.observacoes_pagamento && (
          <div style={{marginTop:'12px',padding:'10px',background:'#fffbeb',borderRadius:'8px',fontSize:'13px',color:'#92400e'}}>
            <strong>Obs. pagamento:</strong> {p.observacoes_pagamento}
          </div>
        )}
      </Section>

      {p.observacoes && (
        <Section title="📝 Observações Gerais">
          <p style={{fontSize:'14px',color:'#374151'}}>{p.observacoes}</p>
        </Section>
      )}
    </div>
  )
}

