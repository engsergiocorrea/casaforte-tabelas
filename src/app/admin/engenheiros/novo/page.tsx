'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NovoEngenheiroPage() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cargo: '',
    registro_profissional: '', tipo_registro: 'CREA', uf_registro: '', cpf: '',
    observacoes: '', ativo: true,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome) { setError('Nome é obrigatório'); return }
    setSaving(true)
    setError('')
    const { error: err } = await createClient().from('engenheiros').insert([form])
    if (err) { setError(err.message); setSaving(false); return }
    window.location.href = '/admin/engenheiros'
  }

  const inp = (name: string, type = 'text') => (
    <input name={name} type={type} value={(form as any)[name]} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
  )
  const lbl = (text: string) => (
    <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>
  )

  if (success) return (
    <div style={{ padding: '2rem', color: '#15803d', fontSize: '16px' }}>✅ Engenheiro salvo!</div>
  )

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/engenheiros" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Engenheiros</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Novo Engenheiro</h1>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Dados pessoais</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>{lbl('Nome completo *')}{inp('nome')}</div>
            <div>{lbl('E-mail')}{inp('email', 'email')}</div>
            <div>{lbl('Telefone')}{inp('telefone', 'tel')}</div>
            <div>{lbl('CPF')}{inp('cpf')}</div>
            <div>{lbl('Cargo')}{inp('cargo')}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Registro profissional</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>
              {lbl('Tipo')}
              <select name="tipo_registro" value={form.tipo_registro} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="CREA">CREA</option>
                <option value="CAU">CAU</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>{lbl('Número')}{inp('registro_profissional')}</div>
            <div>{lbl('UF')}{inp('uf_registro')}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '14px' }}>
            {lbl('Observações')}
            <textarea name="observacoes" value={form.observacoes} onChange={handleChange} rows={3}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
            <input type="checkbox" name="ativo" checked={form.ativo} onChange={handleChange}
              style={{ width: '16px', height: '16px', accentColor: '#E8390E' }} />
            Engenheiro ativo
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Salvando...' : 'Salvar engenheiro'}
          </button>
          <button type="button" onClick={() => window.location.href = '/admin/engenheiros'}
            style={{ padding: '10px 24px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
