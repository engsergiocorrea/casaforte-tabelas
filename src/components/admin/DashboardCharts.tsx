'use client'
// src/components/admin/DashboardCharts.tsx

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  LineChart, Line, Area, AreaChart,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface Props {
  vendasPorMes: Array<{ mes: string; valor: number; qtd: number }>
  empreendimentos: Array<{
    nome: string
    vgv_total: number
    vgv_vendido: number
    percentual_vendido: number
    disponiveis: number
    vendidas: number
    reservadas: number
  }>
  unidades: {
    disponiveis: number
    reservadas: number
    vendidas: number
  }
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function formatMes(mesStr: string) {
  const [, mes] = mesStr.split('-')
  return MESES_PT[parseInt(mes, 10) - 1] ?? mesStr
}

const PIE_COLORS = ['#16a34a', '#d97706', '#dc2626']

export function DashboardCharts({ vendasPorMes, empreendimentos, unidades }: Props) {
  const pieData = [
    { name: 'Disponíveis', value: unidades.disponiveis },
    { name: 'Reservadas', value: unidades.reservadas },
    { name: 'Vendidas', value: unidades.vendidas },
  ].filter(d => d.value > 0)

  const vendasFormatadas = vendasPorMes.map(v => ({
    ...v,
    mesLabel: formatMes(v.mes),
  }))

  const emprTop = empreendimentos.slice(0, 6).map(e => ({
    nome: e.nome.length > 18 ? e.nome.substring(0, 16) + '…' : e.nome,
    vendido: e.vgv_vendido ?? 0,
    disponivel: (e.vgv_total ?? 0) - (e.vgv_vendido ?? 0),
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Vendas por mês */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Vendas dos Últimos 12 Meses</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={vendasFormatadas}>
            <defs>
              <linearGradient id="colorVenda" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="mesLabel"
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v), 'Vendas']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Area
              type="monotone"
              dataKey="valor"
              stroke="#2563eb"
              strokeWidth={2}
              fill="url(#colorVenda)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pie - unidades por status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">Unidades por Status</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
              label={({ name, percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i]} />
              ))}
            </Pie>
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
              )}
            />
            <Tooltip
              formatter={(v: number) => [v, 'unidades']}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* VGV por empreendimento */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm">
          VGV Vendido vs Disponível por Empreendimento
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={emprTop} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `R$${(v / 1_000_000).toFixed(1)}M`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="nome"
              tick={{ fontSize: 11, fill: '#374151' }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip
              formatter={(v: number, name: string) => [
                formatCurrency(v),
                name === 'vendido' ? 'VGV Vendido' : 'VGV Disponível',
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="vendido" fill="#16a34a" radius={[0, 4, 4, 0]} maxBarSize={20} name="vendido" />
            <Bar dataKey="disponivel" fill="#e2e8f0" radius={[0, 4, 4, 0]} maxBarSize={20} name="disponivel" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
