import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AprovarRecusarButtons from './AprovarRecusarButtons'

export default async function PropostaDetalhePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: proposta } = await supabase
    .from('propostas')
    .select('*, empreendimentos(nome), unidades(unidade, pavimento, area_construida, quartos, valor_imovel)')
    .eq('id', params.id)
    .single()

  if (!proposta) notFound()

  const unidade = proposta.unidades as any
  const empreendimento = proposta.empreendimentos as any

  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'
  const fmtData = (v: any) => v ? new Date(v).toLocaleDateString('pt-BR') : '—'

  const statusConfig: Record<string, { bg: string, color: string, label: string }> = {
    pendente:  { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendente' },
    aprovada:  { bg: '#dcfce7', color: '#15803d', label: '✅ Aprovada' },
    recusada:  { bg: '#fee2e2', color: '#b91c1c', label: '❌ Recusada' },
    cancelada: { bg: '#f3f4f6', color: '#6b7280', label: '🚫 Cancelada' },
  }
  const sc = statusConfig[proposta.status_proposta ?? 'pendente'] ?? statusConfig.pendente

  const campo = (label: string, valor: any) => valor ? (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{valor}</div>
    </div>
  ) : null

  const secao = (titulo: string, children: React.ReactNode) => (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>{titulo}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Link href="/admin/propostas" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>
          ← Propostas
        </Link>
        <span style={{ color: '#d1d5db' }}>/</span>
        <span style={{ fontSize: '13px', color: '#111' }}>Detalhe</span>
      </div>

      {/* Info geral */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '20px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#111', marginBottom: '4px' }}>
              {empreendimento?.nome}
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280' }}>
              Unidade {unidade?.unidade} · {unidade?.pavimento} · Recebida em {fmtData(proposta.created_at)}
            </p>
          </div>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: sc.bg, color: sc.color }}>
            {sc.label}
          </span>
        </div>
      </div>

      {/* Botões aprovar/recusar */}
      {proposta.status_proposta === 'pendente' && (
        <AprovarRecusarButtons propostaId={proposta.id} />
      )}

      {/* Unidade */}
      {secao('🏠 Unidade',
        <>
          {campo('Unidade', unidade?.unidade)}
          {campo('Pavimento', unidade?.pavimento)}
          {campo('Área', unidade?.area_construida ? `${unidade.area_construida}m²` : null)}
          {campo('Quartos', unidade?.quartos)}
          {campo('Valor tabela', fmt(unidade?.valor_imovel))}
        </>
      )}

      {/* Comprador */}
      {secao('👤 Comprador',
        <>
          {campo('Nome completo', proposta.comprador1_nome)}
          {campo('CPF', proposta.comprador1_cpf)}
          {campo('RG', proposta.comprador1_rg)}
          {campo('Profissão', proposta.comprador1_profissao)}
          {campo('Data de nascimento', proposta.comprador1_nascimento ? new Date(proposta.comprador1_nascimento).toLocaleDateString('pt-BR') : null)}
          {campo('Estado civil', proposta.comprador1_estado_civil)}
          {campo('E-mail', proposta.comprador1_email)}
          {campo('Telefone', proposta.comprador1_telefone)}
        </>
      )}

      {/* Cônjuge */}
      {proposta.conjuge_nome && secao('💍 Cônjuge',
        <>
          {campo('Nome completo', proposta.conjuge_nome)}
          {campo('CPF', proposta.conjuge_cpf)}
          {campo('RG', proposta.conjuge_rg)}
          {campo('Profissão', proposta.conjuge_profissao)}
          {campo('E-mail', proposta.conjuge_email)}
          {campo('Telefone', proposta.conjuge_telefone)}
        </>
      )}

      {/* 2º Comprador */}
      {proposta.comprador2_nome && secao('👤 Segundo Comprador',
        <>
          {campo('Nome completo', proposta.comprador2_nome)}
          {campo('CPF', proposta.comprador2_cpf)}
          {campo('RG', proposta.comprador2_rg)}
          {campo('Profissão', proposta.comprador2_profissao)}
          {campo('E-mail', proposta.comprador2_email)}
          {campo('Telefone', proposta.comprador2_telefone)}
        </>
      )}

      {/* Corretor */}
      {secao('🏢 Corretor / Imobiliária',
        <>
          {campo('Nome', proposta.corretor_nome)}
          {campo('CPF/CNPJ', proposta.corretor_cpf_cnpj)}
          {campo('CRECI', proposta.corretor_creci)}
          {campo('E-mail', proposta.corretor_email)}
          {campo('Telefone', proposta.corretor_telefone)}
          {campo('Imobiliária', proposta.imobiliaria_nome)}
        </>
      )}

      {/* Pagamento */}
      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', color: '#111', marginBottom: '16px' }}>💰 Condições de Pagamento</h2>
        <div style={{ marginBottom: '16px', padding: '14px', background: '#f8fafc', borderRadius: '10px' }}>
          <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px', textTransform: 'uppercase' }}>Valor total proposto</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#E8390E' }}>{fmt(proposta.valor_proposto)}</div>
          {proposta.segue_tabela && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>Segue valores da tabela</div>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Sinal', fmt(proposta.valor_sinal))}
          {campo('Parcelas mensais', proposta.quantidade_parcelas ? `${proposta.quantidade_parcelas}x de ${fmt(proposta.valor_parcela)}` : null)}
          {campo('Intercaladas', proposta.quantidade_intercaladas ? `${proposta.quantidade_intercaladas}x de ${fmt(proposta.valor_intercalada)} (${proposta.periodicidade_intercaladas})` : null)}
          {campo('Chaves', fmt(proposta.valor_chaves))}
          {campo('Obs. pagamento', proposta.observacoes_pagamento)}
        </div>
      </div>

      {/* Observações */}
      {proposta.observacoes && secao('📝 Observações',
        <div style={{ gridColumn: '1/-1', fontSize: '14px', color: '#374151' }}>{proposta.observacoes}</div>
      )}

      {/* Links */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
        <a href={`/admin/propostas/${proposta.id}/pdf`} target="_blank" rel="noreferrer"
          style={{ padding: '10px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
          📄 Ver PDF
        </a>
        <Link href="/admin/propostas"
          style={{ padding: '10px 20px', background: 'white', border: '1px solid #DDD9D3', color: '#374151', borderRadius: '8px', textDecoration: 'none', fontSize: '14px' }}>
          ← Voltar
        </Link>
      </div>
    </div>
  )
}
