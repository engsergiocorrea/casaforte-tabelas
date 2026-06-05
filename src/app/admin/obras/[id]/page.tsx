import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { OBRA_STATUS_LABELS } from '@/types'

export default async function ObraDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: obra } = await supabase
    .from('obras')
    .select('*, engenheiros(nome, cargo, registro_profissional, tipo_registro, uf_registro), empreendimentos(nome)')
    .eq('id', id)
    .single()
  if (!obra) notFound()

  const statusColors: Record<string, { bg: string, color: string }> = {
    planejamento: { bg: '#eff6ff', color: '#1d4ed8' },
    em_andamento: { bg: '#dcfce7', color: '#15803d' },
    paralisada:   { bg: '#fef3c7', color: '#92400e' },
    concluida:    { bg: '#f0fdf4', color: '#166534' },
    entregue:     { bg: '#dbeafe', color: '#1e40af' },
    cancelada:    { bg: '#fee2e2', color: '#b91c1c' },
  }
  const sc = statusColors[obra.status] ?? statusColors.planejamento

  const campo = (label: string, valor: any) => valor ? (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{valor}</div>
    </div>
  ) : null

  const prazoDecorrido = obra.data_inicio
    ? Math.floor((new Date().getTime() - new Date(obra.data_inicio).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const prazoAVencer = prazoDecorrido !== null && obra.prazo_contratual_dias
    ? obra.prazo_contratual_dias - prazoDecorrido
    : null

  return (
    <div style={{ maxWidth: '700px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <Link href="/admin/obras" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Obras</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>{obra.nome}</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: sc.bg, color: sc.color }}>
            {OBRA_STATUS_LABELS[obra.status as keyof typeof OBRA_STATUS_LABELS]}
          </span>
          <Link href={'/admin/obras/' + id + '/editar'} style={{ padding: '8px 16px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            Editar
          </Link>
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Identificação</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Nome', obra.nome)}
          {campo('Tipo', obra.tipo)}
          {campo('Empreendimento', (obra.empreendimentos as any)?.nome)}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Localização</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Endereço', obra.endereco)}
          {campo('Cidade', obra.cidade)}
          {campo('Estado', obra.estado)}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Contratante</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Nome', obra.contratante_nome)}
          {campo('CPF / CNPJ', obra.contratante_cpf_cnpj)}
        </div>
      </div>
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          {campo('Data de início', obra.data_inicio ? new Date(obra.data_inicio).toLocaleDateString('pt-BR') : null)}
          {campo('Prazo contratual', obra.prazo_contratual_dias ? obra.prazo_contratual_dias + ' dias' : null)}
          {campo('Previsão de conclusão', obra.data_prevista_conclusao ? new Date(obra.data_prevista_conclusao).toLocaleDateString('pt-BR') : null)}
          {prazoDecorrido !== null && campo('Prazo decorrido', prazoDecorrido + ' dias')}
          {prazoAVencer !== null && campo('Prazo a vencer', prazoAVencer + ' dias')}
        </div>
      </div>
      {obra.engenheiros && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Responsável técnico</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {campo('Nome', (obra.engenheiros as any)?.nome)}
            {campo('Cargo', (obra.engenheiros as any)?.cargo)}
            {campo('Registro', (obra.engenheiros as any)?.registro_profissional ? (obra.engenheiros as any).tipo_registro + ' ' + (obra.engenheiros as any).registro_profissional + ((obra.engenheiros as any).uf_registro ? '/' + (obra.engenheiros as any).uf_registro : '') : null)}
          </div>
        </div>
      )}
      {obra.observacoes && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Observações</h2>
          <p style={{ fontSize: '14px', color: '#374151' }}>{obra.observacoes}</p>
        </div>
      )}
      <div style={{ marginTop: '8px' }}>
        <Link href={'/admin/relatorios/novo?obra=' + id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#1E1E1E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          📋 Novo RDO para esta obra
        </Link>
      </div>
    </div>
  )
}
