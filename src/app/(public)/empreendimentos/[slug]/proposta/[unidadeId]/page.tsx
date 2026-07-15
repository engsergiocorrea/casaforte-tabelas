'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

// Periodicidade textual (ex.: "semestrais") → nº de meses, e o inverso.
const MESES_POR_TEXTO: Record<string, number> = {
  mensais: 1, bimestrais: 2, trimestrais: 3, quadrimestrais: 4, semestrais: 6, anuais: 12,
}
function mesesDaPeriodicidade(txt: any): string {
  const t = String(txt ?? '').toLowerCase().trim()
  if (MESES_POR_TEXTO[t]) return String(MESES_POR_TEXTO[t])
  const n = parseInt(t, 10)
  return isFinite(n) && n > 0 ? String(n) : ''
}
// A coluna periodicidade_intercaladas é um enum ('semestrais'|'anuais'|
// 'personalizada'); o nº de meses real vai na coluna própria. Aqui só
// mapeamos para um valor válido do enum.
function enumPeriodicidade(meses: any): 'semestrais' | 'anuais' | 'personalizada' {
  const n = parseInt(String(meses ?? ''), 10)
  if (n === 6) return 'semestrais'
  if (n === 12) return 'anuais'
  return 'personalizada'
}

export default function PropostaPage() {
  const params = useParams()
  const slug = params.slug as string
  const unidadeId = params.unidadeId as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [unidade, setUnidade] = useState<any>(null)
  const [empreendimento, setEmpreendimento] = useState<any>(null)
  const [segueTabela, setSegueTabela] = useState(true)
  const [sinalParcelado, setSinalParcelado] = useState(false)
  const [temSegundoComprador, setTemSegundoComprador] = useState(false)
  const [propostaId, setPropostaId] = useState('')
  const [form, setForm] = useState({
    comprador1_nome: '', comprador1_cpf: '', comprador1_rg: '',
    comprador1_profissao: '', comprador1_email: '', comprador1_telefone: '',
    comprador1_nascimento: '', comprador1_estado_civil: 'solteiro',
    conjuge_nome: '', conjuge_cpf: '', conjuge_rg: '',
    conjuge_profissao: '', conjuge_email: '', conjuge_telefone: '', conjuge_nascimento: '',
    comprador2_nome: '', comprador2_cpf: '', comprador2_rg: '',
    comprador2_profissao: '', comprador2_email: '', comprador2_telefone: '',
    comprador2_nascimento: '', comprador2_estado_civil: 'solteiro',
    corretor_nome: '', corretor_cpf_cnpj: '', corretor_creci: '',
    corretor_email: '', corretor_telefone: '', imobiliaria_nome: '',
    valor_proposto: '', valor_sinal: '', sinal_quantidade_parcelas: '', quantidade_parcelas: '',
    valor_parcela: '', quantidade_intercaladas: '', periodicidade_intercaladas: 'semestrais',
    periodicidade_meses_intercaladas: '6', data_primeira_intercalada: '',
    valor_intercalada: '', valor_chaves: '',
    observacoes_pagamento: '', observacoes: '',
  })

  useEffect(() => {
    if (!slug || !unidadeId) return
    const supabase = createClient()
    Promise.all([
      supabase.from('empreendimentos').select('*').eq('slug', slug).single(),
      supabase.from('unidades').select('*').eq('id', unidadeId).single(),
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
          periodicidade_meses_intercaladas: mesesDaPeriodicidade(uni.periodicidade_intercaladas) || '6',
          valor_intercalada: uni.valor_intercalada ?? '',
          valor_chaves: uni.valor_chaves ?? '',
        }))
      }
      setLoading(false)
    })
  }, [slug, unidadeId])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
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
      setError(`O somatorio (R$ ${somatorio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) deve ser igual ao valor proposto (R$ ${valorProposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Diferenca: R$ ${Math.abs(somatorio - valorProposto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`)
      setSaving(false)
      return
    }

    const supabase = createClient()
    const {
      comprador1_nascimento,
      conjuge_nascimento,
      comprador2_nascimento,
      ...restForm
    } = form

    // Salva o cônjuge a partir do valor real do estado civil (não do state
    // temConjuge, que pode dessincronizar e gravar null indevidamente).
    const casadoOuUniao = form.comprador1_estado_civil === 'casado' || form.comprador1_estado_civil === 'uniao_estavel'

    const data = {
      unidade_id: unidadeId,
      empreendimento_id: empreendimento.id,
      ...restForm,
      comprador1_nascimento: comprador1_nascimento || null,
      segue_tabela: segueTabela,
      valor_proposto: valorProposto,
      valor_sinal: Number(form.valor_sinal) || null,
      quantidade_parcelas: Number(form.quantidade_parcelas) || null,
      valor_parcela: Number(form.valor_parcela) || null,
      quantidade_intercaladas: Number(form.quantidade_intercaladas) || null,
      valor_intercalada: Number(form.valor_intercalada) || null,
      valor_total_intercaladas: (Number(form.quantidade_intercaladas) || 0) * (Number(form.valor_intercalada) || 0),
      periodicidade_meses_intercaladas: Number(form.periodicidade_meses_intercaladas) || null,
      periodicidade_intercaladas: enumPeriodicidade(form.periodicidade_meses_intercaladas),
      data_primeira_intercalada: form.data_primeira_intercalada || null,
      sinal_parcelado: sinalParcelado,
      sinal_quantidade_parcelas: sinalParcelado ? (Number(form.sinal_quantidade_parcelas) || null) : null,
      valor_chaves: Number(form.valor_chaves) || null,
      conjuge_nome: casadoOuUniao ? form.conjuge_nome : null,
      conjuge_cpf: casadoOuUniao ? form.conjuge_cpf : null,
      conjuge_rg: casadoOuUniao ? form.conjuge_rg : null,
      conjuge_profissao: casadoOuUniao ? form.conjuge_profissao : null,
      conjuge_email: casadoOuUniao ? form.conjuge_email : null,
      conjuge_telefone: casadoOuUniao ? form.conjuge_telefone : null,
      conjuge_nascimento: casadoOuUniao && conjuge_nascimento ? conjuge_nascimento : null,
      comprador2_nome: temSegundoComprador ? form.comprador2_nome : null,
      comprador2_cpf: temSegundoComprador ? form.comprador2_cpf : null,
      comprador2_rg: temSegundoComprador ? form.comprador2_rg : null,
      comprador2_profissao: temSegundoComprador ? form.comprador2_profissao : null,
      comprador2_email: temSegundoComprador ? form.comprador2_email : null,
      comprador2_telefone: temSegundoComprador ? form.comprador2_telefone : null,
      comprador2_nascimento: temSegundoComprador && comprador2_nascimento ? comprador2_nascimento : null,
    }

    const { data: proposta, error: err } = await supabase.from('propostas').insert([data]).select().single()
    if (err) { setError(err.message); setSaving(false); return }

    // Dispara WhatsApp sem bloquear o usuário
    fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empreendimento: empreendimento.nome,
        unidade: unidade.unidade,
        pavimento: unidade.pavimento,
        area: unidade.area_construida,
        quartos: unidade.quartos,
        propostaId: proposta.id,
        segue_tabela: segueTabela,
        ...form,
        valor_proposto: segueTabela ? unidade.valor_imovel : valorProposto,
        valor_sinal: Number(form.valor_sinal) || 0,
        quantidade_parcelas: Number(form.quantidade_parcelas) || 0,
        valor_parcela: Number(form.valor_parcela) || 0,
        quantidade_intercaladas: Number(form.quantidade_intercaladas) || 0,
        valor_intercalada: Number(form.valor_intercalada) || 0,
        valor_chaves: Number(form.valor_chaves) || 0,
        corretorTelefone: form.corretor_telefone || null,
        compradorTelefone: form.comprador1_telefone || null,
      }),
    }).catch(e => console.error('[WhatsApp]', e))

    setPropostaId(proposta.id)
    setSuccess(true)
    setSaving(false)
  }

  const inp = (name: string, type = 'text', placeholder = '', required = false) => (
    <input name={name} type={type} placeholder={placeholder} required={required}
      value={(form as any)[name] ?? ''} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }} />
  )
  const sel = (name: string, opts: { value: string, label: string }[]) => (
    <select name={name} value={(form as any)[name] ?? ''} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', boxSizing: 'border-box' }}>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
  const lbl = (text: string) => <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>
  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'
  const card = (title: string, children: React.ReactNode) => (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>{title}</h2>
      {children}
    </div>
  )
  const g2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' } as React.CSSProperties
  const full = { gridColumn: '1/-1' } as React.CSSProperties

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}>Carregando...</div>

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '3rem', textAlign: 'center', maxWidth: '480px' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginBottom: '0.5rem' }}>Proposta registrada!</h1>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Proposta enviada com sucesso. A equipe Casa Forte foi notificada automaticamente via WhatsApp! 📲
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <a href={`/admin/propostas/${propostaId}/pdf`} target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 24px', background: '#E8390E', color: 'white', borderRadius: '10px', textDecoration: 'none', fontWeight: '600', fontSize: '15px' }}>
            📄 Ver / Imprimir PDF da proposta
          </a>
        </div>
        <a href={`/empreendimentos/${slug}`} style={{ display: 'inline-block', fontSize: '13px', color: '#9ca3af', textDecoration: 'none' }}>
          ← Voltar ao empreendimento
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F5F3F0' }}>
      <header style={{ background: '#1E1E1E', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" alt="Casa Forte" style={{ height: '32px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        <div>
          <div style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>Casa Forte</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Proposta de Compra</div>
        </div>
      </header>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '20px', marginBottom: '20px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#111', marginBottom: '4px' }}>Proposta — {empreendimento?.nome}</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '12px' }}>Unidade {unidade?.unidade} · {unidade?.pavimento}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
            <div><div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Área</div><div style={{ fontWeight: '600' }}>{unidade?.area_construida}m²</div></div>
            <div><div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Quartos</div><div style={{ fontWeight: '600' }}>{unidade?.quartos}</div></div>
            <div><div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>Valor tabela</div><div style={{ fontWeight: '600', color: '#E8390E' }}>{fmt(unidade?.valor_imovel)}</div></div>
          </div>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {card('👤 Dados do Comprador',
            <div>
              <div style={g2}>
                <div style={full}>{lbl('Nome completo *')}{inp('comprador1_nome', 'text', '', true)}</div>
                <div>{lbl('CPF *')}{inp('comprador1_cpf', 'text', '000.000.000-00', true)}</div>
                <div>{lbl('RG')}{inp('comprador1_rg')}</div>
                <div>{lbl('Profissão')}{inp('comprador1_profissao')}</div>
                <div>{lbl('Data de nascimento')}{inp('comprador1_nascimento', 'date')}</div>
                <div>{lbl('E-mail')}{inp('comprador1_email', 'email')}</div>
                <div>{lbl('Telefone/WhatsApp')}{inp('comprador1_telefone', 'tel')}</div>
                <div>{lbl('Estado civil')}{sel('comprador1_estado_civil', [{ value: 'solteiro', label: 'Solteiro(a)' }, { value: 'casado', label: 'Casado(a)' }, { value: 'divorciado', label: 'Divorciado(a)' }, { value: 'viuvo', label: 'Viúvo(a)' }, { value: 'uniao_estavel', label: 'União estável' }])}</div>
              </div>
              {(form.comprador1_estado_civil === 'casado' || form.comprador1_estado_civil === 'uniao_estavel') && (
                <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '14px' }}>💍 Dados do Cônjuge</h3>
                  <div style={g2}>
                    <div style={full}>{lbl('Nome completo')}{inp('conjuge_nome')}</div>
                    <div>{lbl('CPF')}{inp('conjuge_cpf')}</div>
                    <div>{lbl('RG')}{inp('conjuge_rg')}</div>
                    <div>{lbl('Profissão')}{inp('conjuge_profissao')}</div>
                    <div>{lbl('Data de nascimento')}{inp('conjuge_nascimento', 'date')}</div>
                    <div>{lbl('E-mail')}{inp('conjuge_email', 'email')}</div>
                    <div>{lbl('Telefone')}{inp('conjuge_telefone', 'tel')}</div>
                  </div>
                </div>
              )}
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#374151' }}>
                  <input type="checkbox" checked={temSegundoComprador} onChange={e => setTemSegundoComprador(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#E8390E' }} />
                  Adicionar segundo comprador
                </label>
              </div>
              {temSegundoComprador && (
                <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '14px' }}>👤 Segundo Comprador</h3>
                  <div style={g2}>
                    <div style={full}>{lbl('Nome completo')}{inp('comprador2_nome')}</div>
                    <div>{lbl('CPF')}{inp('comprador2_cpf')}</div>
                    <div>{lbl('RG')}{inp('comprador2_rg')}</div>
                    <div>{lbl('Profissão')}{inp('comprador2_profissao')}</div>
                    <div>{lbl('Data de nascimento')}{inp('comprador2_nascimento', 'date')}</div>
                    <div>{lbl('E-mail')}{inp('comprador2_email', 'email')}</div>
                    <div>{lbl('Telefone')}{inp('comprador2_telefone', 'tel')}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {card('🏢 Corretor / Imobiliária',
            <div style={g2}>
              <div style={full}>{lbl('Nome do corretor *')}{inp('corretor_nome', 'text', '', true)}</div>
              <div>{lbl('CPF/CNPJ')}{inp('corretor_cpf_cnpj')}</div>
              <div>{lbl('CRECI')}{inp('corretor_creci')}</div>
              <div>{lbl('E-mail')}{inp('corretor_email', 'email')}</div>
              <div>{lbl('Telefone')}{inp('corretor_telefone', 'tel')}</div>
              <div style={full}>{lbl('Imobiliária')}{inp('imobiliaria_nome')}</div>
            </div>
          )}

          {card('💰 Condições de Pagamento',
            <div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', padding: '10px 16px', borderRadius: '8px', border: `2px solid ${segueTabela ? '#E8390E' : '#DDD9D3'}`, background: segueTabela ? '#fdeee9' : 'white', flex: 1, justifyContent: 'center' }}>
                  <input type="radio" checked={segueTabela} onChange={() => setSegueTabela(true)} style={{ accentColor: '#E8390E' }} />
                  Seguir valores da tabela
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', padding: '10px 16px', borderRadius: '8px', border: `2px solid ${!segueTabela ? '#E8390E' : '#DDD9D3'}`, background: !segueTabela ? '#fdeee9' : 'white', flex: 1, justifyContent: 'center' }}>
                  <input type="radio" checked={!segueTabela} onChange={() => setSegueTabela(false)} style={{ accentColor: '#E8390E' }} />
                  Propor condições diferentes
                </label>
              </div>
              <div style={g2}>
                <div style={full}>
                  {lbl('Valor total proposto (R$) *')}
                  <input name="valor_proposto" type="number" required value={form.valor_proposto} onChange={handleChange}
                    style={{ width: '100%', padding: '8px 12px', border: '2px solid #E8390E', borderRadius: '8px', fontSize: '16px', fontWeight: '600', outline: 'none', color: '#E8390E', boxSizing: 'border-box' }} />
                </div>
                <div>{lbl('Valor do sinal (R$)')}{inp('valor_sinal', 'number')}</div>
                <div style={full}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    <input type="checkbox" checked={sinalParcelado} onChange={e => setSinalParcelado(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#E8390E' }} />
                    Sinal parcelado?
                  </label>
                </div>
                {sinalParcelado && <div>{lbl('Qtd. parcelas do sinal (mensais)')}{inp('sinal_quantidade_parcelas', 'number')}</div>}
                <div>{lbl('Qtd. parcelas mensais')}{inp('quantidade_parcelas', 'number')}</div>
                <div>{lbl('Valor da parcela (R$)')}{inp('valor_parcela', 'number')}</div>
                <div>{lbl('Qtd. intercaladas')}{inp('quantidade_intercaladas', 'number')}</div>
                <div>{lbl('Periodicidade (meses)')}{inp('periodicidade_meses_intercaladas', 'number', 'ex.: 6 = semestral')}</div>
                <div>{lbl('Data da 1ª intercalada')}{inp('data_primeira_intercalada', 'date')}</div>
                <div>{lbl('Valor por intercalada (R$)')}{inp('valor_intercalada', 'number')}</div>
                <div>{lbl('Valor das chaves (R$)')}{inp('valor_chaves', 'number')}</div>
              </div>
              <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>Somatório:</span>
                  <span style={{ fontSize: '18px', fontWeight: '700', color: Math.abs(calcSomatorio() - Number(form.valor_proposto)) < 1 ? '#15803d' : '#b91c1c' }}>
                    R$ {calcSomatorio().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {form.valor_proposto && Math.abs(calcSomatorio() - Number(form.valor_proposto)) > 1 && (
                  <p style={{ fontSize: '12px', color: '#b91c1c', marginTop: '6px' }}>⚠️ Diferença de R$ {Math.abs(calcSomatorio() - Number(form.valor_proposto)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                )}
                {form.valor_proposto && Math.abs(calcSomatorio() - Number(form.valor_proposto)) < 1 && calcSomatorio() > 0 && (
                  <p style={{ fontSize: '12px', color: '#15803d', marginTop: '6px' }}>✅ Valores conferidos!</p>
                )}
              </div>
              <div style={{ marginTop: '14px' }}>
                {lbl('Observações sobre o pagamento')}
                <textarea name="observacoes_pagamento" value={form.observacoes_pagamento} onChange={handleChange} rows={3}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
          )}

          {card('📝 Observações gerais',
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          )}

          <button type="submit" disabled={saving} style={{ width: '100%', padding: '14px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Enviando...' : '📤 Enviar proposta'}
          </button>
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#9ca3af', marginTop: '12px' }}>Ao enviar, a equipe Casa Forte será notificada automaticamente via WhatsApp.</p>
        </form>
      </div>
    </div>
  )
}
