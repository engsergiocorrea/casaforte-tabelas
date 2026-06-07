import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ExcluirEngenheiro from '@/components/engenheiros/ExcluirEngenheiro'

export default async function EngenheiroDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: eng } = await supabase.from('engenheiros').select('*').eq('id', id).single()
  if (!eng) notFound()

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
          <Link href="/admin/engenheiros" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Engenheiros</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>{eng.nome}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExcluirEngenheiro engenheiroId={eng.id} usuarioId={eng.usuario_id} />
          <Link href={'/admin/engenheiros/' + id + '/editar'}
            style={{ padding: '8px 16px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Editar
          </Link>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Dados pessoais</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Nome', eng.nome)}
          {campo('Cargo', eng.cargo)}
          {campo('E-mail', eng.email)}
          {campo('Telefone', eng.telefone)}
          {campo('CPF', eng.cpf)}
          {campo('Status', eng.ativo ? 'Ativo' : 'Inativo')}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Registro profissional</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {campo('Tipo', eng.tipo_registro)}
          {campo('Número', eng.registro_profissional)}
          {campo('UF', eng.uf_registro)}
        </div>
      </div>

      {eng.assinatura_url && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Assinatura</h2>
          <img src={eng.assinatura_url} alt="Assinatura" style={{ maxHeight: '80px', objectFit: 'contain' }} />
        </div>
      )}

      {eng.observacoes && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Observações</h2>
          <p style={{ fontSize: '14px', color: '#374151' }}>{eng.observacoes}</p>
        </div>
      )}
    </div>
  )
}
