'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface MaoObra { id?: string; funcao: string; quantidade: number }
interface Atividade { id?: string; descricao: string; percentual: number; status: string }

export default function EditarRDOPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [obras, setObras] = useState<any[]>([])
  const [engenheiros, setEngenheiros] = useState<any[]>([])
  const [obraSelecionada, setObraSelecionada] = useState<any>(null)
  const [maoObra, setMaoObra] = useState<MaoObra[]>([])
  const [atividades, setAtividades] = useState<Atividade[]>([])
  const [imagens, setImagens] = useState<File[]>([])
  const [imagensExistentes, setImagensExistentes] = useState<any[]>([])

  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('*, engenheiros(id, nome)').eq('ativo', true).order('nome')
      .then(({ data }) => setObras(data ?? []))
    supabase.from('engenheiros').select('id, nome').eq('ativo', true).order('nome')
      .then(({ data }) => setEngenheiros(data ?? []))
    supabase.from('relatorios').select('*').eq('id', id).single()
      .then(({ data }) => { if (data) setForm(data) })
    supabase.from('relatorio_mao_obra').select('*').eq('relatorio_id', id)
      .then(({ data }) => setMaoObra(data?.length ? data : [{ funcao: '', quantidade: 1 }]))
    supabase.from('relatorio_atividades').select('*').eq('relatorio_id', id)
      .then(({ data }) => setAtividades(data?.length ? data : [{ descricao: '', percentual: 0, status: 'em_andamento' }]))
    supabase.from('relatorio_imagens').select('*').eq('relatorio_id', id).order('ordem')
      .then(({ data }) => setImagensExistentes(data ?? []))
  }, [id])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm((f: any) => ({ ...f, [name]: value }))
  }

  function handleMaoObraChange(i: number, field: string, value: any) {
    setMaoObra(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }
  function addMaoObra() { setMaoObra(prev => [...prev, { funcao: '', quantidade: 1 }]) }
  function removeMaoObra(i: number) { setMaoObra(prev => prev.filter((_, idx) => idx !== i)) }

  function handleAtividadeChange(i: number, field: string, value: any) {
    setAtividades(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a))
  }
  function addAtividade() { setAtividades(prev => [...prev, { descricao: '', percentual: 0, status: 'em_andamento' }]) }
  function removeAtividade(i: number) { setAtividades(prev => prev.filter((_, idx) => idx !== i)) }

  function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setImagens(prev => [...prev, ...Array.from(e.target.files!)])
  }

  async function removerImagemExistente(imgId: string, path: string) {
    const supabase = createClient()
    await supabase.storage.from('relatorios-imagens').remove([path])
    await supabase.from('relatorio_imagens').delete().eq('id', imgId)
    setImagensExistentes(prev => prev.filter(i => i.id !== imgId))
  }

  async function handleSubmit(e: React.FormEvent, status: string) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()

    const totalMaoObra = maoObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)

    const payload = {
      ...form,
      status,
      obra_id: form.obra_id,
      engenheiro_id: form.engenheiro_id || null,
      data_relatorio: form.data_relatorio,
      clima_manha: form.clima_manha,
      clima_tarde: form.clima_tarde,
      observacoes_clima: form.observacoes_clima,
      comentarios: form.comentarios,
      prazo_contratual_dias: form.prazo_contratual_dias ? Number(form.prazo_contratual_dias) : null,
      prazo_decorrido_dias: form.prazo_decorrido_dias ? Number(form.prazo_decorrido_dias) : null,
      prazo_a_vencer_dias: form.prazo_a_vencer_dias ? Number(form.prazo_a_vencer_dias) : null,
      total_mao_obra_direta: totalMaoObra,
      updated_at: new Date().toISOString(),
    }

    const { error: err } = await supabase.from('relatorios').update(payload).eq('id', id)
    if (err) { setError(err.message); setSaving(false); return }

    // Atualiza mão de obra
    await supabase.from('relatorio_mao_obra').delete().eq('relatorio_id', id)
    const maoObraValida = maoObra.filter(m => m.funcao)
    if (maoObraValida.length > 0) {
      await supabase.from('relatorio_mao_obra').insert(maoObraValida.map(m => ({ relatorio_id: id, funcao: m.funcao, quantidade: Number(m.quantidade) })))
    }

    // Atualiza atividades
    await supabase.from('relatorio_atividades').delete().eq('relatorio_id', id)
    const atividadesValidas = atividades.filter(a => a.descricao)
    if (atividadesValidas.length > 0) {
      await supabase.from('relatorio_atividades').insert(atividadesValidas.map(a => ({ relatorio_id: id, descricao: a.descricao, percentual: Number(a.percentual), status: a.status })))
    }

    // Upload novas imagens
    if (imagens.length > 0) {
      for (let i = 0; i < imagens.length; i++) {
        const file = imagens[i]
        const ext = file.name.split('.').pop()
        const path = 'rdos/' + id + '/' + Date.now() + '_' + i + '.' + ext
        const { data: upload } = await supabase.storage.from('relatorios-imagens').upload(path, file)
        if (upload) {
          const { data: urlData } = supabase.storage.from('relatorios-imagens').getPublicUrl(path)
          await supabase.from('relatorio_imagens').insert({ relatorio_id: id, url: urlData.publicUrl, path, ordem: imagensExistentes.length + i })
        }
      }
    }

    // Histórico
    await supabase.from('relatorio_historico').insert({ relatorio_id: id, acao: status === 'rascunho' ? 'edicao' : 'enviado_para_aprovacao', observacao: 'RDO atualizado' })

    router.push('/admin/rdos/' + id)
  }

  if (!form) return <div style={{ padding: '2rem', color: '#6b7280' }}>Carregando...</div>

  const lbl = (text: string) => <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>
  const inp = (name: string, type = 'text') => (
    <input name={name} type={type} value={form[name] ?? ''} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
  )

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href={'/admin/rdos/' + id} style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Editar RDO #{form.numero}</h1>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={e => handleSubmit(e, 'rascunho')}>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Identificação</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              {lbl('Obra')}
              <select name="obra_id" value={form.obra_id ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>{lbl('Data do relatório')}{inp('data_relatorio', 'date')}</div>
            <div>
              {lbl('Engenheiro responsável')}
              <select name="engenheiro_id" value={form.engenheiro_id ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                {engenheiros.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>{lbl('Contratual (dias)')}{inp('prazo_contratual_dias', 'number')}</div>
            <div>{lbl('Decorrido (dias)')}{inp('prazo_decorrido_dias', 'number')}</div>
            <div>{lbl('A vencer (dias)')}{inp('prazo_a_vencer_dias', 'number')}</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Condição climática</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              {lbl('Manhã')}
              <select name="clima_manha" value={form.clima_manha ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                <option value="sol">☀️ Sol</option>
                <option value="nublado">⛅ Nublado</option>
                <option value="chuva_fraca">🌦️ Chuva fraca</option>
                <option value="chuva_forte">⛈️ Chuva forte</option>
                <option value="vento">💨 Vento</option>
              </select>
            </div>
            <div>
              {lbl('Tarde')}
              <select name="clima_tarde" value={form.clima_tarde ?? ''} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                <option value="sol">☀️ Sol</option>
                <option value="nublado">⛅ Nublado</option>
                <option value="chuva_fraca">🌦️ Chuva fraca</option>
                <option value="chuva_forte">⛈️ Chuva forte</option>
                <option value="vento">💨 Vento</option>
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              {lbl('Observações sobre o clima')}
              <textarea name="observacoes_clima" value={form.observacoes_clima ?? ''} onChange={handleChange} rows={2}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Mão de obra</h2>
            <button type="button" onClick={addMaoObra} style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Adicionar</button>
          </div>
          {maoObra.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input placeholder="Função" value={m.funcao} onChange={e => handleMaoObraChange(i, 'funcao', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              <input type="number" placeholder="Qtd" value={m.quantidade} min={1} onChange={e => handleMaoObraChange(i, 'quantidade', Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
              <button type="button" onClick={() => removeMaoObra(i)} style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Atividades</h2>
            <button type="button" onClick={addAtividade} style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Adicionar</button>
          </div>
          {atividades.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input placeholder="Descrição" value={a.descricao} onChange={e => handleAtividadeChange(i, 'descricao', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              <input type="number" placeholder="%" value={a.percentual} min={0} max={100} onChange={e => handleAtividadeChange(i, 'percentual', Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
              <select value={a.status} onChange={e => handleAtividadeChange(i, 'status', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="nao_iniciada">Não iniciada</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="paralisada">Paralisada</option>
              </select>
              <button type="button" onClick={() => removeAtividade(i)} style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Comentários</h2>
          <textarea name="comentarios" value={form.comentarios ?? ''} onChange={handleChange} rows={4}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Fotos</h2>
          {imagensExistentes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {imagensExistentes.map(img => (
                <div key={img.id} style={{ position: 'relative' }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  <button type="button" onClick={() => removerImagemExistente(img.id, img.path)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px' }}>×</button>
                </div>
              ))}
            </div>
          )}
          <input type="file" accept="image/*" multiple onChange={handleImagemChange} style={{ marginBottom: '8px' }} />
          {imagens.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
              {imagens.map((img, i) => (
                <img key={i} src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving}
            style={{ padding: '10px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Salvando...' : '💾 Salvar rascunho'}
          </button>
          <button type="button" disabled={saving} onClick={e => handleSubmit(e as any, 'enviado_para_aprovacao')}
            style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            📤 Enviar para aprovação
          </button>
          <button type="button" onClick={() => router.back()}
            style={{ padding: '10px 24px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
