import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ClienteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: cli } = await supabase.from('clientes').select('*').eq('id', id).single()
  if (!cli) notFound()

  const campo = (label: string, valor: any) => valor ? (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{valor}</div>
    </div>
  ) : null

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link href="/admin/clientes" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Clientes</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>{cli.nome}</h1>
        </div>
        <Link href={'/admin/clientes/' + id + '/editar'} style={{ padding: '8px 16px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          Editar
        </Link>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Dados do cliente</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Nome', cli.nome)}
          {campo('E-mail', cli.email)}
          {campo('Telefone', cli.telefone)}
          {campo('CPF / CNPJ', cli.cpf_cnpj)}
          {campo('Status', cli.ativo ? 'Ativo' : 'Inativo')}
        </div>
      </div>
      {(cli.endereco || cli.cidade || cli.estado) && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Endereço</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {campo('Endereço', cli.endereco)}
            {campo('Cidade', cli.cidade)}
            {campo('Estado', cli.estado)}
          </div>
        </div>
      )}
      {cli.observacoes && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Observações</h2>
          <p style={{ fontSize: '14px', color: '#374151' }}>{cli.observacoes}</p>
        </div>
      )}
    </div>
  )
}
