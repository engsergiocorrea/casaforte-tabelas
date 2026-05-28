'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function EditarVendaPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('vendas').select('*, empreendimentos(nome), unidades(unidade)')
      .eq('id', params.id).single()
      .then(({ data }) => { if (data) setForm(data) })
  }, [params.id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f: any) => ({ ...f, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('vendas').update({
      comprador_nome: form.comprador_nome,
      comprador_documento: form.comprador_documento,
      corretor_responsavel: form.corretor_responsavel,
      data_venda: form.data_venda,
      valor_venda: Number(form.valor_venda),
      valor_sinal: form.valor_sinal ? Number(form.valor_sinal) : null,
      valor_parcelas: form.valor_parcelas ? Number(form.valor_parcelas) : null,
      valor_intercaladas: form.valor_intercaladas ? Number(form.valor_intercaladas) : null,
      valor_chaves: form.valor_chaves ? Number(form.valor_chaves) : null,
      forma_pagamento: form.forma_pagamento,
      comissao: form.comissao ? Number(form.comissao) : null,
      status_contrato: form.status_contrato,
      observacoes: form.observacoes,
    }).eq('id', params.id)

    if (err) { setError(err.message); setSaving(false); return }
    router.push('/admin/vendas')
  }

  if (!form) return <div style={{padding:'2rem',color:'#6b7280'}}>Carregando...</div>

  const S = { label: { display:'block', fontSize:'13px', fontWeight:'500', color:'#374151', marginBottom:'4px' } as React.CSSProperties }
  const inp = (name: string, type='text') => (
    <input name={name} type={type} value={form[name] ?? ''} onChange={handleChange}
      style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none'}} />
  )

  return (
    <div>
      <div style={{marginBottom:'1.5rem'}}>
        <h1 style={{fontSize:'1.5rem',fontWeight:'700',color:'#111'}}>Editar Venda</h1>
        <p style={{fontSize:'0.875rem',color:'#6b7280',marginTop:'0.25rem'}}>
          {(form.empreendimentos as any)?.nome} — Unidade {(form.unidades as any)?.unidade}
        </p>
      </div>

      {error && <div style={{background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'8px',padding:'12px',marginBottom:'16px',color:'#b91c1c',fontSize:'14px'}}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Comprador e Corretor</h2>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div><label style={S.label}>Nome do comprador</label>{inp('comprador_nome')}</div>
            <div><label style={S.label}>CPF/CNPJ</label>{inp('comprador_documento')}</div>
            <div><label style={S.label}>Corretor responsável</label>{inp('corretor_responsavel')}</div>
            <div><label style={S.label}>Data da venda</label>{inp('data_venda','date')}</div>
            <div><label style={S.label}>Comissão (R$)</label>{inp('comissao','number')}</div>
            <div>
              <label style={S.label}>Status do contrato</label>
              <select name="status_contrato" value={form.status_contrato ?? ''} onChange={handleChange}
                style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',background:'white'}}>
                <option value="aguardando_contrato">Aguardando contrato</option>
                <option value="contrato_enviado">Contrato enviado</option>
                <option value="contrato_assinado">Contrato assinado</option>
                <option value="distrato">Distrato</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <h2 style={{fontSize:'15px',fontWeight:'600',color:'#111',marginBottom:'16px'}}>Valores</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
            <div><label style={S.label}>Valor da venda (R$)</label>{inp('valor_venda','number')}</div>
            <div><label style={S.label}>Valor do sinal (R$)</label>{inp('valor_sinal','number')}</div>
            <div><label style={S.label}>Valor das parcelas (R$)</label>{inp('valor_parcelas','number')}</div>
            <div><label style={S.label}>Valor intercaladas (R$)</label>{inp('valor_intercaladas','number')}</div>
            <div><label style={S.label}>Valor das chaves (R$)</label>{inp('valor_chaves','number')}</div>
            <div><label style={S.label}>Forma de pagamento</label>{inp('forma_pagamento')}</div>
          </div>
        </div>

        <div style={{background:'white',borderRadius:'12px',border:'1px solid #DDD9D3',padding:'24px',marginBottom:'16px'}}>
          <label style={S.label}>Observações</label>
          <textarea name="observacoes" value={form.observacoes ?? ''} onChange={handleChange} rows={3}
            style={{width:'100%',padding:'8px 12px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',outline:'none',resize:'vertical'}} />
        </div>

        <div style={{display:'flex',gap:'12px',justifyContent:'flex-end'}}>
          <button type="button" onClick={() => router.back()}
            style={{padding:'10px 20px',border:'1px solid #DDD9D3',borderRadius:'8px',fontSize:'14px',background:'white',cursor:'pointer',color:'#374151'}}>
            Cancelar
          </button>
          <button type="submit" disabled={saving}
            style={{padding:'10px 20px',background:'#E8390E',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:'pointer'}}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}
