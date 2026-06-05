'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function EditarObraPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<any>(null)
  const [engenheiros, setEngenheiros] = useState<any[]>([])
  const [empreendimentos, setEmpreendimentos] = useState<any[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('*').eq('id', id).single().then(({ data }) => setForm(data))
    supabase.from('engenheiros').select('id, nome').eq('ativo', true).order('nome').then(({ data }) => setEngenheiros(data ?? []))
    supabase.from('empreendimentos').select('id, nome').order('nome').then(({ data }) => setEmpreendimentos(data ?? []))
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
    const payload = {
      ...form,
      empreendimento_id: form.empreendimento_id || null,
      responsavel_tecnico_id: form.responsavel_tecnico_id || null,
      prazo_contratual_dias: form.prazo_contratual_dias ? Number(form.prazo_contratual_dias) : null,
      data_inicio: form.data_inicio || null,
      data_prevista_conclusao: form.data_prevista_conclusao || null,
    }
    const { error: err } = await createClient().from('obras').update(payload).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }
    router.push('/admin/obras/' + id)
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
        <Link href={'/admin/obras/' + id} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Editar Obra</h1>
      </div>
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Identificação</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>{lbl('Nome da obra *')}{inp('nome')}</div>
            <div>{lbl('Tipo')}{inp('tipo')}</div>
            <div>
              {lbl('Status')}
              <select name="status" value={form.status ?? 'planejamento'} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="planejamento">Planejamento</option>
                <option value="em_andamento">Em andamento</option>
                <option value="paralisada">Paralisada</option>
                <option value="concluida">Concluída</option>
                <option value="entregue">Entregue</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              {lbl('Empreendimento vinculado')}
              <select name="empreendimento_id" value={form.empreendimento_id ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Nenhum</option>
                {empreendimentos.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Localização</h2>
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
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Contratante</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>{lbl('Nome do contratante')}{inp('contratante_nome')}</div>
            <div>{lbl('CPF / CNPJ')}{inp('contratante_cpf_cnpj')}</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>{lbl('Data de início')}{inp('data_inicio', 'date')}</div>
            <div>{lbl('Prazo contratual (dias)')}{inp('prazo_contratual_dias', 'number')}</div>
            <div>{lbl('Previsão de conclusão')}{inp('data_prevista_conclusao', 'date')}</div>
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Responsável técnico</h2>
          <select name="responsavel_tecnico_id" value={form.responsavel_tecnico_id ?? ''} onChange={handleChange}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
            <option value="">Selecione um engenheiro</option>
            {engenheiros.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
          </select>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Observações</h2>
          <textarea name="observacoes" value={form.observacoes ?? ''} onChange={handleChange} rows={3}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
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
