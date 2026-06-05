import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Cliente } from '@/types'

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*')
    .order('nome')

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111' }}>Clientes</h1>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>{clientes?.length ?? 0} cadastrados</p>
        </div>
        <Link href="/admin/clientes/novo" style={{ padding: '8px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          + Novo cliente
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', overflow: 'hidden' }}>
        {!clientes || clientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
            <p style={{ fontSize: '1rem', color: '#374151', fontWeight: '500' }}>Nenhum cliente cadastrado</p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Nome', 'E-mail', 'Telefone', 'CPF/CNPJ', 'Cidade', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientes.map((cli: Cliente) => (
                <tr key={cli.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 14px', fontWeight: '600', color: '#111' }}>{cli.nome}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{cli.email ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{cli.telefone ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{cli.cpf_cnpj ?? '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{cli.cidade ? cli.cidade + (cli.estado ? '/' + cli.estado : '') : '—'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: cli.ativo ? '#dcfce7' : '#f3f4f6', color: cli.ativo ? '#15803d' : '#6b7280' }}>
                      {cli.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <Link href={'/admin/clientes/' + cli.id} style={{ padding: '3px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px', color: '#374151', textDecoration: 'none' }}>
                      Ver
                    </Link>
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
