import { createClient } from '@/lib/supabase/server'
import { createClient as createSbClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import PropostaAcoes from './PropostaAcoes'

export default async function PropostaDetalhesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: p } = await supabase
    .from('propostas')
    .select('*, empreendimentos(nome,slug), unidades(unidade,pavimento,posicao,area_construida,quartos,valor_imovel)')
    .eq('id', id)
    .single()

  if (!p) notFound()

  // Documentos do cliente anexados pelo corretor (bucket privado) → links de
  // download temporários (URL assinada), gerados com service role.
  const docs = Array.isArray((p as any).documentos) ? (p as any).documentos : []
  let docLinks: { nome: string; url?: string; tamanho?: number; mime?: string }[] = []
  if (docs.length) {
    const admin = createSbClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    docLinks = await Promise.all(docs.map(async (d: any) => {
      const { data: sg } = await admin.storage.from('proposta-documentos').createSignedUrl(d.path, 3600)
      return { nome: d.nome, mime: d.mime, tamanho: d.tamanho, url: sg?.signedUrl }
    }))
  }
  const fmtTam = (n?: number) => (n == null ? '' : n < 1048576 ? `${Math.round(n / 1024)} KB` : `${(n / 1048576).toFixed(1)} MB`)

  const emp = p.empreendimentos as any
  const uni = p.unidades as any
  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2})}` : '—'
  const fmtDate = (v: any) => v ? new Date(v+'T00:00:00').toLocaleDateString('pt-BR') : '—'

  const statusConfig: Record<string, {bg:string,color:string,label:string}> = {
    pendente:  {bg:'#fef3c7',color:'#92400e',label:'⏳ Pendente'},
    aprovada:  {bg:'#dcfce7',color:'#15803d',label:'✅ Aprovada'},
    recusada:  {bg:'#fee2e2',color:'#b91c1c',label:'❌ Recusada'},
    cancelada: {bg:'#f3f4f6',color:'#6b7280',label:'🚫 Cancelada'},
  }
  const sc = statusConfig[p.status_proposta ?? 'pendente'] ?? statusConfig.pendente

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

  const somatorio = (Number(p.valor_sinal)||0) +
    ((Number(p.quantidade_parcelas)||0)*(Number(p.valor_parcela)||0)) +
    ((Number(p.quantidade_intercaladas)||0)*(Number(p.valor_intercalada)||0)) +
    (Number(p.valor_chaves)||0)

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
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <span style={{padding:'6px 14px',borderRadius:'20px',fontSize:'13px',fontWeight:'600',background:sc.bg,color:sc.color}}>
            {sc.label}
          </span>
          <a href={`/admin/propostas/${id}/pdf`} target="_blank"
            style={{padding:'8px 16px',background:'#374151',color:'white',borderRadius:'8px',fontSize:'14px',fontWeight:'500',textDecoration:'none'}}>
            📄 PDF
          </a>
        </div>
      </div>

      {/* Botões de ação */}
      <PropostaAcoes propostaId={id} statusAtual={p.status_proposta ?? 'pendente'} />

      {/* Documentos do cliente */}
      {docLinks.length > 0 && (
        <Section title={`📎 Documentos do cliente (${docLinks.length})`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {docLinks.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid #eee', borderRadius: 8, padding: '8px 12px' }}>
                <span style={{ fontSize: 13, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.mime === 'application/pdf' ? '📄' : '🖼️'} {d.nome}{d.tamanho ? <span style={{ color: '#9ca3af' }}> · {fmtTam(d.tamanho)}</span> : null}
                </span>
                {d.url
                  ? <a href={d.url} target="_blank" rel="noreferrer" style={{ padding: '5px 12px', background: '#E8390E', color: 'white', borderRadius: 8, fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0 }}>Baixar</a>
                  : <span style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }}>indisponível</span>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Unidade */}
      <Section title="🏠 Unidade">
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px'}}>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Unidade</div><div style={{fontWeight:'700',fontSize:'16px'}}>{uni?.unidade}</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Pavimento</div><div style={{fontWeight:'600'}}>{uni?.pavimento}</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Área</div><div style={{fontWeight:'600'}}>{uni?.area_construida}m²</div></div>
          <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Valor tabela</div><div style={{fontWeight:'600',color:'#E8390E'}}>{fmt(uni?.valor_imovel)}</div></div>
        </div>
      </Section>

      {/* Comprador */}
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
        <div style={{padding:'10px 12px',background:p.segue_tabela?'#f0fdf4':'#fffbeb',borderRadius:'8px',marginBottom:'14px',border:`1px solid ${p.segue_tabela?'#bbf7d0':'#fde68a'}`,fontWeight:'600',fontSize:'13px',color:p.segue_tabela?'#15803d':'#92400e'}}>
          {p.segue_tabela ? '✅ Segue os valores da tabela' : '⚠️ Propõe condições diferentes da tabela'}
        </div>
        <Row label="Valor proposto" value={<span style={{color:'#E8390E',fontWeight:'700',fontSize:'16px'}}>{fmt(p.valor_proposto)}</span>} />
        <Row label="Sinal" value={fmt(p.valor_sinal)} />
        <Row label="Parcelas mensais" value={p.quantidade_parcelas ? `${p.quantidade_parcelas}x de ${fmt(p.valor_parcela)}` : '—'} />
        <Row label="Intercaladas" value={p.quantidade_intercaladas ? `${p.quantidade_intercaladas}x de ${fmt(p.valor_intercalada)} (${p.periodicidade_intercaladas})` : '—'} />
        <Row label="Chaves" value={fmt(p.valor_chaves)} />
        <div style={{marginTop:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontSize:'14px',fontWeight:'500'}}>Somatório:</span>
          <span style={{fontSize:'18px',fontWeight:'700',color:'#15803d'}}>{fmt(somatorio)}</span>
        </div>
        {p.observacoes_pagamento && (
          <div style={{marginTop:'10px',padding:'10px',background:'#fffbeb',borderRadius:'8px',fontSize:'13px',color:'#92400e'}}>
            <strong>Obs.:</strong> {p.observacoes_pagamento}
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
