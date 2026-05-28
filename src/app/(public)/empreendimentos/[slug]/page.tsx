// src/app/(public)/empreendimentos/[slug]/page.tsx
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TabelaPublica } from '@/components/public/TabelaPublica'
import { formatDate } from '@/lib/utils'
import { INDICE_LABELS, EMPREENDIMENTO_STATUS_LABELS } from '@/types'

export const revalidate = 30

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('empreendimentos')
    .select('nome, descricao_curta, cidade, estado')
    .eq('slug', params.slug)
    .eq('ativo_publico', true)
    .single()

  if (!data) return { title: 'Empreendimento não encontrado' }

  return {
    title: `${data.nome} | Casa Forte Tabelas de Vendas`,
    description:
      data.descricao_curta ??
      `Tabela de vendas de ${data.nome} em ${data.cidade}, ${data.estado}`,
  }
}

export default async function EmpreendimentoPage({ params }: Props) {
  const supabase = await createClient()

  // Buscar empreendimento
  const { data: empreendimento } = await supabase
    .from('empreendimentos')
    .select('*')
    .eq('slug', params.slug)
    .eq('ativo_publico', true)
    .single()

  if (!empreendimento) notFound()

  // Buscar unidades
  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento', { ascending: true })
    .order('unidade', { ascending: true })

  // Buscar configurações
  const { data: configuracao } = await supabase
    .from('configuracoes_tabela')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs">CF</span>
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                ← Todos os empreendimentos
              </span>
              <span className="text-sm text-gray-600 sm:hidden">← Voltar</span>
            </Link>
            <a
              href={`/empreendimentos/${params.slug}/download`}
              className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M7.5 1v9m0 0l-3-3m3 3l3-3M1 11v1a2 2 0 002 2h9a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Baixar PDF
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero do empreendimento */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          {/* Imagem de capa */}
          {empreendimento.imagem_capa_url && (
            <div className="h-56 md:h-72 relative">
              <Image
                src={empreendimento.imagem_capa_url}
                alt={empreendimento.nome}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-6 right-6">
                {empreendimento.logo_url && (
                  <Image
                    src={empreendimento.logo_url}
                    alt={`Logo ${empreendimento.nome}`}
                    width={120}
                    height={40}
                    className="mb-2 object-contain"
                  />
                )}
              </div>
            </div>
          )}

          {/* Info do empreendimento */}
          <div className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {EMPREENDIMENTO_STATUS_LABELS[empreendimento.status as keyof typeof EMPREENDIMENTO_STATUS_LABELS]}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">{empreendimento.tipo}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {empreendimento.nome}
                </h1>
                <p className="text-gray-500 mt-1">
                  {[empreendimento.localizacao, empreendimento.cidade, empreendimento.estado]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              {empreendimento.data_prevista_entrega && (
                <div className="text-right">
                  <div className="text-xs text-gray-400">Previsão de entrega</div>
                  <div className="font-semibold text-gray-700">
                    {formatDate(empreendimento.data_prevista_entrega)}
                  </div>
                </div>
              )}
            </div>

            {empreendimento.descricao_curta && (
              <p className="text-gray-600 text-sm mb-4">{empreendimento.descricao_curta}</p>
            )}

            {/* Condições comerciais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl">
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Correção até a entrega</div>
                <div className="text-sm font-semibold text-gray-700">
                  {INDICE_LABELS[empreendimento.indice_ate_entrega as keyof typeof INDICE_LABELS]}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-0.5">Correção após entrega</div>
                <div className="text-sm font-semibold text-gray-700">
                  {INDICE_LABELS[empreendimento.indice_apos_entrega as keyof typeof INDICE_LABELS]}
                </div>
              </div>
              {empreendimento.parcelas_padrao > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-0.5">Parcelamento padrão</div>
                  <div className="text-sm font-semibold text-gray-700">
                    Até {empreendimento.parcelas_padrao}x mensais
                  </div>
                </div>
              )}
            </div>

            {empreendimento.observacoes_publicas && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <span className="font-semibold">Observações: </span>
                  {empreendimento.observacoes_publicas}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Tabela de vendas */}
        <TabelaPublica
          empreendimento={empreendimento}
          unidades={unidades ?? []}
          configuracao={configuracao}
        />

        {/* Aviso legal */}
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-xl text-center">
          <p className="text-xs text-gray-400">
            ⚠️ Os valores e condições apresentados são de referência e podem sofrer
            alteração sem aviso prévio. • Última atualização:{' '}
            {formatDate(empreendimento.updated_at)} • Casa Forte Construtora e Incorporadora
          </p>
        </div>
      </main>
    </div>
  )
}
