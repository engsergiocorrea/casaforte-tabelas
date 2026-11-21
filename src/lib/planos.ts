import type { PlanoPagamento } from '@/types'

// Planos de pagamento alternativos de uma unidade (ex.: 48x e 60x).
// A tabela, o PDF e a proposta mostram o plano escolhido; as colunas de
// sempre da unidade guardam o 1º plano.

export function planosDaUnidade(u: { planos_pagamento?: PlanoPagamento[] | null }): PlanoPagamento[] {
  return Array.isArray(u.planos_pagamento) ? u.planos_pagamento.filter((p) => p && p.nome) : []
}

// Nomes de plano presentes em qualquer unidade, na ordem em que aparecem.
export function nomesDePlanos(unidades: { planos_pagamento?: PlanoPagamento[] | null }[]): string[] {
  const out: string[] = []
  for (const u of unidades) for (const p of planosDaUnidade(u)) if (!out.includes(p.nome)) out.push(p.nome)
  return out
}

// Unidade com os valores do plano escolhido (sem plano → como está).
export function comPlano<T extends Record<string, any>>(u: T, nome: string | null | undefined): T {
  const p = nome ? planosDaUnidade(u).find((x) => x.nome === nome) : undefined
  if (!p) return u
  const intercaladas = p.quantidade_intercaladas && p.valor_intercalada ? p.quantidade_intercaladas * p.valor_intercalada : null
  return {
    ...u,
    valor_sinal: p.valor_sinal ?? null,
    percentual_sinal: p.percentual_sinal ?? null,
    quantidade_parcelas: p.quantidade_parcelas ?? null,
    valor_parcela: p.valor_parcela ?? null,
    quantidade_intercaladas: p.quantidade_intercaladas ?? null,
    periodicidade_intercaladas: p.periodicidade_intercaladas ?? u.periodicidade_intercaladas ?? null,
    valor_intercalada: p.valor_intercalada ?? null,
    valor_total_intercaladas: intercaladas,
    valor_chaves: p.valor_chaves ?? null,
  }
}

// "15% de sinal + 48 mensais + 8 intercaladas semestrais"
export function descreverPlano(u: Record<string, any>, nome: string): string | null {
  const p = planosDaUnidade(u).find((x) => x.nome === nome)
  if (!p) return null
  return [
    p.percentual_sinal ? `${p.percentual_sinal}% de sinal` : 'sinal',
    p.quantidade_parcelas ? `${p.quantidade_parcelas} mensais` : null,
    p.quantidade_intercaladas ? `${p.quantidade_intercaladas} intercaladas ${p.periodicidade_intercaladas ?? ''}`.trim() : null,
    p.valor_chaves ? 'chaves' : null,
  ].filter(Boolean).join(' + ')
}
