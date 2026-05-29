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
  'unidade', 'bloco', 'pavimento', 'area_construida', 'area_total',
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
  const [filtroValorMin, setFiltroValorMin] = useState('')
  const [filtroValorMax, setFiltroValorMax] = useState('')
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
      if (filtroValorMin && u.valor_imovel && u.valor_imovel < Number(filtroValorMin)) return false
      if (filtroValorMax && u.valor_imovel && u.valor_imovel > Number(filtroValorMax)) return false
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
  }, [unidades, filtroStatus, filtroPavimento, filtroBloco, filtroQuartos, filtroValorMin, filtroValorMax, busca, mostrarVendidas])

  const grupos = useMemo(() => {
    if (!agruparPor) return { 'Unidades': unidadesFiltradas }
    return groupBy(unidadesFiltradas, agruparPor as keyof Unidade)
  }, [unidadesFiltradas, agruparPor])

  const resumo = useMemo(() => ({
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
  }), [unidades])

  return (
    <div style={{background:'white',borderRadius:'16px',border:'1px solid #e5e7eb',overflow:'hidden'}}>
      {/* Header */}
      <div style={{padding:'16px 24px',borderBottom:'1px solid #f3f4f6'}}>
        <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:'16px',marginBottom:'16px'}}>
          <div>
            <h2 style={{fontSize:'18px',fontWeight:'700',color:'#111'}}>Tabela de Vendas</h2>
            <div style={{display:'flex',alignItems:'center',gap:'16px',marginTop:'4px',fontSize:'12px',color:'#6b7280'}}>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#22c55e',display:'inline-block'}} />
                {resumo.disponiveis} disponíveis
              </span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#f59e0b',display:'inline-block'}} />
                {resumo.reservadas} reservadas
              </span>
              <span style={{display:'flex',alignItems:'center',gap:'4px'}}>
                <span style={{width:'8px',height:'8px',borderRadius:'50%',background:'#f87171',display:'inline-block'}} />
                {resumo.vendidas} vendidas
              </span>
            </div>
          </div>
          <div style={{fontSize:'12px',color:'#9ca3af'}}>{unidadesFiltradas.length} de {unidades.length} unidades</div>
        </div>

        {/* Filtros */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))',gap:'8px'}}>
          <input type="text" placeholder="Buscar unidade..." value={busca} onChange={e => setBusca(e.target.value)}
            style={{padding:'6px 12px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'8px',outline:'none',background:'#f9fafb'}} />
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as UnidadeStatus | 'todos')}
            style={{padding:'6px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'8px',outline:'none',background:'#f9fafb'}}>
            <option value="todos">Todos os status</option>
            <option value="disponivel">Disponíveis</option>
            <option value="reservada">Reservadas</option>
            {mostrarVendidas && <option value="vendida">Vendidas</option>}
          </select>
          {pavimentos.length > 1 && (
            <select value={filtroPavimento} onChange={e => setFiltroPavimento(e.target.value)}
              style={{padding:'6px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'8px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Pavimento</option>
              {pavimentos.map(p => <option key={p} value={p!}>{p}</option>)}
            </select>
          )}
          {blocos.length > 1 && (
            <select value={filtroBloco} onChange={e => setFiltroBloco(e.target.value)}
              style={{padding:'6px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'8px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Bloco</option>
              {blocos.map(b => <option key={b} value={b!}>{b}</option>)}
            </select>
          )}
          {quartosList.length > 1 && (
            <select value={filtroQuartos} onChange={e => setFiltroQuartos(e.target.value)}
              style={{padding:'6px 8px',fontSize:'12px',border:'1px solid #e5e7eb',borderRadius:'8px',outline:'none',background:'#f9fafb'}}>
              <option value="todos">Quartos</option>
              {quartosList.map(q => <option key={q} value={String(q)}>{q} quartos</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div style={{overflowX:'auto'}}>
        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo}>
            {agruparPor && Object.keys(grupos).length > 1 && (
              <div style={{padding:'8px 24px',background:'#f8fafc',borderBottom:'1px solid #f3f4f6'}}>
                <span style={{fontSize:'11px',fontWeight:'600',color:'#64748b',textTransform:'uppercase',letterSpacing:'0.05em'}}>{grupo}</span>
                <span style={{marginLeft:'8px',fontSize:'11px',color:'#9ca3af'}}>({items.length} unidades)</span>
              </div>
            )}
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px',minWidth:'max-content'}}>
              <thead>
                <tr style={{borderBottom:'1px solid #f3f4f6'}}>
                  {colunasVisiveis.includes('unidade') && <th style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Unidade</th>}
                  {colunasVisiveis.includes('bloco') && blocos.length > 0 && <th style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Bloco</th>}
                  {colunasVisiveis.includes('pavimento') && <th style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Pavimento</th>}
                  {colunasVisiveis.includes('area_construida') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Área Const.</th>}
                  {colunasVisiveis.includes('area_total') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Área Total</th>}
                  {colunasVisiveis.includes('quartos') && <th style={{padding:'10px 16px',textAlign:'center',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Qtos</th>}
                  {colunasVisiveis.includes('posicao') && <th style={{padding:'10px 16px',textAlign:'left',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Posição</th>}
                  {colunasVisiveis.includes('valor_imovel') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Valor</th>}
                  {colunasVisiveis.includes('valor_sinal') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Entrada</th>}
                  {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Parcelas</th>}
                  {colunasVisiveis.includes('valor_intercalada') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Intercaladas</th>}
                  {colunasVisiveis.includes('valor_chaves') && <th style={{padding:'10px 16px',textAlign:'right',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Chaves</th>}
                  {colunasVisiveis.includes('status') && <th style={{padding:'10px 16px',textAlign:'center',fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',whiteSpace:'nowrap'}}>Status</th>}
                </tr>
              </thead>
              <tbody>
                {items.map(unidade => {
                  const isReservada = unidade.status === 'reservada'
                  const isVendida = unidade.status === 'vendida'
                  const ocultarValores =
                    (isReservada && !mostrarValoresReservadas) ||
                    (isVendida && !configuracao?.mostrar_valores_vendidas)

                  const rowBg = isReservada ? '#fffbeb' : isVendida ? '#fef2f2' : unidade.cor_destaque ? unidade.cor_destaque + '20' : 'transparent'
                  const rowOpacity = isVendida ? 0.75 : 1

                  return (
                    <tr key={unidade.id} style={{borderBottom:'1px solid #f9fafb',backgroundColor:rowBg,opacity:rowOpacity}}>
                      {colunasVisiveis.includes('unidade') && (
                        <td style={{padding:'10px 16px',fontWeight:'600',color:'#111',whiteSpace:'nowrap'}}>
                          {unidade.unidade}
                          {unidade.destaque && (
                            <span style={{marginLeft:'6px',fontSize:'10px',fontWeight:'700',padding:'1px 6px',borderRadius:'4px',background:'#dbeafe',color:'#1d4ed8'}}>DESTAQUE</span>
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('bloco') && blocos.length > 0 && (
                        <td style={{padding:'10px 16px',color:'#6b7280',whiteSpace:'nowrap'}}>{unidade.bloco ?? '—'}</td>
                      )}
                      {colunasVisiveis.includes('pavimento') && (
                        <td style={{padding:'10px 16px',color:'#6b7280',whiteSpace:'nowrap'}}>{unidade.pavimento ?? '—'}</td>
                      )}
                      {colunasVisiveis.includes('area_construida') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>{formatArea(unidade.area_construida)}</td>
                      )}
                      {colunasVisiveis.includes('area_total') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>{formatArea(unidade.area_total)}</td>
                      )}
                      {colunasVisiveis.includes('quartos') && (
                        <td style={{padding:'10px 16px',textAlign:'center',color:'#6b7280'}}>{unidade.quartos ?? '—'}</td>
                      )}
                      {colunasVisiveis.includes('posicao') && (
                        <td style={{padding:'10px 16px',color:'#6b7280',whiteSpace:'nowrap'}}>{unidade.posicao ? POSICAO_LABELS[unidade.posicao] ?? unidade.posicao : '—'}</td>
                      )}
                      {colunasVisiveis.includes('valor_imovel') && (
                        <td style={{padding:'10px 16px',textAlign:'right',fontWeight:'600',color:'#111',whiteSpace:'nowrap'}}>{ocultarValores ? '—' : formatCurrency(unidade.valor_imovel)}</td>
                      )}
                      {colunasVisiveis.includes('valor_sinal') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>
                          {ocultarValores ? '—' : (
                            <span>{formatCurrency(unidade.valor_sinal)}{unidade.percentual_sinal && <span style={{fontSize:'11px',color:'#9ca3af',marginLeft:'4px'}}>({unidade.percentual_sinal}%)</span>}</span>
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>
                          {ocultarValores ? '—' : (unidade.quantidade_parcelas && unidade.valor_parcela ? `${unidade.quantidade_parcelas}x ${formatCurrency(unidade.valor_parcela)}` : '—')}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_intercalada') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>
                          {ocultarValores ? '—' : (unidade.quantidade_intercaladas && unidade.valor_intercalada ? `${unidade.quantidade_intercaladas}x ${formatCurrency(unidade.valor_intercalada)}` : '—')}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_chaves') && (
                        <td style={{padding:'10px 16px',textAlign:'right',color:'#6b7280',whiteSpace:'nowrap'}}>{ocultarValores ? '—' : formatCurrency(unidade.valor_chaves)}</td>
                      )}
                      {colunasVisiveis.includes('status') && (
                        <td style={{padding:'10px 16px',textAlign:'center'}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',flexWrap:'wrap'}}>
                            <span style={{
                              display:'inline-flex',alignItems:'center',padding:'2px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:'600',
                              background: unidade.status === 'disponivel' ? '#dcfce7' : unidade.status === 'reservada' ? '#fef3c7' : unidade.status === 'vendida' ? '#fee2e2' : '#f3f4f6',
                              color: unidade.status === 'disponivel' ? '#15803d' : unidade.status === 'reservada' ? '#92400e' : unidade.status === 'vendida' ? '#b91c1c' : '#6b7280',
                            }}>
                              {STATUS_LABELS[unidade.status]}
                            </span>
                            {unidade.status === 'disponivel' && (
                              <a
                                href={`/empreendimentos/${empreendimento.slug}/proposta/${unidade.id}`}
                                style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'3px 10px',background:'#E8390E',color:'white',borderRadius:'6px',fontSize:'11px',fontWeight:'600',textDecoration:'none',whiteSpace:'nowrap'}}
                              >
                                📋 Proposta
                              </a>
                            )}
                          </div>
                        </td>
                      )}
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
            <button onClick={() => { setFiltroStatus('todos'); setFiltroPavimento('todos'); setFiltroBloco('todos'); setFiltroQuartos('todos'); setFiltroValorMin(''); setFiltroValorMax(''); setBusca('') }}
              style={{marginTop:'8px',fontSize:'13px',color:'#E8390E',background:'none',border:'none',cursor:'pointer'}}>
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {unidadesFiltradas.some(u => u.observacoes_publicas) && (
        <div style={{padding:'16px 24px',borderTop:'1px solid #f3f4f6'}}>
          <h3 style={{fontSize:'11px',fontWeight:'600',color:'#6b7280',textTransform:'uppercase',marginBottom:'8px'}}>Observações</h3>
          {unidadesFiltradas.filter(u => u.observacoes_publicas).map(u => (
            <p key={u.id} style={{fontSize:'12px',color:'#4b5563',marginBottom:'4px'}}>
              <strong>{u.unidade}:</strong> {u.observacoes_publicas}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
