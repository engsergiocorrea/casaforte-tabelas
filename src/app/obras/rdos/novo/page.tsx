'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { compressImage } from '@/lib/compress-image'

interface MaoObra { funcao: string; quantidade: number }
interface Atividade { descricao: string; percentual: number; status: string }

export default function ObrasNovoRDOPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [engenheiro, setEngenheiro] = useState<any>(null)
  const [obras, setObras] = useState<any[]>([])
  const [obraSelecionada, setObraSelecionada] = useState<any>(null)
  const [maoObra, setMaoObra] = useState<MaoObra[]>([{ funcao: '', quantidade: 1 }])
  const [atividades, setAtividades] = useState<Atividade[]>([{ descricao: '', percentual: 0, status: 'em_andamento' }])
  const [imagens, setImagens] = useState<File[]>([])
  const [form, setForm] = useState({
    obra_id: '', data_relatorio: new Date().toISOString().split('T')[0],
    clima_manha: '', clima_tarde: '', observacoes_clima: '', comentarios: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/obras/login'); return }
      const { data: eng } = await supabase.from('engenheiros').select('*').eq('usuario_id', session.user.id).single()
      if (!eng) { router.push('/obras'); return }
      setEngenheiro(eng)
      const { data: obrasData } = await supabase.from('obras').select('id, nome, data_inicio, data_prevista_conclusao, prazo_contratual_dias').eq('ativo', true).order('nome')
      setObras(obrasData ?? [])
    })
  }, [])

  function handleObraChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const obra = obras.find(o => o.id === e.target.value)
    setObraSelecionada(obra ?? null)
    setForm(f => ({ ...f, obra_id: e.target.value }))
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

  async function handleImagemChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    const compressed = await Promise.all(files.map(f => compressImage(f)))
    setImagens(prev => [...prev, ...compressed])
  }

  function calcDias() {
    const hoje = new Date()
    const decorrido = obraSelecionada?.data_inicio
      ? Math.floor((hoje.getTime() - new Date(obraSelecionada.data_inicio).getTime()) / (1000 * 60 * 60 * 24))
      : null
    const aVencer = obraSelecionada?.data_prevista_conclusao
      ? Math.floor((new Date(obraSelecionada.data_prevista_conclusao).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      : null
    return { decorrido, aVencer }
  }

  async function handleSubmit(e: React.FormEvent, status = 'rascunho') {
    e.preventDefault()
    if (!form.obra_id) { setError('Selecione uma obra'); return }
    setSaving(true)
    setError('')
    const supabase = createClient()

    const { data: ultimoRdo } = await supabase.from('relatorios').select('numero').eq('tipo', 'rdo').order('numero', { ascending: false }).limit(1).single()
    const numero = (ultimoRdo?.numero ?? 0) + 1
    const totalMaoObra = maoObra.reduce((acc, m) => acc + (Number(m.quantidade) || 0), 0)
    const { decorrido, aVencer } = calcDias()

    const payload = {
      tipo: 'rdo', numero, status,
      obra_id: form.obra_id,
      engenheiro_id: engenheiro.id,
      data_relatorio: form.data_relatorio,
      clima_manha: form.clima_manha,
      clima_tarde: form.clima_tarde,
      observacoes_clima: form.observacoes_clima,
      comentarios: form.comentarios,
      prazo_contratual_dias: obraSelecionada?.prazo_contratual_dias ?? null,
      prazo_decorrido_dias: decorrido,
      prazo_a_vencer_dias: aVencer,
      total_mao_obra_direta: totalMaoObra,
    }

    const { data: rdo, error: err } = await supabase.from('relatorios').insert([payload]).select().single()
    if (err) { setError(err.message); setSaving(false); return }

    const maoObraValida = maoObra.filter(m => m.funcao)
    if (maoObraValida.length > 0) {
      await supabase.from('relatorio_mao_obra').insert(maoObraValida.map(m => ({ relatorio_id: rdo.id, funcao: m.funcao, quantidade: Number(m.quantidade) })))
    }

    const atividadesValidas = atividades.filter(a => a.descricao)
    if (atividadesValidas.length > 0) {
      await supabase.from('relatorio_atividades').insert(atividadesValidas.map(a => ({ relatorio_id: rdo.id, descricao: a.descricao, percentual: Number(a.percentual), status: a.status })))
    }

    if (imagens.length > 0) {
      for (let i = 0; i < imagens.length; i++) {
        const file = imagens[i]
        const path = 'rdos/' + rdo.id + '/' + Date.now() + '_' + i + '.jpg'
        const { data: upload } = await supabase.storage.from('relatorios-imagens').upload(path, file)
        if (upload) {
          const { data: urlData } = supabase.storage.from('relatorios-imagens').getPublicUrl(path)
          await supabase.from('relatorio_imagens').insert({ relatorio_id: rdo.id, url: urlData.publicUrl, path, ordem: i })
        }
      }
    }

    await supabase.from('relatorio_historico').insert({ relatorio_id: rdo.id, acao: status === 'rascunho' ? 'criacao' : 'enviado_para_aprovacao', observacao: 'RDO criado pelo engenheiro' })

    window.location.href = '/obras'
  }

  const lbl = (text: string) => <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>{text}</label>

  if (!engenheiro) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Carregando...</div>

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/obras" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Voltar</Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>Novo RDO</h1>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#b91c1c', fontSize: '14px' }}>{error}</div>}

      <form onSubmit={e => handleSubmit(e, 'rascunho')}>
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
            <div>
              {lbl('Data do relatório *')}
              <input name="data_relatorio" type="date" value={form.data_relatorio} onChange={handleChange}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' as const }} />
            </div>
            <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#374151' }}>
              👷 <strong>{engenheiro.nome}</strong>
            </div>
          </div>
        </div>

        {obraSelecionada && (
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Data de início</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>
                  {obraSelecionada.data_inicio ? new Date(obraSelecionada.data_inicio).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Data de entrega</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#111' }}>
                  {obraSelecionada.data_prevista_conclusao ? new Date(obraSelecionada.data_prevista_conclusao).toLocaleDateString('pt-BR') : '—'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '4px' }}>Dias até a entrega</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: (() => {
                  if (!obraSelecionada.data_prevista_conclusao) return '#111'
                  const diff = Math.floor((new Date(obraSelecionada.data_prevista_conclusao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return diff < 0 ? '#b91c1c' : diff < 30 ? '#b45309' : '#15803d'
                })() }}>
                  {(() => {
                    if (!obraSelecionada.data_prevista_conclusao) return '—'
                    const diff = Math.floor((new Date(obraSelecionada.data_prevista_conclusao).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    return diff < 0 ? `${Math.abs(diff)} dias em atraso` : `${diff} dias`
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

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

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '700' }}>Mão de obra</h2>
            <button type="button" onClick={addMaoObra} style={{ padding: '4px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>+ Adicionar</button>
          </div>
          {maoObra.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 40px', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input placeholder="Função" value={m.funcao} onChange={e => handleMaoObraChange(i, 'funcao', e.target.value)}
                style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
              <input type="number" value={m.quantidade} min={1} onChange={e => handleMaoObraChange(i, 'quantidade', Number(e.target.value))}
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
          <textarea name="comentarios" value={form.comentarios} onChange={handleChange} rows={4}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' as const }} />
        </div>

        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Fotos</h2>
          <input type="file" accept="image/*" multiple onChange={handleImagemChange} />
          {imagens.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
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
          <button type="button" onClick={() => window.location.href = '/obras'}
            style={{ padding: '10px 24px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
