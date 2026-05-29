'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function PropostaPage({ params }: { params: { slug: string, unidadeId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [unidade, setUnidade] = useState<any>(null)
  const [empreendimento, setEmpreendimento] = useState<any>(null)
  const [temConjuge, setTemConjuge] = useState(false)
  const [temSegundoComprador, setTemSegundoComprador] = useState(false)
  const [segueTabela, setSegueTabela] = useState(true)

  const [form, setForm] = useState({
    // Comprador 1
    comprador1_nome: '', comprador1_cpf: '', comprador1_rg: '',
    comprador1_profissao: '', comprador1_email: '', comprador1_telefone: '',
    comprador1_nascimento: '', comprador1_estado_civil: 'solteiro',
    // Cônjuge
    conjuge_nome: '', conjuge_cpf: '', conjuge_rg: '',
    conjuge_profissao: '', conjuge_email: '', conjuge_telefone: '', conjuge_nascimento: '',
    // Comprador 2
    comprador2_nome: '', comprador2_cpf: '', comprador2_rg: '',
    comprador2_profissao: '', comprador2_email: '', comprador2_telefone: '',
    comprador2_nascimento: '', comprador2_estado_civil: 'solteiro',
    // Corretor
    corretor_nome: '', corretor_cpf_cnpj: '', corretor_creci: '',
    corretor_email: '', corretor_telefone: '', imobiliaria_nome: '',
    // Pagamento
    valor_proposto: '', valor_sinal: '', quantidade_parcelas: '',
    valor_parcela: '', quantidade_intercaladas: '', periodicidade_intercaladas: 'semestrais',
    valor_intercalada: '', valor_total_intercaladas: '', valor_chaves: '',
    observacoes_pagamento: '', observacoes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('empreendimentos').select('*').eq('slug', params.slug).single(),
      supabase.from('unidades').select('*').eq('id', params.unidadeId).single(),
    ]).then(([{ data: emp }, { data: uni }]) => {
      setEmpreendimento(emp)
      setUnidade(uni)
      if (uni) {
        setForm(f => ({
          ...f,
          valor_proposto: uni.valor_imovel ?? '',
          valor_sinal: uni.valor_sinal ?? '',
          quantidade_parcelas: uni.quantidade_parcelas ?? '',
          valor_parcela: uni.valor_parcela ?? '',
          quantidade_intercaladas: uni.quantidade_intercaladas ?? '',
          periodicidade_intercaladas: uni.periodicidade_intercaladas ?? 'semestrais',
          valor_intercalada: uni.valor_intercalada ?? '',
          valor_total_intercaladas: uni.valor_total_intercaladas ?? '',
          valor_chaves: uni.valor_chaves ?? '',
        }))
      }
      setLoading(false)
    })
  }, [params.slug, params.unidadeId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (name === 'comprador1_estado_civil') setTemConjuge(value === 'casado')
  }

  function calcSomatorio() {
    const sinal = Number(form.valor_sinal) || 0
    const parcelas = (Number(form.quantidade_parcelas) || 0) * (Number(form.valor_parcela) || 0)
    const intercaladas = (Number(form.quantidade_intercaladas) || 0) * (Number(form.valor_intercalada) || 0)
    const chaves = Number(form.valor_chaves) || 0
    return sinal + parcelas + intercaladas + chaves
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const somatorio = calcSomatorio()
    const valorProposto = Number(form.valor_proposto)
    if (Math.abs(somatorio - valorProposto) > 1) {
      setError(`O somatório dos pagamentos (R$ ${somatorio.toLocaleString('pt-BR', {minimumFractionDigits:2})}) deve ser igual ao valor proposto (R$ ${valorProposto.toLocaleString('pt-BR', {minimumFractionDigits:2})}). Diferença: R$ ${Math.abs(somatorio - valorProposto).toLocaleString('pt-BR', {minimumFractionDigits:2})}`)
      setSaving(false)
      return
    }

    const supabase = createClient()
    const data = {
      unidade_id: params.unidadeId,
      empreendimento_id: empreendimento.id,
      ...form,
      segue_tabela: segueTabela,
      valor_proposto: valorProposto,
      valor_sinal: Number(form.valor_sinal) || null,
      quantidade_parcelas: Number(form.quantidade_parcelas) || null,
      valor_parcela: Number(form.valor_parcela) || null,
      quantidade_intercaladas: Number(form.quantidade_intercaladas) || null,
      valor_intercalada: Number(form.valor_intercalada) || null,
      valor_total_intercaladas: (Number(form.quantidade_intercaladas) || 0) * (Number(form.valor_intercalada) || 0),
      valor_chaves: Number(form.valor_chaves) || null,
      conjuge_nome: temConjuge ? form.conjuge_nome : null,
      conjuge_cpf: temConjuge ? form.conjuge_cpf : null,
      conjuge_rg: temConjuge ? form.conjuge_rg : null,
      conjuge_profissao: temConjuge ? form.conjuge_profissao : null,
      conjuge_email: temConjuge ? form.conjuge_email : null,
      conjuge_telefone: temConjuge ? form.conjuge_telefone : null,
      conjuge_nascimento: temConjuge ? form.conjuge_nascimento : null,
      comprador2_nome: temSegundoComprador ? form.comprador2_nome : null,
      comprador2_cpf: temSegundoComprador ? form.comprador2_cpf : null,
      comprador2_rg: temSegundoComprador ? form.comprador2_rg : null,
      comprador2_profissao: temSegundoComprador ? form.comprador2_profissao : null,
      comprador2_email: temSegundoComprador ? form.comprador2_email : null,
      comprador2_telefone: temSegundoComprador ? form.comprador2_telefone : null,
      comprador2_nascimento: temSegundoComprador ? form.comprador2_nascimento : null,
    }

    const { data: proposta, error: err } = await supabase.from('propostas').insert([data]).select().single()
    if (err) { setError(err.message); setSaving(false); return }

    // Enviar para WhatsApp
    const tel = '5582999999999' // número da Casa Forte — substituir pelo real
    const msg = encodeURIComponent(
      `🏠 *Nova Proposta Recebida!*\n\n` +
      `*Empreendimento:* ${empreendimento.nome}\n` +
      `*Unidade:* ${unidade.unidade} — ${unidade.pavimento}\n` +
      `*Comprador:* ${form.comprador1_nome}\n` +
      `*Corretor:* ${form.corretor_nome || 'Não informado'}\n` +
      `*Valor proposto:* R$ ${valorProposto.toLocaleString('pt-BR', {minimumFractionDigits:2})}\n` +
      `*Segue tabela:* ${segueTabela ? 'Sim' : 'Não'}\n\n` +
      `Acesse o sistema para ver os detalhes completos:\n` +
      `https://tabelas.casaforteinc.com.br/admin/propostas/${proposta.id}`
    )
    window.open(`https://wa.me/${tel}?text=${msg}`, '_blank')

    setSuccess(true)
    setSaving(false)
  }

  const S = { label: { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'4px' } as React.CSSProperties }
  const inp = (name: string, type='text', placeholder='', required=false) => (
    <input name={name} type={type} placeholder={placeholder} required={required}
      value={(form as any)[name] ?? ''} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}} />
  )
  const sel = (name: string, opts: {value:string,label:string}[]) => (
    <select name={name} value={(form as any)[name] ?? ''} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )

  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '—'

  if (loading) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#6b7280'}}>Carregando...</div>

  if (success) return (
    <div style={{minHeight:'100vh',background:'#F5F3F0',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}>
      <div style={{background:'white',borderRadius:'16px',padding:'3rem',textAlign:'center',maxWidth:'480px'}}>
        <div style={{fontSize:'4rem',marginBottom:'1rem'}}>✅</div>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111',marginBottom:'0.5rem'}}>Proposta enviada!</h1>
        <p style={{color:'#6b7280',marginBottom:'1.5rem'}}>Sua proposta foi registrada e a equipe Casa Forte foi notificada via WhatsApp.</p>
        <a href={`/empreendimentos/${params.slug}`} style={{display:'inline-block',padding:'10px 24px',background:'#E8390E',color:'white',borderRadius:'8px',textDecoration:'none',fontWeight:'500'}}>
          Voltar ao empreendimento
        </a>
      </div>
    </div>
  )

  return (
    <div style={{minHeight:'100vh',background:'#F5F3F0'}}>
      {/* Header */}
      <header style={{background:'#1E1E1E',padding:'12px 24px',display:'flex',alignItems:'center',gap:'12px'}}>
        <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" alt="Casa Forte" style={{height:'32px',objectFit:'contain',filter:'brightness(0) invert(1)'}} />
        <div>
          <div style={{color:'white',fontSize:'13px',fontWeight:'600'}}>Casa Forte</div>
          <div style={{color:'rgba(255,255,255,0.5)',fontSize:'11px'}}>Proposta de Compra</div>
        </div>
      </header>

      <div style={{maxWidth:'800px',margin:'0 auto',padding:'2rem 1rem'}}>
        {/* Info da unidade */}
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'20px',marginBottom:'20px'}}>
          <h1 style={{fontSize:'1.25rem',fontWeight:'700',color:'#111',marginBottom:'4px'}}>
            Proposta — {empreendimento?.nome}
          </h1>
          <p style={{color:'#6b7280',fontSize:'14px',marginBottom:'12px'}}>
            Unidade {unidade?.unidade} · {unidade?.pavimento} · {unidade?.posicao?.replace('_',' ')}
          </p>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',padding:'12px',background:'#f8fafc',borderRadius:'8px'}}>
            <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Área construída</div><div style={{fontWeight:'600',fontSize:'14px'}}>{unidade?.area_construida}m²</div></div>
            <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Quartos</div><div style={{fontWeight:'600',fontSize:'14px'}}>{unidade?.quartos}</div></div>
            <div><div style={{fontSize:'11px',color:'#9ca3af',marginBottom:'2px'}}>Valor tabela</div><div style={{fontWeight:'600',fontSize:'14px',color:'#E8390E'}}>{fmt(unidade?.valor_imovel)}</div></div>
          </div>
        </div>

        {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#b91c1c',fontSize:'14px'}}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Comprador 1 */}
          <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
            <h2 style={{fontSize:'15px',fontWeight:'700',color:'#111',marginBottom:'16px'}}>👤 Dados do Comprador</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div style={{gridColumn:'1/-1'}}><label style={S.label}>Nome completo *</label>{inp('comprador1_nome','text','',true)}</div>
              <div><label style={S.label}>CPF *</label>{inp('comprador1_cpf','text','000.000.000-00',true)}</div>
              <div><label style={S.label}>RG</label>{inp('comprador1_rg')}</div>
              <div><label style={S.label}>Profissão</label>{inp('comprador1_profissao')}</div>
              <div><label style={S.label}>Data de nascimento</label>{inp('comprador1_nascimento','date')}</div>
              <div><label style={S.label}>E-mail</label>{inp('comprador1_email','email')}</div>
              <div><label style={S.label}>Telefone/WhatsApp</label>{inp('comprador1_telefone','tel')}</div>
              <div>
                <label style={S.label}>Estado civil</label>
                {sel('comprador1_estado_civil',[
                  {value:'solteiro',label:'Solteiro(a)'},
                  {value:'casado',label:'Casado(a)'},
                  {value:'divorciado',label:'Divorciado(a)'},
                  {value:'viuvo',label:'Viúvo(a)'},
                  {value:'uniao_estavel',label:'União estável'},
                ])}
              </div>
            </div>

            {/* Cônjuge */}
            {(form.comprador1_estado_civil === 'casado' || form.comprador1_estado_civil === 'uniao_estavel') && (
              <div style={{marginTop:'20px',padding:'16px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
                <h3 style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'14px'}}>💑 Dados do Cônjuge</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div style={{gridColumn:'1/-1'}}><label style={S.label}>Nome completo</label>{inp('conjuge_nome')}</div>
                  <div><label style={S.label}>CPF</label>{inp('conjuge_cpf','text','000.000.000-00')}</div>
                  <div><label style={S.label}>RG</label>{inp('conjuge_rg')}</div>
                  <div><label style={S.label}>Profissão</label>{inp('conjuge_profissao')}</div>
                  <div><label style={S.label}>Data de nascimento</label>{inp('conjuge_nascimento','date')}</div>
                  <div><label style={S.label}>E-mail</label>{inp('conjuge_email','email')}</div>
                  <div><label style={S.label}>Telefone</label>{inp('conjuge_telefone','tel')}</div>
                </div>
              </div>
            )}

            {/* Segundo comprador */}
            <div style={{marginTop:'16px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',color:'#374151'}}>
                <input type="checkbox" checked={temSegundoComprador} onChange={e => setTemSegundoComprador(e.target.checked)}
                  style={{width:'16px',height:'16px',accentColor:'#E8390E'}} />
                Adicionar segundo comprador
              </label>
            </div>

            {temSegundoComprador && (
              <div style={{marginTop:'16px',padding:'16px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
                <h3 style={{fontSize:'14px',fontWeight:'600',color:'#374151',marginBottom:'14px'}}>👤 Segundo Comprador</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
                  <div style={{gridColumn:'1/-1'}}><label style={S.label}>Nome completo</label>{inp('comprador2_nome')}</div>
                  <div><label style={S.label}>CPF</label>{inp('comprador2_cpf','text','000.000.000-00')}</div>
                  <div><label style={S.label}>RG</label>{inp('comprador2_rg')}</div>
                  <div><label style={S.label}>Profissão</label>{inp('comprador2_profissao')}</div>
                  <div><label style={S.label}>Data de nascimento</label>{inp('comprador2_nascimento','date')}</div>
                  <div><label style={S.label}>E-mail</label>{inp('comprador2_email','email')}</div>
                  <div><label style={S.label}>Telefone</label>{inp('comprador2_telefone','tel')}</div>
                  <div>
                    <label style={S.label}>Estado civil</label>
                    {sel('comprador2_estado_civil',[
                      {value:'solteiro',label:'Solteiro(a)'},
                      {value:'casado',label:'Casado(a)'},
                      {value:'divorciado',label:'Divorciado(a)'},
                      {value:'viuvo',label:'Viúvo(a)'},
                      {value:'uniao_estavel',label:'União estável'},
                    ])}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Corretor */}
          <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
            <h2 style={{fontSize:'15px',fontWeight:'700',color:'#111',marginBottom:'16px'}}>🏢 Dados do Corretor / Imobiliária</h2>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div style={{gridColumn:'1/-1'}}><label style={S.label}>Nome do corretor *</label>{inp('corretor_nome','text','',true)}</div>
              <div><label style={S.label}>CPF/CNPJ</label>{inp('corretor_cpf_cnpj')}</div>
              <div><label style={S.label}>CRECI</label>{inp('corretor_creci')}</div>
              <div><label style={S.label}>E-mail</label>{inp('corretor_email','email')}</div>
              <div><label style={S.label}>Telefone/WhatsApp</label>{inp('corretor_telefone','tel')}</div>
              <div style={{gridColumn:'1/-1'}}><label style={S.label}>Imobiliária (se houver)</label>{inp('imobiliaria_nome')}</div>
            </div>
          </div>

          {/* Pagamento */}
          <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
            <h2 style={{fontSize:'15px',fontWeight:'700',color:'#111',marginBottom:'16px'}}>💰 Condições de Pagamento</h2>

            <div style={{display:'flex',gap:'16px',marginBottom:'20px'}}>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',padding:'10px 16px',borderRadius:'8px',border:`2px solid ${segueTabela?'#E8390E':'#DDD9D3'}`,background:segueTabela?'#fdeee9':'white',flex:1,justifyContent:'center'}}>
                <input type="radio" checked={segueTabela} onChange={() => setSegueTabela(true)} style={{accentColor:'#E8390E'}} />
                Seguir valores da tabela
              </label>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',fontSize:'14px',padding:'10px 16px',borderRadius:'8px',border:`2px solid ${!segueTabela?'#E8390E':'#DDD9D3'}`,background:!segueTabela?'#fdeee9':'white',flex:1,justifyContent:'center'}}>
                <input type="radio" checked={!segueTabela} onChange={() => setSegueTabela(false)} style={{accentColor:'#E8390E'}} />
                Propor condições diferentes
              </label>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div style={{gridColumn:'1/-1'}}>
                <label style={S.label}>Valor total proposto (R$) *</label>
                <input name="valor_proposto" type="number" required value={form.valor_proposto} onChange={handleChange}
                  style={{width:'100%',padding:'8px 12px',border:'2px solid #E8390E',borderRadius:'8px',fontSize:'16px',fontWeight:'600',outline:'none',color:'#E8390E'}} />
              </div>
              <div><label style={S.label}>Valor do sinal (R$)</label>{inp('valor_sinal','number')}</div>
              <div><label style={S.label}>Qtd. parcelas mensais</label>{inp('quantidade_parcelas','number')}</div>
              <div><label style={S.label}>Valor da parcela (R$)</label>{inp('valor_parcela','number')}</div>
              <div><label style={S.label}>Qtd. intercaladas</label>{inp('quantidade_intercaladas','number')}</div>
              <div>
                <label style={S.label}>Periodicidade</label>
                {sel('periodicidade_intercaladas',[{value:'semestrais',label:'Semestrais'},{value:'anuais',label:'Anuais'},{value:'personalizada',label:'Personalizada'}])}
              </div>
              <div><label style={S.label}>Valor por intercalada (R$)</label>{inp('valor_intercalada','number')}</div>
              <div><label style={S.label}>Valor das chaves (R$)</label>{inp('valor_chaves','number')}</div>
            </div>

            {/* Somatório */}
            <div style={{marginTop:'16px',padding:'14px',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontSize:'14px',color:'#374151',fontWeight:'500'}}>Somatório dos pagamentos:</span>
                <span style={{fontSize:'18px',fontWeight:'700',color: Math.abs(calcSomatorio() - Number(form.valor_proposto)) < 1 ? '#15803d' : '#b91c1c'}}>
                  R$ {calcSomatorio().toLocaleString('pt-BR', {minimumFractionDigits:2})}
                </span>
              </div>
              {form.valor_proposto && Math.abs(calcSomatorio() - Number(form.valor_proposto)) > 1 && (
                <p style={{fontSize:'12px',color:'#b91c1c',marginTop:'6px'}}>
                  ⚠️ Diferença de R$ {Math.abs(calcSomatorio() - Number(form.valor_proposto)).toLocaleString('pt-BR', {minimumFractionDigits:2})} — ajuste os valores até zerar.
                </p>
              )}
              {form.valor_proposto && Math.abs(calcSomatorio() - Number(form.valor_proposto)) < 1 && calcSomatorio() > 0 && (
                <p style={{fontSize:'12px',color:'#15803d',marginTop:'6px'}}>✅ Valores conferidos!</p>
              )}
            </div>

            <div style={{marginTop:'14px'}}>
              <label style={S.label}>Observações sobre o pagamento</label>
              <textarea name="observacoes_pagamento" value={form.observacoes_pagamento} onChange={handleChange} rows={3}
                placeholder="Ex: cliente solicita prazo maior para o sinal..."
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}} />
            </div>
          </div>

          {/* Observações gerais */}
          <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'24px'}}>
            <label style={S.label}>Observações gerais</label>
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
              style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}} />
          </div>

          <button type="submit" disabled={saving} style={{width:'100%',padding:'14px',background:'#E8390E',color:'white',border:'none',borderRadius:'10px',fontSize:'16px',fontWeight:'600',cursor:'pointer'}}>
            {saving ? 'Enviando proposta...' : '📤 Enviar proposta'}
          </button>

          <p style={{textAlign:'center',fontSize:'12px',color:'#9ca3af',marginTop:'12px'}}>
            Ao enviar, a equipe Casa Forte será notificada via WhatsApp.
          </p>
        </form>
      </div>
    </div>
  )
}
