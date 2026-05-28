'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function NovaVendaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
  const [unidades, setUnidades] = useState<any[]>([])
  const [form, setForm] = useState({
    empreendimento_id: '', unidade_id: '', comprador_nome: '',
    comprador_documento: '', corretor_responsavel: '', data_venda: new Date().toISOString().split('T')[0],
    valor_venda: '', valor_sinal: '', valor_parcelas: '',
    valor_intercaladas: '', valor_chaves: '', forma_pagamento: '',
    comissao: '', status_contrato: 'aguardando_contrato', observacoes: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('empreendimentos').select('id, nome').order('nome')
      .then(({ data }) => setEmpreendimentos(data ?? []))
  }, [])

  async function handleEmpChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    setForm(f => ({ ...f, empreendimento_id: id, unidade_id: '' }))
    if (id) {
      const supabase = createClient()
      const { data } = await supabase.from('unidades').select('id, unidade, valor_imovel, valor_sinal, valor_parcela, valor_intercalada, valor_chaves')
        .eq('empreendimento_id', id).in('status', ['disponivel','reservada']).order('unidade')
      setUnidades(data ?? [])
    }
  }

  function handleUnidadeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value
    const unidade = unidades.find(u => u.id === id)
    if (unidade) {
      setForm(f => ({
        ...f, unidade_id: id,
        valor_venda: unidade.valor_imovel ?? '',
        valor_sinal: unidade.valor_sinal ?? '',
        valor_chaves: unidade.valor_chaves ?? '',
      }))
    } else {
      setForm(f => ({ ...f, unidade_id: id }))
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()

    // Registrar venda
    const { error: err } = await supabase.from('vendas').insert([{
      ...form,
      valor_venda: Number(form.valor_venda),
      valor_sinal: form.valor_sinal ? Number(form.valor_sinal) : null,
      valor_parcelas: form.valor_parcelas ? Number(form.valor_parcelas) : null,
      valor_intercaladas: form.valor_intercaladas ? Number(form.valor_intercaladas) : null,
      valor_chaves: form.valor_chaves ? Number(form.valor_chaves) : null,
      comissao: form.comissao ? Number(form.comissao) : null,
    }])

    if (err) { setError(err.message); setSaving(false); return }

    // Atualizar status da unidade para vendida
    await supabase.from('unidades').update({
      status: 'vendida',
      comprador_nome: form.comprador_nome,
      corretor_responsavel: form.corretor_responsavel,
      data_venda: form.data_venda,
    }).eq('id', form.unidade_id)

    router.push('/admin/vendas')
  }

  const S = { label: { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'4px' } as React.CSSProperties }
  const inp = (name: string, type='text', placeholder='') => (
    <input name={name} type={type} placeholder={placeholder} value={(form as any)[name]} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
  )

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Registrar Venda</h1>
        <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>A unidade será marcada como vendida automaticamente</p>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#b91c1c',fontSize:'14px'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Unidade</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div>
              <label style={S.label}>Empreendimento *</label>
              <select value={form.empreendimento_id} onChange={handleEmpChange} required
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
                <option value="">Selecione...</option>
                {empreendimentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Unidade *</label>
              <select name="unidade_id" value={form.unidade_id} onChange={handleUnidadeChange} required
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
                <option value="">Selecione o empreendimento primeiro</option>
                {unidades.map(u => <option key={u.id} value={u.id}>{u.unidade} — R$ {Number(u.valor_imovel).toLocaleString('pt-BR')}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Comprador e Corretor</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div><label style={S.label}>Nome do comprador *</label>{inp('comprador_nome','text','Nome completo')}</div>
            <div><label style={S.label}>CPF/CNPJ</label>{inp('comprador_documento','text','000.000.000-00')}</div>
            <div><label style={S.label}>Corretor responsável</label>{inp('corretor_responsavel','text','Nome do corretor')}</div>
            <div><label style={S.label}>Data da venda *</label>{inp('data_venda','date')}</div>
            <div><label style={S.label}>Comissão (R$)</label>{inp('comissao','number')}</div>
            <div>
              <label style={S.label}>Status do contrato</label>
              <select name="status_contrato" value={form.status_contrato} onChange={handleChange}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
                <option value="aguardando_contrato">Aguardando contrato</option>
                <option value="contrato_enviado">Contrato enviado</option>
                <option value="contrato_assinado">Contrato assinado</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Valores</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
            <div><label style={S.label}>Valor da venda (R$) *</label>{inp('valor_venda','number')}</div>
            <div><label style={S.label}>Valor do sinal (R$)</label>{inp('valor_sinal','number')}</div>
            <div><label style={S.label}>Valor das parcelas (R$)</label>{inp('valor_parcelas','number')}</div>
            <div><label style={S.label}>Valor intercaladas (R$)</label>{inp('valor_intercaladas','number')}</div>
            <div><label style={S.label}>Valor das chaves (R$)</label>{inp('valor_chaves','number')}</div>
            <div><label style={S.label}>Forma de pagamento</label>{inp('forma_pagamento','text','Ex: Financiamento, À vista')}</div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <label style={S.label}>Observações</label>
          <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
            style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}} />
        </div>

        <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
          <button type="button" onClick={() => router.back()}
            style={{padding:'10px 20px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',background:'white',cursor:'pointer',color:'#374151'}}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            style={{padding:'10px 20px',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
            {saving ? 'Salvando...' : 'Registrar venda'}
          </button>
        </div>
      </form>
    </div>
  )
}
