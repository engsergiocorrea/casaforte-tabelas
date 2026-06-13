'use client'
import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ReajustePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [empreendimento, setEmpreendimento] = useState<any>(null)
  const [unidades, setUnidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aplicando, setAplicando] = useState(false)

  const [filtros, setFiltros] = useState({
    status: 'disponivel',
    pavimento: '',
    posicao: '',
  })
  const [percentual, setPercentual] = useState('')
  const [motivo, setMotivo] = useState('')
  const [preview, setPreview] = useState<any[]>([])
  const [mostrarPreview, setMostrarPreview] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('empreendimentos').select('*').eq('id', id).single()
      .then(({ data }) => setEmpreendimento(data))
    supabase.from('unidades').select('*').eq('empreendimento_id', id)
      .order('pavimento').order('unidade')
      .then(({ data }) => { setUnidades(data ?? []); setLoading(false) })
  }, [id])

  const pavimentos = [...new Set(unidades.map(u => u.pavimento).filter(Boolean))].sort()
  const posicoes = [...new Set(unidades.map(u => u.posicao).filter(Boolean))].sort()

  function unidadesFiltradas() {
    return unidades.filter(u => {
      if (filtros.status && u.status !== filtros.status) return false
      if (filtros.pavimento && u.pavimento !== filtros.pavimento) return false
      if (filtros.posicao && u.posicao !== filtros.posicao) return false
      return true
    })
  }

  function gerarPreview() {
    if (!percentual || Number(percentual) === 0) return
    const perc = Number(percentual) / 100
    const emp = empreendimento

    const prev = unidadesFiltradas().map(u => {
      const novoPrecoM2 = u.preco_m2_construido ? Math.round(u.preco_m2_construido * (1 + perc) * 100) / 100 : null
      const novoPrecoM2Ext = u.preco_m2_externo ? Math.round(u.preco_m2_externo * (1 + perc) * 100) / 100 : null

      let novoValor = u.valor_imovel
      if (novoPrecoM2 && u.area_construida) {
        novoValor = Number(u.area_construida) * novoPrecoM2
        if (emp?.considerar_area_externa_no_calculo && u.area_privativa_externa && novoPrecoM2Ext) {
          novoValor += Number(u.area_privativa_externa) * novoPrecoM2Ext
        }
        novoValor = Math.round(novoValor * 100) / 100
      } else if (u.valor_imovel) {
        novoValor = Math.round(Number(u.valor_imovel) * (1 + perc) * 100) / 100
      }

      const diff = novoValor && u.valor_imovel ? novoValor - Number(u.valor_imovel) : null

      // Recalcula fluxo
      const percSinal = Number(emp?.percentual_sinal_padrao) || Number(u.percentual_sinal) || 0
      const percMensais = Number(emp?.percentual_mensais_padrao) || 0
      const percIntercaladas = Number(emp?.percentual_intercaladas_padrao) || 0
      const percChaves = Number(emp?.percentual_chaves_padrao) || Number(u.percentual_chaves) || 0
      const qtdMensais = Number(emp?.quantidade_mensais_padrao) || Number(u.quantidade_parcelas) || 0
      const qtdIntercaladas = Number(emp?.quantidade_intercaladas_padrao) || Number(u.quantidade_intercaladas) || 0

      return {
        ...u,
        novo_preco_m2: novoPrecoM2,
        novo_preco_m2_ext: novoPrecoM2Ext,
        novo_valor: novoValor,
        diff,
        novo_valor_sinal: novoValor && percSinal ? Math.round(novoValor * percSinal / 100 * 100) / 100 : u.valor_sinal,
        novo_valor_parcela: novoValor && percMensais && qtdMensais ? Math.round(novoValor * percMensais / 100 / qtdMensais * 100) / 100 : u.valor_parcela,
        novo_valor_intercalada: novoValor && percIntercaladas && qtdIntercaladas ? Math.round(novoValor * percIntercaladas / 100 / qtdIntercaladas * 100) / 100 : u.valor_intercalada,
        novo_valor_chaves: novoValor && percChaves ? Math.round(novoValor * percChaves / 100 * 100) / 100 : u.valor_chaves,
      }
    })
    setPreview(prev)
    setMostrarPreview(true)
  }

  async function aplicarReajuste() {
    if (!preview.length) return
    setAplicando(true)
    const supabase = createClient()

    for (const u of preview) {
      await supabase.from('unidades').update({
        preco_m2_construido: u.novo_preco_m2 ?? u.preco_m2_construido,
        preco_m2_externo: u.novo_preco_m2_ext ?? u.preco_m2_externo,
        valor_imovel: u.novo_valor,
        valor_sinal: u.novo_valor_sinal,
        valor_parcela: u.novo_valor_parcela,
        valor_intercalada: u.novo_valor_intercalada,
        valor_chaves: u.novo_valor_chaves,
      }).eq('id', u.id)
    }

    setAplicando(false)
    setMostrarPreview(false)
    alert(`Reajuste de ${percentual}% aplicado em ${preview.length} unidades!`)
    router.push(`/admin/empreendimentos/${id}/unidades`)
  }

  const fmt = (v: any) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
  const fmtPerc = (v: any) => v != null ? `${Number(v) > 0 ? '+' : ''}${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Carregando...</div>

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
          <Link href="/admin/empreendimentos" style={{ color: '#6b7280', textDecoration: 'none' }}>Empreendimentos</Link>
          {' → '}
          <Link href={`/admin/empreendimentos/${id}/unidades`} style={{ color: '#6b7280', textDecoration: 'none' }}>{empreendimento?.nome}</Link>
          {' → Reajuste'}
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>Reajuste de Valores</h1>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '4px' }}>
          Reajusta o preço/m² e recalcula automaticamente o valor e o fluxo de pagamento.
        </p>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '16px' }}>Filtros</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Status</label>
            <select value={filtros.status} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
              <option value="">Todos</option>
              <option value="disponivel">Disponível</option>
              <option value="reservada">Reservada</option>
              <option value="vendida">Vendida</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Pavimento</label>
            <select value={filtros.pavimento} onChange={e => setFiltros(f => ({ ...f, pavimento: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
              <option value="">Todos</option>
              {pavimentos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Posição</label>
            <select value={filtros.posicao} onChange={e => setFiltros(f => ({ ...f, posicao: e.target.value }))}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
              <option value="">Todas</option>
              {posicoes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#15803d' }}>
          {unidadesFiltradas().length} unidades selecionadas
        </div>
      </div>

      {/* Percentual */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '16px' }}>Percentual de reajuste</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>% de aumento</label>
            <input type="number" value={percentual} onChange={e => setPercentual(e.target.value)} placeholder="Ex: 3.5"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>Motivo (opcional)</label>
            <input type="text" value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex: Reajuste anual IGP-M"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginTop: '16px' }}>
          <button onClick={gerarPreview} disabled={!percentual || Number(percentual) === 0}
            style={{ padding: '10px 24px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', opacity: !percentual ? 0.5 : 1 }}>
            👁 Ver prévia do reajuste
          </button>
        </div>
      </div>

      {/* Preview */}
      {mostrarPreview && preview.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: '600', color: '#111' }}>
              Prévia — {preview.length} unidades serão reajustadas em {percentual}%
            </h2>
            <button onClick={aplicarReajuste} disabled={aplicando}
              style={{ padding: '10px 24px', background: '#E8390E', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              {aplicando ? 'Aplicando...' : '✅ Confirmar reajuste'}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  {['Unidade', 'Pavimento', 'Posição', 'Preço/m² atual', 'Novo preço/m²', 'Valor atual', 'Novo valor', 'Diferença'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: '#111' }}>{u.unidade}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{u.pavimento ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280', textTransform: 'capitalize' }}>{u.posicao?.replace('_', ' ') ?? '—'}</td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>
                      {u.preco_m2_construido ? `R$ ${Number(u.preco_m2_construido).toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#15803d', fontWeight: '600' }}>
                      {u.novo_preco_m2 ? `R$ ${Number(u.novo_preco_m2).toLocaleString('pt-BR')}` : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', color: '#6b7280' }}>{fmt(u.valor_imovel)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '700', color: '#111' }}>{fmt(u.novo_valor)}</td>
                    <td style={{ padding: '10px 12px', fontWeight: '600', color: u.diff && u.diff > 0 ? '#15803d' : '#b91c1c' }}>
                      {u.diff ? `+${fmt(u.diff)}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
