// src/components/pdf/TabelaPDF.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { Empreendimento, Unidade, ConfiguracaoTabela } from '@/types'
import { formatCurrency, formatArea, groupBy, POSICAO_LABELS } from '@/lib/utils'
import { STATUS_LABELS, INDICE_LABELS } from '@/types'

// Registrar fonte
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 600 },
    { src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiA.woff2', fontWeight: 700 },
  ],
})

const STATUS_COLORS_PDF = {
  disponivel: '#16a34a',
  reservada: '#d97706',
  vendida: '#dc2626',
  bloqueada: '#6b7280',
  indisponivel: '#9ca3af',
}

const STATUS_BG_COLORS_PDF = {
  disponivel: '#f0fdf4',
  reservada: '#fffbeb',
  vendida: '#fef2f2',
  bloqueada: '#f9fafb',
  indisponivel: '#f9fafb',
}

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Inter',
    fontSize: 8,
    color: '#111827',
    backgroundColor: '#ffffff',
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 28,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a5f',
  },
  headerLeft: {
    flex: 1,
  },
  marca: {
    fontSize: 7,
    color: '#6b7280',
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  nomeEmpreendimento: {
    fontSize: 18,
    fontWeight: 700,
    color: '#1e3a5f',
    marginBottom: 2,
  },
  localizacao: {
    fontSize: 9,
    color: '#4b5563',
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  dataLabel: {
    fontSize: 6,
    color: '#9ca3af',
    marginBottom: 1,
  },
  dataValue: {
    fontSize: 8,
    color: '#374151',
    fontWeight: 600,
  },
  // Info bar
  infoBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 6,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 8,
    color: '#1e3a5f',
    fontWeight: 600,
  },
  // Observações
  observacoes: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    padding: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  observacoesText: {
    fontSize: 7,
    color: '#92400e',
  },
  // Grupo / seção
  grupoHeader: {
    backgroundColor: '#1e3a5f',
    padding: '5 8',
    marginBottom: 0,
    borderRadius: 3,
    marginTop: 10,
  },
  grupoHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Tabela
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  tableHeaderCell: {
    fontSize: 6,
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 4,
    minHeight: 20,
    alignItems: 'center',
  },
  tableCell: {
    fontSize: 7.5,
    color: '#374151',
  },
  tableCellBold: {
    fontSize: 7.5,
    fontWeight: 600,
    color: '#111827',
  },
  // Status badge
  statusBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 6,
    fontWeight: 600,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6,
    color: '#9ca3af',
  },
  // Resumo
  resumoBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  resumoItem: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  resumoNum: {
    fontSize: 14,
    fontWeight: 700,
  },
  resumoLabel: {
    fontSize: 6,
    marginTop: 1,
  },
})

interface TabelaPDFProps {
  empreendimento: Empreendimento
  unidades: Unidade[]
  configuracao: ConfiguracaoTabela | null
}

const DEFAULT_COLUNAS = [
  'unidade', 'bloco', 'pavimento', 'area_construida', 'area_total',
  'quartos', 'posicao', 'valor_imovel', 'valor_sinal',
  'quantidade_parcelas', 'valor_parcela', 'status',
]

