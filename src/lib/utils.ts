// src/lib/utils.ts

// ============================================================
// FORMATAÇÃO
// ============================================================

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatArea(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(2).replace('.', ',')} m²`
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${value.toFixed(1).replace('.', ',')}%`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

// ============================================================
// CÁLCULOS FINANCEIROS
// ============================================================

export function calcularValorSinal(valorImovel: number, percentual: number): number {
  return (valorImovel * percentual) / 100
}

export function calcularValorParcela(
  valorImovel: number,
  percentualSinal: number,
  percentualChaves: number,
  percentualIntercaladas: number,
  quantidadeParcelas: number
): number {
  const valorSinal = calcularValorSinal(valorImovel, percentualSinal)
  const valorChaves = (valorImovel * percentualChaves) / 100
  const valorIntercaladas = (valorImovel * percentualIntercaladas) / 100
  const saldoParcelas = valorImovel - valorSinal - valorChaves - valorIntercaladas
  return quantidadeParcelas > 0 ? saldoParcelas / quantidadeParcelas : 0
}

export function calcularVGV(unidades: Array<{ valor_imovel?: number | null }>): number {
  return unidades.reduce((acc, u) => acc + (u.valor_imovel ?? 0), 0)
}

// ============================================================
// SLUG
// ============================================================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ============================================================
// CLASSE CONDICIONAL (cn utility)
// ============================================================

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ')
}

// ============================================================
// CORES DE STATUS
// ============================================================

import type { UnidadeStatus } from '@/types'

export function getStatusBadgeClasses(status: UnidadeStatus): string {
  const map: Record<UnidadeStatus, string> = {
    disponivel: 'bg-green-100 text-green-800 border-green-200',
    reservada: 'bg-amber-100 text-amber-800 border-amber-200',
    vendida: 'bg-red-100 text-red-800 border-red-200',
    bloqueada: 'bg-gray-100 text-gray-600 border-gray-200',
    indisponivel: 'bg-gray-50 text-gray-400 border-gray-100',
  }
  return map[status] ?? map.indisponivel
}

export function getStatusRowClasses(status: UnidadeStatus): string {
  const map: Record<UnidadeStatus, string> = {
    disponivel: '',
    reservada: 'bg-amber-50',
    vendida: 'bg-red-50 opacity-75',
    bloqueada: 'bg-gray-50 opacity-60',
    indisponivel: 'bg-gray-50 opacity-50',
  }
  return map[status] ?? ''
}

// ============================================================
// AGRUPAMENTO DE UNIDADES
// ============================================================

export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce(
    (groups, item) => {
      const groupKey = String(item[key] ?? 'Outros')
      if (!groups[groupKey]) groups[groupKey] = []
      groups[groupKey].push(item)
      return groups
    },
    {} as Record<string, T[]>
  )
}

// ============================================================
// POSIÇÕES DISPLAY
// ============================================================

export const POSICAO_LABELS: Record<string, string> = {
  lateral: 'Lateral',
  frente_mar: 'Frente Mar',
  nascente: 'Nascente',
  poente: 'Poente',
  terreo: 'Térreo',
  rooftop: 'Rooftop',
  outra: 'Outra',
}
