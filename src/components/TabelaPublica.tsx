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
  getStatusBadgeClasses,
  getStatusRowClasses,
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
 
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<UnidadeStatus | 'todos'>('todos')
  const [filtroPavimento, setFiltroPavimento] = useState('todos')
  const [filtroBloco, setFiltroBloco] = useState('todos')
  const [filtroQuartos, setFiltroQuartos] = useState('todos')
  const [filtroValorMin, setFiltroValorMin] = useState('')
  const [filtroValorMax, setFiltroValorMax] = useState('')
  const [busca, setBusca] = useState('')
 
  // Opções de filtro
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
 
  // Filtrar unidades
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
 
  // Agrupar
  const grupos = useMemo(() => {
    if (!agruparPor) return { 'Unidades': unidadesFiltradas }
    return groupBy(unidadesFiltradas, agruparPor as keyof Unidade)
  }, [unidadesFiltradas, agruparPor])
 
  // Resumo de disponibilidade
  const resumo = useMemo(() => ({
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
  }), [unidades])
 
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header da tabela */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Tabela de Vendas</h2>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                {resumo.disponiveis} disponíveis
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {resumo.reservadas} reservadas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                {resumo.vendidas} vendidas
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {unidadesFiltradas.length} de {unidades.length} unidades
          </div>
        </div>
 
        {/* Filtros */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <input
            type="text"
            placeholder="Buscar unidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="col-span-2 md:col-span-1 px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
          />
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value as UnidadeStatus | 'todos')}
            className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
          >
            <option value="todos">Todos os status</option>
            <option value="disponivel">Disponíveis</option>
            <option value="reservada">Reservadas</option>
            {mostrarVendidas && <option value="vendida">Vendidas</option>}
          </select>
          {pavimentos.length > 1 && (
            <select
              value={filtroPavimento}
              onChange={e => setFiltroPavimento(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
            >
              <option value="todos">Pavimento</option>
              {pavimentos.map(p => (
                <option key={p} value={p!}>{p}</option>
              ))}
            </select>
          )}
          {blocos.length > 1 && (
            <select
              value={filtroBloco}
              onChange={e => setFiltroBloco(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
            >
              <option value="todos">Bloco</option>
              {blocos.map(b => (
                <option key={b} value={b!}>{b}</option>
              ))}
            </select>
          )}
          {quartosList.length > 1 && (
            <select
              value={filtroQuartos}
              onChange={e => setFiltroQuartos(e.target.value)}
              className="px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
            >
              <option value="todos">Quartos</option>
              {quartosList.map(q => (
                <option key={q} value={String(q)}>{q} quartos</option>
              ))}
            </select>
          )}
        </div>
      </div>
 
      {/* Tabela */}
      <div className="overflow-x-auto">
        {Object.entries(grupos).map(([grupo, items]) => (
          <div key={grupo}>
            {agruparPor && Object.keys(grupos).length > 1 && (
              <div className="px-6 py-2 bg-slate-50 border-b border-gray-100">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {grupo}
                </span>
                <span className="ml-2 text-xs text-gray-400">({items.length} unidades)</span>
              </div>
            )}
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {colunasVisiveis.includes('unidade') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Unidade
                    </th>
                  )}
                  {colunasVisiveis.includes('bloco') && blocos.length > 0 && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Bloco
                    </th>
                  )}
                  {colunasVisiveis.includes('pavimento') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Pavimento
                    </th>
                  )}
                  {colunasVisiveis.includes('area_construida') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Área Const.
                    </th>
                  )}
                  {colunasVisiveis.includes('area_total') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Área Total
                    </th>
                  )}
                  {colunasVisiveis.includes('quartos') && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Qtos
                    </th>
                  )}
                  {colunasVisiveis.includes('posicao') && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Posição
                    </th>
                  )}
                  {colunasVisiveis.includes('valor_imovel') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Valor
                    </th>
                  )}
                  {colunasVisiveis.includes('valor_sinal') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Entrada
                    </th>
                  )}
                  {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Parcelas
                    </th>
                  )}
                  {colunasVisiveis.includes('valor_intercalada') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Intercaladas
                    </th>
                  )}
                  {colunasVisiveis.includes('valor_chaves') && (
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Chaves
                    </th>
                  )}
                  {colunasVisiveis.includes('status') && (
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map(unidade => {
                  const isReservada = unidade.status === 'reservada'
                  const isVendida = unidade.status === 'vendida'
                  const ocultarValores =
                    (isReservada && !mostrarValoresReservadas) ||
                    (isVendida && !configuracao?.mostrar_valores_vendidas)
 
                  return (
                    <tr
                      key={unidade.id}
                      className={cn(
                        'hover:bg-gray-50 transition-colors',
                        getStatusRowClasses(unidade.status),
                        unidade.destaque && 'ring-1 ring-inset ring-blue-200'
                      )}
                      style={unidade.cor_destaque ? { backgroundColor: unidade.cor_destaque + '20' } : undefined}
                    >
                      {colunasVisiveis.includes('unidade') && (
                        <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                          {unidade.unidade}
                          {unidade.destaque && (
                            <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                              DESTAQUE
                            </span>
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('bloco') && blocos.length > 0 && (
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {unidade.bloco ?? '—'}
                        </td>
                      )}
                      {colunasVisiveis.includes('pavimento') && (
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {unidade.pavimento ?? '—'}
                        </td>
                      )}
                      {colunasVisiveis.includes('area_construida') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {formatArea(unidade.area_construida)}
                        </td>
                      )}
                      {colunasVisiveis.includes('area_total') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {formatArea(unidade.area_total)}
                        </td>
                      )}
                      {colunasVisiveis.includes('quartos') && (
                        <td className="px-4 py-3 text-center text-gray-600">
                          {unidade.quartos ?? '—'}
                        </td>
                      )}
                      {colunasVisiveis.includes('posicao') && (
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                          {unidade.posicao ? POSICAO_LABELS[unidade.posicao] ?? unidade.posicao : '—'}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_imovel') && (
                        <td className="px-4 py-3 text-right font-semibold text-gray-800 whitespace-nowrap">
                          {ocultarValores ? '—' : formatCurrency(unidade.valor_imovel)}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_sinal') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {ocultarValores ? '—' : (
                            <span>
                              {formatCurrency(unidade.valor_sinal)}
                              {unidade.percentual_sinal && (
                                <span className="text-xs text-gray-400 ml-1">
                                  ({unidade.percentual_sinal}%)
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('quantidade_parcelas') && colunasVisiveis.includes('valor_parcela') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {ocultarValores ? '—' : (
                            unidade.quantidade_parcelas && unidade.valor_parcela ? (
                              <span>
                                {unidade.quantidade_parcelas}x{' '}
                                <span className="font-medium">{formatCurrency(unidade.valor_parcela)}</span>
                              </span>
                            ) : '—'
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_intercalada') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {ocultarValores ? '—' : (
                            unidade.quantidade_intercaladas && unidade.valor_intercalada ? (
                              <span>
                                {unidade.quantidade_intercaladas}x{' '}
                                {formatCurrency(unidade.valor_intercalada)}
                              </span>
                            ) : '—'
                          )}
                        </td>
                      )}
                      {colunasVisiveis.includes('valor_chaves') && (
                        <td className="px-4 py-3 text-right text-gray-600 whitespace-nowrap">
                          {ocultarValores ? '—' : formatCurrency(unidade.valor_chaves)}
                        </td>
                      )}
                      {colunasVisiveis.includes('status') && (
                        <td className="px-4 py-3 text-center">
                          <span
                            className={cn(
                              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                              getStatusBadgeClasses(unidade.status)
                            )}
                          >
                            {STATUS_LABELS[unidade.status]}
                          </span>
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
          <div className="text-center py-12 text-gray-400">
            <div className="text-3xl mb-2">🔍</div>
            <p>Nenhuma unidade encontrada com os filtros selecionados.</p>
            <button
              onClick={() => {
                setFiltroStatus('todos')
                setFiltroPavimento('todos')
                setFiltroBloco('todos')
                setFiltroQuartos('todos')
                setFiltroValorMin('')
                setFiltroValorMax('')
                setBusca('')
              }}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
 
      {/* Observações da unidade */}
      {unidadesFiltradas.some(u => u.observacoes_publicas) && (
        <div className="px-6 py-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Observações
          </h3>
          {unidadesFiltradas
            .filter(u => u.observacoes_publicas)
            .map(u => (
              <p key={u.id} className="text-xs text-gray-600 mb-1">
                <span className="font-semibold">{u.unidade}:</span>{' '}
                {u.observacoes_publicas}
              </p>
            ))}
        </div>
      )}
    </div>
  )
}
