// src/app/(public)/page.tsx
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import type { ResumoEmpreendimento } from '@/types'
import { formatCurrency, formatPercent } from '@/lib/utils'
import { EMPREENDIMENTO_STATUS_LABELS } from '@/types'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()

  const { data: empreendimentos } = await supabase
    .from('vw_resumo_empreendimento')
    .select('*')
    .order('nome')

  const { data: allEmpreendimentos } = await supabase
    .from('empreendimentos')
    .select('id, nome, slug, cidade, estado, status, tipo, imagem_capa_url, logo_url, descricao_curta, data_prevista_entrega')
    .eq('ativo_publico', true)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-navy-900 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">CF</span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 text-sm leading-tight">
                  Casa Forte
                </div>
                <div className="text-xs text-gray-500 leading-tight">
                  Tabelas de Vendas
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Atualizado automaticamente
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Empreendimentos Disponíveis
          </h1>
          <p className="text-gray-500">
            Consulte as tabelas de vendas atualizadas. Valores e condições
            sujeitos a alteração sem aviso prévio.
          </p>
        </div>

        {/* Grid de empreendimentos */}
        {allEmpreendimentos && allEmpreendimentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEmpreendimentos.map((emp) => {
              const resumo = empreendimentos?.find((r: ResumoEmpreendimento) => r.id === emp.id)
              return (
                <EmpreendimentoCard
                  key={emp.id}
                  empreendimento={emp}
                  resumo={resumo}
                />
              )
            })}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🏗️</div>
            <p className="text-lg">Nenhum empreendimento disponível no momento.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Casa Forte Construtora e Incorporadora.
            Os valores apresentados são de referência e podem sofrer alteração sem aviso prévio.
          </p>
        </footer>
      </main>
    </div>
  )
}

function EmpreendimentoCard({
  empreendimento,
  resumo,
}: {
  empreendimento: {
    id: string
    nome: string
    slug: string
    cidade: string
    estado: string
    status: string
    tipo: string
    imagem_capa_url?: string | null
    logo_url?: string | null
    descricao_curta?: string | null
    data_prevista_entrega?: string | null
  }
  resumo?: ResumoEmpreendimento
}) {
  const statusLabel =
    EMPREENDIMENTO_STATUS_LABELS[
      empreendimento.status as keyof typeof EMPREENDIMENTO_STATUS_LABELS
    ] ?? empreendimento.status

  const statusColors: Record<string, string> = {
    pre_lancamento: 'bg-purple-100 text-purple-700',
    lancamento: 'bg-blue-100 text-blue-700',
    em_obras: 'bg-amber-100 text-amber-700',
    entregue: 'bg-green-100 text-green-700',
    encerrado: 'bg-gray-100 text-gray-500',
  }
  const statusClass = statusColors[empreendimento.status] ?? statusColors.encerrado

  return (
    <Link href={`/empreendimentos/${empreendimento.slug}`}>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 group">
        {/* Imagem */}
        <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 relative overflow-hidden">
          {empreendimento.imagem_capa_url ? (
            <Image
              src={empreendimento.imagem_capa_url}
              alt={empreendimento.nome}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-slate-300 text-6xl">🏢</div>
            </div>
          )}
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClass}`}>
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-5">
          <h2 className="font-bold text-gray-900 text-lg leading-tight mb-1 group-hover:text-blue-700 transition-colors">
            {empreendimento.nome}
          </h2>
          <p className="text-sm text-gray-500 mb-3">
            {empreendimento.cidade}, {empreendimento.estado}
          </p>

          {empreendimento.descricao_curta && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {empreendimento.descricao_curta}
            </p>
          )}

          {/* Stats */}
          {resumo && (
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">Disponíveis</div>
                <div className="font-semibold text-green-600 text-sm">
                  {resumo.disponiveis}
                </div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-xs text-gray-400 mb-0.5">Reservadas</div>
                <div className="font-semibold text-amber-600 text-sm">
                  {resumo.reservadas}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-0.5">Vendidas</div>
                <div className="font-semibold text-red-600 text-sm">
                  {resumo.vendidas}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {resumo
                ? `${resumo.total_unidades} unidades`
                : 'Ver tabela de vendas'}
            </span>
            <span className="text-xs font-semibold text-blue-700 group-hover:underline">
              Ver tabela →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
