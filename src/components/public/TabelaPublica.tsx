'use client'
// src/components/public/TabelaPublica.tsx

import { useState, useMemo } from 'react'
import type {
  Empreendimento,
  Unidade,
  ConfiguracaoTabela,
  UnidadeStatus,
} from '@/types'
import {
  formatCurrency,
  formatArea,
  groupBy,
  cn,
  POSICAO_LABELS,
} from '@/lib/utils'
import { STATUS_LABELS } from '@/types'

interface Props {
  empreendimento: Empreendimento
  unidades: Unidade[]
  configuracao: ConfiguracaoTabela | null
}

const DEFAULT_COLUNAS = [
  'unidade', 'pavimento', 'area_construida',
  'quartos', 'posicao', 'valor_imovel', 'valor_sinal',
  'quantidade_parcelas', 'valor_parcela', 'valor_intercalada',
  'valor_chaves', 'status',
]

export function TabelaPublica({ empreendimento, unidades, configuracao }: Props) {
  const colunasVisiveis = configuracao?.colunas_visiveis ?? DEFAULT_COLUNAS
  const mostrarVendidas = configuracao?.mostrar_unidades_vendidas ?? true
  const mostrarValoresReservadas = configuracao?.mostrar_valores_reservadas ?? false
  const agruparPor = configuracao?.agrupar_por

  const [filtroStatus, setFiltroStatus] = useState<UnidadeStatus | 'todos'>('todos')
  const [filtroPavimento, setFiltroPavimento] = useState('todos')
  const [filtroBloco, setFiltroBloco] = useState('todos')
  const [filtroQuartos, setFiltroQuartos] = useState('todos')
  const [busca, setBusca] = useState('')

  const pavimentos = useMemo(() =>
    Array.from(new Set(unidades.map(u => u.pavimento).filter(Boolean))).sort(),
    [unidades]
  )
  const blocos = useMemo(() =>
    Array.from(new Set(unidades.map(u => u.bloco).filter(Boolean))).sort(),
    [unidades]
  )
  const quartosList = useMemo(() =>
    Array.from(new Set(unidades.map(u => u.quartos).filter(v => v != null))).sort((a, b) => a! - b!),
    [unidades]
  )

  const unidadesFiltradas = useMemo(() => {
    return unidades.filter(u => {
      if (!mostrarVendidas && u.status === 'vendida') return false
      if (u.status === 'bloqueada' || u.status === 'indisponivel') return false
      if (filtroStatus !== 'todos' && u.status !== filtroStatus) return false
      if (filtroPavimento !== 'todos' && u.pavimento !== filtroPavimento) return false
      if (filtroBloco !== 'todos' && u.bloco !== filtroBloco) return false
      if (filtroQuartos !== 'todos' && String(u.quartos) !== filtroQuartos) return false
      if (busca) {
        const b = busca.toLowerCase()
        return (
          u.unidade.toLowerCase().includes(b) ||
          u.bloco?.toLowerCase().includes(b) ||
          u.pavimento?.toLowerCase().includes(b)
        )
      }
      return true
    })
  }, [unidades, filtroStatus, filtroPavimento, filtroBloco, filtroQuartos, busca, mostrarVendidas])

  const ORDEM_PAVIMENTOS = [
    'Térreo',
    '1º Pavimento',
    '2º Pavimento',
    'Frente Mar - Térreo',
    'Frente Mar - 1º Pavimento',
    'Frente Mar - 2º Pavimento',
  ]

  const grupos = useMemo(() => {
    if (!agruparPor) return { 'Unidades': unidadesFiltradas }
    const agrupado = groupBy(unidadesFiltradas, agruparPor as keyof Unidade)
    const ordenado: Record<string, typeof unidadesFiltradas> = {}
    const chaves = Object.keys(agrupado)
    const ordenadas = chaves.sort((a, b) => {
      const ia = ORDEM_PAVIMENTOS.indexOf(a)
      const ib = ORDEM_PAVIMENTOS.indexOf(b)
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
    ordenadas.forEach(k => { ordenado[k] = agrupado[k] })
    return ordenado
  }, [unidadesFiltradas, agruparPor])

  const resumo = useMemo(() => ({
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
  }), [unidades])

  const fmtC = (v: any) => v ? Number(v).toLocaleString('pt-BR', {style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:2}) : '—'

  const thStyle = (align: 'left'|'right'|'center' = 'left'): React.CSSProperties => ({
    padding:'9px 12px',
    textAlign: align,
    fontSize:'10px',
    fontWeight:'700',
    color:'#6b7280',
    textTransform:'uppercase' as const,
    letterSpacing:'0.04em',
    whiteSpace:'nowrap' as const,
    background:'#f9fafb',
    borderBottom:'1px solid #e5e7eb',
  })

  const tdStyle = (align: 'left'|'right'|'center' = 'left'): React.CSSProperties => ({
    padding:'9px 12px',
    textAlign: align,
    borderBottom:'1px solid #f3f4f6',
    verticalAlign:'middle' as const,
    whiteSpace:'nowrap' as const,
  })

  return (
    <div style={{background:'white',borderRadius:'16px',border:'1px solid #e5e7eb',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'14px 20px',borderBottom:'1px solid #f3f4f6'}}>
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'12px',marginBottom:'12px'}}>
          <div>
            <h2 style={{fontSize:'16px',fontWeight:'700',color:'#111'}}>Tabela de Vendas</h2>
            <div style={{display:'flex',alignItems:'center',gap:'14px',marginTop:'4px',fontSize:'12px',color:'#6b7280'}}>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#22c55e',display:'inline-block'}} />
                {resumo.disponiveis} disponíveis
              </span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#f59e0b',display:'inline-block'}} />
                {resumo.reservadas} reservadas
              </span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'#f87171',display:'inline-block'}} />
                {resumo.vendidas} vendidas
              </span>
            </div>
          </div>
          <div style={{fontSize:'11px',color:'#9ca3af'}}>{unidadesFiltradas.length} de {unidades.length} unidades</div>
        </div>

        <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
          <input type="text" placeholder="Buscar unidade..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{padding:'5px 10px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',background:'#f9fafb',width:'130px'}} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as UnidadeStatus | 'todos')}
            style={{padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',background:'#f9fafb'}}>
            <option value="todos">Todos os status</option>
            <option value="disponivel">Disponíveis</option>
            <option value="reservada">Reservadas</option>
            {mostrarVendidas && <option value="vendida">Vendidas</option>}
          </select>
          {pavimentos.length > 1 && (
            <select value={filtroPavimento} onChange={e => setFiltroPavimento(e.target.value)}
              style={{padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Pavimento</option>
              {pavimentos.map(p => <option key={p} value={p!}>{p}</option>)}
            </select>
          )}
          {blocos.length > 1 && (
            <select value={filtroBloco} onChange={e => setFiltroBloco(e.target.value)}
              style={{padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Bloco</option>
              {blocos.map(b => <option key={b} value={b!}>{b}</option>)}
            </select>
          )}
          {quartosList.length > 1 && (
            <select value={filtroQuartos} onChange={e => setFiltroQuartos(e.target.value)}
              style={{padding:'5px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'6px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Quartos</option>
              {quartosList.map(q => <option key={q} value={String(q)}>{q} quartos</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabela com scroll horizontal apenas quando necessário */}
      <div style={{overflowX:'auto'}}>
        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo}>
            {agruparPor && Object.keys(grupos).length > 1 && (
              <div style={{padding:'7px 20px',background:'#f8fafc',borderBottom:'1px solid #f3f4f6'}}>
                <span style={{fontSize:'11px',fontWeight:'700',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}}>{grupo}</span>
                <span style={{marginLeft:'8px',fontSize:'11px',color:'#9ca3af'}}>({items.length} unidades)</span>
              </div>
            )}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
              <thead>
                <tr>
                  {colunasVisiveis.includes('unidade') && <th style={thStyle()}>Unid.</th>}
                  {colunasVisiveis.includes('pavimento') && !agruparPor && <th style={thStyle()}>Pavimento</th>}
                  {colunasVisiveis.includes('area_construida') && <th style={thStyle('right')}>Área</th>}
                  {colunasVisiveis.includes('quartos') && <th style={thStyle('center')}>Qtos</th>}
                  {colunasVisiveis.includes('posicao') && <th style={thStyle()}>Posição</th>}
                  {colunasVisiveis.includes('valor_imovel') && <th style={thStyle('right')}>Valor</th>}
                  {colunasVisiveis.includes('valor_sinal') && <th style={thStyle('right')}>Entrada</th>}
                  {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && <th style={thStyle('right')}>Parcelas</th>}
                  {colunasVisiveis.includes('valor_intercalada') && <th style={thStyle('right')}>Interc.</th>}
                  {colunasVisiveis.includes('valor_chaves') && <th style={thStyle('right')}>Chaves</th>}
                  {colunasVisiveis.includes('status') && <th style={thStyle('center')}>Status</th>}
                  <th style={thStyle('center')}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(unidade => {
                  const isReservada = unidade.status === 'reservada'
                  const isVendida = unidade.status === 'vendida'
                  const ocultarValores =
                    (isReservada && !mostrarValoresReservadas) ||
                    (isVendida && !configuracao?.mostrar_valores_vendidas)

                  const rowBg = isReservada ? '#fffbeb' : isVendida ? '#fef2f2' : 'transparent'
                  const rowOpacity = isVendida ? 0.72 : 1

                  return (
                    <tr key={unidade.id} style={{backgroundColor:rowBg, opacity:rowOpacity}}>
                      {colunasVisiveis.includes('unidade') && (
                        <td style={tdStyle()}>
                          <span style={{fontWeight:'600',color:'#111'}}>{unidade.unidade}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('pavimento') && !agruparPor && (
                        <td style={tdStyle()}>
                          <span style={{color:'#6b7280',fontSize:'12px'}}>{unidade.pavimento ?? '—'}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('area_construida') && (
                        <td style={tdStyle('right')}>
                          <span style={{color:'#6b7280'}}>{unidade.area_construida ? `${unidade.area_construida}m²` : '—'}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('quartos') && (
                        <td style={tdStyle('center')}>
                          <span style={{color:'#6b7280'}}>{unidade.quartos ?? '—'}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('posicao') && (
                        <td style={tdStyle()}>
                          <span style={{color:'#6b7280',fontSize:'12px'}}>{unidade.posicao ? POSICAO_LABELS[unidade.posicao] ?? unidade.posicao : '—'}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_imovel') && (
                        <td style={tdStyle('right')}>
                          <span style={{fontWeight:'600',color:'#111'}}>{ocultarValores ? '—' : fmtC(unidade.valor_imovel)}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_sinal') && (
                        <td style={tdStyle('right')}>
                          <span style={{color:'#6b7280'}}>
                            {ocultarValores ? '—' : (
                              <>
                                {fmtC(unidade.valor_sinal)}
                                {unidade.percentual_sinal && <span style={{fontSize:'10px',color:'#9ca3af',marginLeft:'3px'}}>({unidade.percentual_sinal}%)</span>}
                              </>
                            )}
                          </span>
                        </td>
                      )}
                      {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && (
                        <td style={tdStyle('right')}>
                          <span style={{color:'#6b7280'}}>
                            {ocultarValores ? '—' : (unidade.quantidade_parcelas && unidade.valor_parcela ? `${unidade.quantidade_parcelas}x ${fmtC(unidade.valor_parcela)}` : '—')}
                          </span>
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_intercalada') && (
                        <td style={tdStyle('right')}>
                          <span style={{color:'#6b7280'}}>
                            {ocultarValores ? '—' : (unidade.quantidade_intercaladas && unidade.valor_intercalada ? `${unidade.quantidade_intercaladas}x ${fmtC(unidade.valor_intercalada)}` : '—')}
                          </span>
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_chaves') && (
                        <td style={tdStyle('right')}>
                          <span style={{color:'#6b7280'}}>{ocultarValores ? '—' : fmtC(unidade.valor_chaves)}</span>
                        </td>
                      )}
                      {colunasVisiveis.includes('status') && (
                        <td style={tdStyle('center')}>
                          <span style={{
                            display:'inline-flex',alignItems:'center',padding:'2px 9px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',whiteSpace:'nowrap',
                            background: unidade.status === 'disponivel' ? '#dcfce7' : unidade.status === 'reservada' ? '#fef3c7' : unidade.status === 'vendida' ? '#fee2e2' : '#f3f4f6',
                            color: unidade.status === 'disponivel' ? '#15803d' : unidade.status === 'reservada' ? '#92400e' : unidade.status === 'vendida' ? '#b91c1c' : '#6b7280',
                          }}>
                            {STATUS_LABELS[unidade.status]}
                          </span>
                        </td>
                      )}
                      {/* Coluna de ação separada */}
                      <td style={tdStyle('center')}>
                        {unidade.status === 'disponivel' && (
                          <a
                            href={`/empreendimentos/${empreendimento.slug}/proposta/${unidade.id}`}
                            style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'5px 12px',background:'#E8390E',color:'white',borderRadius:'6px',fontSize:'12px',fontWeight:'600',textDecoration:'none',whiteSpace:'nowrap'}}
                          >
                            📋 Proposta
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {unidadesFiltradas.length === 0 && (
          <div style={{textAlign:'center',padding:'3rem',color:'#9ca3af'}}>
            <div style={{fontSize:'2rem',marginBottom:'8px'}}>🔍</div>
            <p>Nenhuma unidade encontrada com os filtros selecionados.</p>
            <button onClick={() => { setFiltroStatus('todos'); setFiltroPavimento('todos'); setFiltroBloco('todos'); setFiltroQuartos('todos'); setBusca('') }}
              style={{marginTop:'8px',fontSize:'13px',color:'#E8390E',background:'none',border:'none',cursor:'pointer'}}>
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {unidadesFiltradas.some(u => u.observacoes_publicas) && (
        <div style={{padding:'14px 20px',borderTop:'1px solid #f3f4f6'}}>
          <h3 style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',marginBottom:'6px'}}>Observações</h3>
          {unidadesFiltradas.filter(u => u.observacoes_publicas).map(u => (
            <p key={u.id} style={{fontSize:'12px',color:'#4b5563',marginBottom:'3px'}}>
              <strong>{u.unidade}:</strong> {u.observacoes_publicas}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
