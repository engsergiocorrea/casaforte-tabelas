import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Engenheiro } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EngenheirosPage() {
  const supabase = await createClient()
  const { data: engenheiros } = await supabase.from('engenheiros').select('*').order('nome')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>Engenheiros</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{engenheiros?.length ?? 0} cadastrados</p>
        </div>
        <Link href="/admin/engenheiros/novo" style={{ padding: '8px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          + Novo engenheiro
        </Link>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', overflow: 'hidden' }}>
        {!engenheiros || engenheiros.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👷</div>
            <p style={{ fontSize: '1rem', color: '#374151', fontWeight: '500' }}>Nenhum engenheiro cadastrado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nome', 'Cargo', 'Registro', 'E-mail', 'Telefone', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engenheiros.map((eng: Engenheiro) => (
                <tr key={eng.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111' }}>{eng.nome}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{eng.cargo ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>
                    {eng.registro_profissional ? eng.tipo_registro + ' ' + eng.registro_profissional + (eng.uf_registro ? '/' + eng.uf_registro : '') : '—'}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{eng.email ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{eng.telefone ?? '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: eng.ativo ? '#dcfce7' : '#f3f4f6', color: eng.ativo ? '#15803d' : '#6b7280' }}>
                      {eng.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link href={'/admin/engenheiros/' + eng.id} style={{ padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', textDecoration: 'none' }}>Ver</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
