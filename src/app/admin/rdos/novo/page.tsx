'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface MaoObra { funcao: string; quantidade: number }
interface Atividade { descricao: string; percentual: number; status: string }

export default function NovoRDOPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const obraIdParam = searchParams.get('obra') ?? ''

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [obras, setObras] = useState<any[]>([])
  const [engenheiros, setEngenheiros] = useState<any[]>([])
  const [obraSelecionada, setObraSelecionada] = useState<any>(null)
  const [maoObra, setMaoObra] = useState<MaoObra[]>([{ funcao: '', quantidade: 1 }])
  const [atividades, setAtividades] = useState<Atividade[]>([{ descricao: '', percentual: 0, status: 'em_andamento' }])
  const [imagens, setImagens] = useState<File[]>([])
  const [uploadando, setUploadando] = useState(false)

  const [form, setForm] = useState({
    obra_id: obraIdParam,
    engenheiro_id: '',
    data_relatorio: new Date().toISOString().split('T')[0],
    clima_manha: '',
    clima_tarde: '',
    observacoes_clima: '',
    comentarios: '',
    prazo_contratual_dias: '',
    prazo_decorrido_dias: '',
    prazo_a_vencer_dias: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('obras').select('*, engenheiros(id, nome)').eq('ativo', true).order('nome')
      .then(({ data }) => {
        setObras(data ?? [])
        if (obraIdParam) {
          const obra = data?.find(o => o.id === obraIdParam)
          if (obra) carregarObra(obra)
        }
      })
    supabase.from('engenheiros').select('id, nome').eq('ativo', true).order('nome')
      .then(({ data }) => setEngenheiros(data ?? []))
  }, [])

  function carregarObra(obra: any) {
    setObraSelecionada(obra)
    const dataRelatorio = form.data_relatorio || new Date().toISOString().split('T')[0]
    let decorrido = ''
    let aVencer = ''
    if (obra.data_inicio) {
      const inicio = new Date(obra.data_inicio)
      const hoje = new Date(dataRelatorio)
      const diff = Math.floor((hoje.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24))
      decorrido = String(diff)
      if (obra.prazo_contratual_dias) {
        aVencer = String(obra.prazo_contratual_dias - diff)
      }
    }
    setForm(f => ({
      ...f,
      obra_id: obra.id,
      engenheiro_id: obra.engenheiros?.id ?? f.engenheiro_id,
      prazo_contratual_dias: obra.prazo_contratual_dias ? String(obra.prazo_contratual_dias) : '',
      prazo_decorrido_dias: decorrido,
      prazo_a_vencer_dias: aVencer,
    }))
  }

  function handleObraChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const obra = obras.find(o => o.id === e.target.value)
    if (obra) carregarObra(obra)
    else setForm(f => ({ ...f, obra_id: '' }))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
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
  function removeImagem(i: number) { setImagens(prev => prev.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent, status = 'rascunho') {
    e.preventDefault()
    if (!form.obra_id) { setError('Selecione uma obra'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    // Busca próximo número
    const { data: ultimoRdo } = await supabase.from('relatorios').select('numero').eq('tipo', 'rdo').order('numero', { ascending: false }).limit(1).single()
    const numero = (ultimoRdo?.numero ?? 0) + 1

    // Snapshot da obra
    const obra = obraSelecionada ?? obras.find(o => o.id === form.obra_id)
    const totalMaoObra = maoObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)

    const payload = {
      tipo: 'rdo',
      numero,
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
      obra_nome_snapshot: obra?.nome ?? '',
      obra_local_snapshot: [obra?.endereco, obra?.cidade, obra?.estado].filter(Boolean).join(', '),
      contratante_snapshot: obra?.contratante_nome ?? '',
    }

    const { data: rdo, error: err } = await supabase.from('relatorios').insert([payload]).select().single()
    if (err) { setError(err.message); setSaving(false); return }

    // Mão de obra
    const maoObraValida = maoObra.filter(m => m.funcao)
    if (maoObraValida.length > 0) {
      await supabase.from('relatorio_mao_obra').insert(maoObraValida.map(m => ({ relatorio_id: rdo.id, funcao: m.funcao, quantidade: Number(m.quantidade) })))
    }

    // Atividades
    const atividadesValidas = atividades.filter(a => a.descricao)
    if (atividadesValidas.length > 0) {
      await supabase.from('relatorio_atividades').insert(atividadesValidas.map(a => ({ relatorio_id: rdo.id, descricao: a.descricao, percentual: Number(a.percentual), status: a.status })))
    }

    // Upload de imagens
    if (imagens.length > 0) {
      setUploadando(true)
      for (let i = 0; i < imagens.length; i++) {
        const file = imagens[i]
        const ext = file.name.split('.').pop()
        const path = `rdos/${rdo.id}/${Date.now()}_${i}.${ext}`
        const { data: upload } = await supabase.storage.from('relatorios-imagens').upload(path, file)
        if (upload) {
          const { data: urlData } = supabase.storage.from('relatorios-imagens').getPublicUrl(path)
          await supabase.from('relatorio_imagens').insert({ relatorio_id: rdo.id, url: urlData.publicUrl, path, ordem: i })
        }
      }
      setUploadando(false)
    }

    // Histórico
    await supabase.from('relatorio_historico').insert({ relatorio_id: rdo.id, acao: status === 'rascunho' ? 'criacao' : 'enviado_para_aprovacao', observacao: 'RDO criado' })

    router.push('/admin/rdos/' + rdo.id)
  }

  const lbl = (text: string) => <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>
  const inp = (name: string, type = 'text') => (
    <input name={name} type={type} value={(form as any)[name] ?? ''} onChange={handleChange}
      style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
  )

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/admin/rdos" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← RDOs</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Novo RDO</h1>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={e => handleSubmit(e, 'rascunho')}>

        {/* Identificação */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Identificação</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ gridColumn: '1/-1' }}>
              {lbl('Obra *')}
              <select name="obra_id" value={form.obra_id} onChange={handleObraChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione uma obra</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            {obraSelecionada && (
              <div style={{ gridColumn: '1/-1', padding: '12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
                <strong>Contratante:</strong> {obraSelecionada.contratante_nome ?? '—'} &nbsp;|&nbsp;
                <strong>Local:</strong> {[obraSelecionada.endereco, obraSelecionada.cidade, obraSelecionada.estado].filter(Boolean).join(', ') || '—'}
              </div>
            )}
            <div>{lbl('Data do relatório *')}{inp('data_relatorio', 'date')}</div>
            <div>
              {lbl('Engenheiro responsável')}
              <select name="engenheiro_id" value={form.engenheiro_id} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }}>
                <option value="">Selecione</option>
                {engenheiros.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Prazos */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div>{lbl('Prazo contratual (dias)')}{inp('prazo_contratual_dias', 'number')}</div>
            <div>{lbl('Prazo decorrido (dias)')}{inp('prazo_decorrido_dias', 'number')}</div>
            <div>{lbl('Prazo a vencer (dias)')}{inp('prazo_a_vencer_dias', 'number')}</div>
          </div>
        </div>

        {/* Clima */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Condição climática</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              {lbl('Manhã')}
              <select name="clima_manha" value={form.clima_manha} onChange={handleChange}
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
              <select name="clima_tarde" value={form.clima_tarde} onChange={handleChange}
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
              <textarea name="observacoes_clima" value={form.observacoes_clima} onChange={handleChange} rows={2}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
            </div>
          </div>
        </div>

        {/* Mão de obra */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Mão de obra</h2>
            <button type="button" onClick={addMaoObra}
              style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
              + Adicionar
            </button>
          </div>
          {maoObra.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input placeholder="Função (ex: Pedreiro, Eletricista...)" value={m.funcao}
                onChange={e => handleMaoObraChange(i, 'funcao', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              <input type="number" placeholder="Qtd" value={m.quantidade} min={1}
                onChange={e => handleMaoObraChange(i, 'quantidade', Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
              <button type="button" onClick={() => removeMaoObra(i)}
                style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          ))}
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
            Total: <strong>{maoObra.reduce((a, m) => a + (Number(m.quantidade) || 0), 0)}</strong> trabalhadores
          </div>
        </div>

        {/* Atividades */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Atividades</h2>
            <button type="button" onClick={addAtividade}
              style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
              + Adicionar
            </button>
          </div>
          {atividades.map((a, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input placeholder="Descrição da atividade" value={a.descricao}
                onChange={e => handleAtividadeChange(i, 'descricao', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              <input type="number" placeholder="%" value={a.percentual} min={0} max={100}
                onChange={e => handleAtividadeChange(i, 'percentual', Number(e.target.value))}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', textAlign: 'center' }} />
              <select value={a.status} onChange={e => handleAtividadeChange(i, 'status', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                <option value="nao_iniciada">Não iniciada</option>
                <option value="em_andamento">Em andamento</option>
                <option value="concluida">Concluída</option>
                <option value="paralisada">Paralisada</option>
              </select>
              <button type="button" onClick={() => removeAtividade(i)}
                style={{ padding: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#b91c1c', cursor: 'pointer', fontSize: '14px' }}>×</button>
            </div>
          ))}
        </div>

        {/* Comentários */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Comentários</h2>
          <textarea name="comentarios" value={form.comentarios} onChange={handleChange} rows={4}
            placeholder="Observações gerais, ocorrências, anotações..."
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
        </div>

        {/* Fotos */}
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Fotos</h2>
          <input type="file" accept="image/*" multiple onChange={handleImagemChange}
            style={{ marginBottom: '12px' }} />
          {imagens.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
              {imagens.map((img, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <img src={URL.createObjectURL(img)} alt="" style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
                  <button type="button" onClick={() => removeImagem(i)}
                    style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botões */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="submit" disabled={saving || uploadando}
            style={{ padding: '10px 24px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Salvando...' : '💾 Salvar rascunho'}
          </button>
          <button type="button" disabled={saving || uploadando} onClick={e => handleSubmit(e as any, 'enviado_para_aprovacao')}
            style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
            {saving ? 'Enviando...' : '📤 Enviar para aprovação'}
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
