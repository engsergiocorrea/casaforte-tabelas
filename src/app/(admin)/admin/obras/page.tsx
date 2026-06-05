import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Obra } from '@/types'
import { OBRA_STATUS_LABELS } from '@/types'

export default async function ObrasPage() {
  const supabase = await createClient()

  const { data: obras } = await supabase
    .from('obras')
    .select('*, engenheiros(nome), empreendimentos(nome)')
    .order('created_at', { ascending: false })

  const statusColors: Record<string, { bg: string, color: string }> = {
    planejamento:  { bg: '#eff6ff', color: '#1d4ed8' },
    em_andamento:  { bg: '#dcfce7', color: '#15803d' },
    paralisada:    { bg: '#fef3c7', color: '#92400e' },
    concluida:     { bg: '#f0fdf4', color: '#166534' },
    entregue:      { bg: '#dbeafe', color: '#1e40af' },
    cancelada:     { bg: '#fee2e2', color: '#b91c1c' },
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>Obras</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{obras?.length ?? 0} cadastradas</p>
        </div>
        <Link href="/admin/obras/nova" style={{ padding: '8px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          + Nova obra
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', overflow: 'hidden' }}>
        {!obras || obras.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏗️</div>
            <p style={{ fontSize: '1rem', color: '#374151', fontWeight: '500' }}>Nenhuma obra cadastrada</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nome', 'Tipo', 'Cidade', 'Responsável', 'Início', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obras.map((obra: any) => {
                const sc = statusColors[obra.status] ?? statusColors.planejamento
                return (
                  <tr key={obra.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111' }}>{obra.nome}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{obra.tipo ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{obra.cidade ? obra.cidade + (obra.estado ? '/' + obra.estado : '') : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{obra.engenheiros?.nome ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: sc.bg, color: sc.color }}>
                        {OBRA_STATUS_LABELS[obra.status as keyof typeof OBRA_STATUS_LABELS]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={'/admin/obras/' + obra.id} style={{ padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', textDecoration: 'none' }}>
                        Ver
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
