import { createClient as createServerClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { RELATORIO_STATUS_LABELS, RELATORIO_STATUS_COLORS } from '@/types'

export default async function RDOsPage() {
  const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

  const { data: rdos } = await supabase
    .from('relatorios')
    .select('*, obras(nome), clientes(nome), engenheiros(nome), profiles(nome)')
    .eq('tipo', 'rdo')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>RDOs</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>Relatórios Diários de Obra</p>
        </div>
        <Link href="/admin/rdos/novo" style={{ padding: '8px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          + Novo RDO
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', overflow: 'hidden' }}>
        {!rdos || rdos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <p style={{ fontSize: '1rem', color: '#374151', fontWeight: '500' }}>Nenhum RDO criado ainda</p>
            <Link href="/admin/rdos/novo" style={{ display: 'inline-block', marginTop: '12px', padding: '8px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
              Criar primeiro RDO
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nº', 'Data', 'Obra', 'Engenheiro', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rdos.map((rdo: any) => {
                const sc = RELATORIO_STATUS_COLORS[rdo.status as keyof typeof RELATORIO_STATUS_COLORS]
                return (
                  <tr key={rdo.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111' }}>#{rdo.numero ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{rdo.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#111' }}>{(rdo.obras as any)?.nome ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#6b7280' }}>{(rdo.engenheiros as any)?.nome ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: sc?.bg, color: sc?.color }}>
                        {RELATORIO_STATUS_LABELS[rdo.status as keyof typeof RELATORIO_STATUS_LABELS]}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={'/admin/rdos/' + rdo.id} style={{ padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', textDecoration: 'none' }}>
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