export function TabelaPDF({ empreendimento, unidades, configuracao }: TabelaPDFProps) {
  const colunas = configuracao?.colunas_visiveis ?? DEFAULT_COLUNAS
  const mostrarVendidas = configuracao?.mostrar_unidades_vendidas ?? true
  const agruparPor = configuracao?.agrupar_por

  const unidadesFiltradas = unidades.filter(u => {
    if (!mostrarVendidas && u.status === 'vendida') return false
    // Indisponíveis/vendidas aparecem (só metragem); bloqueadas ficam ocultas.
    if (u.status === 'bloqueada') return false
    return true
  })

  const grupos = agruparPor
    ? groupBy(unidadesFiltradas, agruparPor as keyof Unidade)
    : { '': unidadesFiltradas }

  const resumo = {
    total: unidades.length,
    disponiveis: unidades.filter(u => u.status === 'disponivel').length,
    reservadas: unidades.filter(u => u.status === 'reservada').length,
    vendidas: unidades.filter(u => u.status === 'vendida').length,
  }

  const hoje = new Date().toLocaleDateString('pt-BR')

  return (
    <Document
      title={`Tabela de Vendas - ${empreendimento.nome}`}
      author="Casa Forte Construtora e Incorporadora"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            <Text style={styles.marca}>Casa Forte · Tabelas de Vendas</Text>
            <Text style={styles.nomeEmpreendimento}>{empreendimento.nome}</Text>
            <Text style={styles.localizacao}>
              {[empreendimento.localizacao, empreendimento.cidade, empreendimento.estado]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dataLabel}>Atualizado em</Text>
            <Text style={styles.dataValue}>{hoje}</Text>
          </View>
        </View>

        {/* Info bar */}
        <View style={styles.infoBar}>
          {empreendimento.valor_m2 ? (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Entrada</Text>
                <Text style={styles.infoValue}>20% do valor</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Saldo</Text>
                <Text style={styles.infoValue}>Financiamento bancário</Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Correção até entrega</Text>
                <Text style={styles.infoValue}>
                  {INDICE_LABELS[empreendimento.indice_ate_entrega]}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Correção após entrega</Text>
                <Text style={styles.infoValue}>
                  {INDICE_LABELS[empreendimento.indice_apos_entrega]}
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Parcelamento</Text>
                <Text style={styles.infoValue}>Até {empreendimento.parcelas_padrao}x mensais</Text>
              </View>
            </>
          )}
          {empreendimento.data_prevista_entrega && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Previsão de entrega</Text>
              <Text style={styles.infoValue}>
                {new Date(empreendimento.data_prevista_entrega + 'T00:00:00')
                  .toLocaleDateString('pt-BR')}
              </Text>
            </View>
          )}
        </View>

        {/* Resumo */}
        <View style={styles.resumoBar}>
          <View style={[styles.resumoItem, { backgroundColor: '#f0fdf4' }]}>
            <Text style={[styles.resumoNum, { color: '#16a34a' }]}>{resumo.disponiveis}</Text>
            <Text style={[styles.resumoLabel, { color: '#15803d' }]}>Disponíveis</Text>
          </View>
          <View style={[styles.resumoItem, { backgroundColor: '#fffbeb' }]}>
            <Text style={[styles.resumoNum, { color: '#d97706' }]}>{resumo.reservadas}</Text>
            <Text style={[styles.resumoLabel, { color: '#b45309' }]}>Reservadas</Text>
          </View>
          <View style={[styles.resumoItem, { backgroundColor: '#fef2f2' }]}>
            <Text style={[styles.resumoNum, { color: '#dc2626' }]}>{resumo.vendidas}</Text>
            <Text style={[styles.resumoLabel, { color: '#b91c1c' }]}>Vendidas</Text>
          </View>
          <View style={[styles.resumoItem, { backgroundColor: '#f8fafc' }]}>
            <Text style={[styles.resumoNum, { color: '#1e3a5f' }]}>{resumo.total}</Text>
            <Text style={[styles.resumoLabel, { color: '#64748b' }]}>Total</Text>
          </View>
        </View>

        {/* Observações */}
        {empreendimento.observacoes_publicas && (
          <View style={styles.observacoes}>
            <Text style={styles.observacoesText}>
              Observações: {empreendimento.observacoes_publicas}
            </Text>
          </View>
        )}

        {/* Grupos de unidades */}
        {Object.entries(grupos).map(([grupo, items]) => (
          <View key={grupo} wrap={false}>
            {grupo && Object.keys(grupos).length > 1 && (
              <View style={styles.grupoHeader}>
                <Text style={styles.grupoHeaderText}>{grupo} — {items.length} unidades</Text>
              </View>
            )}

            {/* Header da tabela */}
            <View style={styles.tableHeader}>
              {colunas.includes('unidade') && (
                <Text style={[styles.tableHeaderCell, { width: 50 }]}>Unidade</Text>
              )}
              {colunas.includes('bloco') && (
                <Text style={[styles.tableHeaderCell, { width: 38 }]}>Bloco</Text>
              )}
              {colunas.includes('pavimento') && (
                <Text style={[styles.tableHeaderCell, { width: 60 }]}>Pavimento</Text>
              )}
              {colunas.includes('area_construida') && (
                <Text style={[styles.tableHeaderCell, { width: 52, textAlign: 'right' }]}>Área Const.</Text>
              )}
              {colunas.includes('area_total') && (
                <Text style={[styles.tableHeaderCell, { width: 50, textAlign: 'right' }]}>Área Total</Text>
              )}
              {colunas.includes('quartos') && (
                <Text style={[styles.tableHeaderCell, { width: 28, textAlign: 'center' }]}>Qtos</Text>
              )}
              {colunas.includes('posicao') && (
                <Text style={[styles.tableHeaderCell, { width: 62 }]}>Posição</Text>
              )}
              {colunas.includes('valor_imovel') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Valor Imóvel</Text>
              )}
              {colunas.includes('valor_sinal') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Entrada</Text>
              )}
              {colunas.includes('saldo_financiamento') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Saldo (financ.)</Text>
              )}
              {colunas.includes('quantidade_parcelas') && colunas.includes('valor_parcela') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Parcelas</Text>
              )}
              {colunas.includes('valor_intercalada') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Intercaladas</Text>
              )}
              {colunas.includes('valor_chaves') && (
                <Text style={[styles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Chaves</Text>
              )}
              {colunas.includes('status') && (
                <Text style={[styles.tableHeaderCell, { width: 56, textAlign: 'center' }]}>Status</Text>
              )}
            </View>

            {/* Linhas */}
            {items.map((u, idx) => {
              const statusColor = STATUS_COLORS_PDF[u.status] ?? '#9ca3af'
              const rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc'
              // Não disponíveis: só metragem, sem valores.
              const ocultarValores =
                u.status === 'indisponivel' ||
                (u.status === 'vendida' && !configuracao?.mostrar_valores_vendidas) ||
                (u.status === 'reservada' && !configuracao?.mostrar_valores_reservadas)

              return (
                <View
                  key={u.id}
                  style={[styles.tableRow, { backgroundColor: rowBg }]}
                  wrap={false}
                >
                  {colunas.includes('unidade') && (
                    <Text style={[styles.tableCellBold, { width: 50 }]}>{u.unidade}</Text>
                  )}
                  {colunas.includes('bloco') && (
                    <Text style={[styles.tableCell, { width: 38 }]}>{u.bloco ?? '—'}</Text>
                  )}
                  {colunas.includes('pavimento') && (
                    <Text style={[styles.tableCell, { width: 60 }]}>{u.pavimento ?? '—'}</Text>
                  )}
                  {colunas.includes('area_construida') && (
                    <Text style={[styles.tableCell, { width: 52, textAlign: 'right' }]}>
                      {u.area_construida ? `${u.area_construida}m²` : '—'}
                    </Text>
                  )}
                  {colunas.includes('area_total') && (
                    <Text style={[styles.tableCell, { width: 50, textAlign: 'right' }]}>
                      {u.area_total ? `${u.area_total}m²` : '—'}
                    </Text>
                  )}
                  {colunas.includes('quartos') && (
                    <Text style={[styles.tableCell, { width: 28, textAlign: 'center' }]}>
                      {u.quartos ?? '—'}
                    </Text>
                  )}
                  {colunas.includes('posicao') && (
                    <Text style={[styles.tableCell, { width: 62 }]}>
                      {u.posicao ? POSICAO_LABELS[u.posicao] ?? u.posicao : '—'}
                    </Text>
                  )}
                  {colunas.includes('valor_imovel') && (
                    <Text style={[styles.tableCellBold, { flex: 1, textAlign: 'right' }]}>
                      {ocultarValores ? '—' : formatCurrency(u.valor_imovel)}
                    </Text>
                  )}
                  {colunas.includes('valor_sinal') && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {ocultarValores ? '—' : formatCurrency(u.valor_sinal)}
                    </Text>
                  )}
                  {colunas.includes('saldo_financiamento') && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {!ocultarValores && u.valor_imovel != null && u.valor_sinal != null
                        ? formatCurrency(Number(u.valor_imovel) - Number(u.valor_sinal))
                        : '—'}
                    </Text>
                  )}
                  {colunas.includes('quantidade_parcelas') && colunas.includes('valor_parcela') && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {!ocultarValores && u.quantidade_parcelas && u.valor_parcela
                        ? `${u.quantidade_parcelas}x ${formatCurrency(u.valor_parcela)}`
                        : '—'}
                    </Text>
                  )}
                  {colunas.includes('valor_intercalada') && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {!ocultarValores && u.quantidade_intercaladas && u.valor_intercalada
                        ? `${u.quantidade_intercaladas}x ${formatCurrency(u.valor_intercalada)}`
                        : '—'}
                    </Text>
                  )}
                  {colunas.includes('valor_chaves') && (
                    <Text style={[styles.tableCell, { flex: 1, textAlign: 'right' }]}>
                      {ocultarValores ? '—' : formatCurrency(u.valor_chaves)}
                    </Text>
                  )}
                  {colunas.includes('status') && (
                    <View style={{ width: 56, alignItems: 'center' }}>
                      <Text style={[
                        styles.statusBadge,
                        {
                          color: statusColor,
                          backgroundColor: STATUS_BG_COLORS_PDF[u.status] ?? '#f9fafb',
                        }
                      ]}>
                        {STATUS_LABELS[u.status]}
                      </Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        ))}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Casa Forte Construtora e Incorporadora · {empreendimento.nome} · {empreendimento.cidade}/{empreendimento.estado}
          </Text>
          <Text style={styles.footerText}>
            Os valores e condições podem sofrer alteração sem aviso prévio · Gerado em {hoje}
          </Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
