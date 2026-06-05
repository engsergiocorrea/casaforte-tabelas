'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    createClient().from('clientes').select('*').eq('id', id).single()
      .then(({ data }) => setForm(data))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm((f: any) => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError('')
    const { error: err } = await createClient().from('clientes').update(form).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/admin/clientes/' + id)
  }

  if (!form) return <div style={{ padding: '2rem', color: '#6b7280' }}>Carregando...</div>

  const inp = (name: string, type = 'text') => (
    <input name={name} type={type} value={form[name] ?? ''} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
  )
  const lbl = (text: string) => <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>
  const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={'/admin/clientes/' + id} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Editar Cliente</h1>
      </div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Dados do cliente</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>{lbl('Nome completo *')}{inp('nome')}</div>
            <div>{lbl('E-mail')}{inp('email', 'email')}</div>
            <div>{lbl('Telefone')}{inp('telefone', 'tel')}</div>
            <div>{lbl('CPF / CNPJ')}{inp('cpf_cnpj')}</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Endereço</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>{lbl('Endereço')}{inp('endereco')}</div>
            <div>{lbl('Cidade')}{inp('cidade')}</div>
            <div>
              {lbl('Estado')}
              <select name="estado" value={form.estado ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            {lbl('Observações')}
            <textarea name="observacoes" value={form.observacoes ?? ''} onChange={handleChange} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" name="ativo" checked={form.ativo ?? true} onChange={handleChange} style={{ width: '16px', height: '16px', accentColor: '#E8390E' }} />
            Cliente ativo
          </label>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
          <button type="button" onClick={() => router.back()} style={{ padding: '10px 24px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
