// src/app/admin/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { DashboardCharts } from '@/components/admin/DashboardCharts'

export const revalidate = 60

export default async function DashboardPage() {
  const supabase = await createClient()

  // Dashboard summary
  const { data: dashboard } = await supabase
    .from('vw_dashboard')
    .select('*')
    .single()

  // Resumo por empreendimento
  const { data: empreendimentos } = await supabase
    .from('vw_resumo_empreendimento')
    .select('*')
    .order('vgv_total', { ascending: false })

  // Vendas dos últimos 12 meses
  const dozeAtras = new Date()
  dozeAtras.setMonth(dozeAtras.getMonth() - 11)

  const { data: vendasMensais } = await supabase
    .from('vendas')
    .select('data_venda, valor_venda')
    .gte('data_venda', dozeAtras.toISOString().split('T')[0])
    .order('data_venda')

  // Agrupar vendas por mês
  const vendasPorMes = (vendasMensais ?? []).reduce(
    (acc: Record<string, { mes: string; valor: number; qtd: number }>, v) => {
      const mes = v.data_venda.substring(0, 7) // YYYY-MM
      if (!acc[mes]) acc[mes] = { mes, valor: 0, qtd: 0 }
      acc[mes].valor += v.valor_venda
      acc[mes].qtd += 1
      return acc
    },
    {}
  )

  // Reservas vencidas
  const { data: reservasVencidas } = await supabase
    .from('reservas')
    .select('id, interessado_nome, validade_reserva, empreendimento_id, unidade_id')
    .eq('status', 'ativa')
    .lt('validade_reserva', new Date().toISOString().split('T')[0])

  const cards = [
    {
      label: 'Empreendimentos Ativos',
      value: dashboard?.total_empreendimentos ?? 0,
      type: 'number' as const,
      color: 'blue',
      icon: '🏗️',
    },
    {
      label: 'VGV Total',
      value: dashboard?.vgv_total ?? 0,
      type: 'currency' as const,
      color: 'slate',
      icon: '💰',
    },
    {
      label: 'VGV Vendido',
      value: dashboard?.vgv_vendido ?? 0,
      type: 'currency' as const,
      color: 'green',
      icon: '✅',
    },
    {
      label: 'VGV Disponível',
      value: dashboard?.vgv_disponivel ?? 0,
      type: 'currency' as const,
      color: 'sky',
      icon: '📊',
    },
    {
      label: 'Unidades Disponíveis',
      value: dashboard?.total_disponiveis ?? 0,
      type: 'number' as const,
      color: 'green',
      icon: '🟢',
    },
    {
      label: 'Unidades Reservadas',
      value: dashboard?.total_reservadas ?? 0,
      type: 'number' as const,
      color: 'amber',
      icon: '🟡',
    },
    {
      label: 'Unidades Vendidas',
      value: dashboard?.total_vendidas ?? 0,
      type: 'number' as const,
      color: 'red',
      icon: '🔴',
    },
    {
      label: 'Vendas no Mês',
      value: dashboard?.vendas_mes_valor ?? 0,
      type: 'currency' as const,
      color: 'purple',
      icon: '📅',
      sub: `${dashboard?.vendas_mes_qtd ?? 0} vendas`,
    },
    {
      label: 'Ticket Médio',
      value: dashboard?.ticket_medio_vendas ?? 0,
      type: 'currency' as const,
      color: 'indigo',
      icon: '🎯',
    },
    {
      label: '% Vendido Geral',
      value: dashboard?.percentual_vendido_geral ?? 0,
      type: 'percent' as const,
      color: 'teal',
      icon: '📈',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visão geral de todos os empreendimentos
        </p>
      </div>

      {/* Alertas */}
      {(reservasVencidas?.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <div className="font-semibold text-amber-800 text-sm">
              {reservasVencidas!.length} reserva(s) vencida(s)
            </div>
            <p className="text-xs text-amber-700 mt-0.5">
              Verifique as reservas vencidas e atualize o status das unidades.
            </p>
          </div>
        </div>
      )}

      {/* Cards KPI */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts
        vendasPorMes={Object.values(vendasPorMes).sort((a, b) => a.mes.localeCompare(b.mes))}
        empreendimentos={empreendimentos ?? []}
        unidades={{
          disponiveis: dashboard?.total_disponiveis ?? 0,
          reservadas: dashboard?.total_reservadas ?? 0,
          vendidas: dashboard?.total_vendidas ?? 0,
        }}
      />

      {/* Ranking empreendimentos */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Ranking de Empreendimentos</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {(empreendimentos ?? []).slice(0, 10).map((emp, idx) => (
            <div key={emp.id} className="px-6 py-3 flex items-center gap-4 hover:bg-gray-50">
              <span className="text-xs font-bold text-gray-400 w-5">{idx + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-gray-800 truncate">{emp.nome}</div>
                <div className="text-xs text-gray-400">
                  {emp.cidade}, {emp.estado} · {emp.total_unidades} unidades
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-800">
                  {formatCurrency(emp.vgv_vendido)}
                </div>
                <div className="text-xs text-gray-400">
                  {formatPercent(emp.percentual_vendido)} vendido
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-20 hidden md:block">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min(emp.percentual_vendido ?? 0, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function KPICard({
  label,
  value,
  type,
  color,
  icon,
  sub,
}: {
  label: string
  value: number
  type: 'number' | 'currency' | 'percent'
  color: string
  icon: string
  sub?: string
}) {
  const display =
    type === 'currency'
      ? formatCurrency(value)
      : type === 'percent'
      ? formatPercent(value)
      : value.toLocaleString('pt-BR')

  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100',
    slate: 'bg-slate-50 border-slate-100',
    green: 'bg-green-50 border-green-100',
    sky: 'bg-sky-50 border-sky-100',
    amber: 'bg-amber-50 border-amber-100',
    red: 'bg-red-50 border-red-100',
    purple: 'bg-purple-50 border-purple-100',
    indigo: 'bg-indigo-50 border-indigo-100',
    teal: 'bg-teal-50 border-teal-100',
  }

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color] ?? colorMap.blue}`}>
      <div className="text-xl mb-2">{icon}</div>
      <div className="text-lg font-bold text-gray-900 leading-tight">{display}</div>
      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}
