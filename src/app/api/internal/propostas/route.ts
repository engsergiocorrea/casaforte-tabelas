import { NextResponse } from 'next/server'
import { requireTabelasInternalKey } from '@/lib/internal-api/auth'
import { createServiceClient } from '@/lib/internal-api/db'

// GET /api/internal/propostas
// Autenticado por TABELAS_INTERNAL_API_KEY (server-to-server). Lista propostas
// para o módulo Contratos. Por padrão retorna apenas as APROVADAS (relevantes
// para gerar contrato). Filtros: ?status=, ?empreendimento_id=, ?unidade_id=,
// ?limit=. Somente leitura — não expõe observações internas.
export async function GET(request: Request) {
  const auth = requireTabelasInternalKey(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const empreendimentoId = searchParams.get('empreendimento_id')
  const unidadeId = searchParams.get('unidade_id')
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100) || 100, 1), 500)

  const supabase = createServiceClient()
  let query = supabase
    .from('propostas')
    .select(
      'id, status_proposta, empreendimento_id, unidade_id, comprador_nome, comprador_documento, ' +
        'valor_proposto, valor_imovel, created_at, updated_at, empreendimentos(nome), unidades(unidade)'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  // Padrão: apenas aprovadas. ?status= permite sobrescrever.
  query = status ? query.eq('status_proposta', status) : query.eq('status_proposta', 'aprovada')
  if (empreendimentoId) query = query.eq('empreendimento_id', empreendimentoId)
  if (unidadeId) query = query.eq('unidade_id', unidadeId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Falha ao consultar propostas.' }, { status: 500 })
  }

  const propostas = (data ?? []).map((p: any) => ({
    id: p.id,
    status_proposta: p.status_proposta,
    empreendimento_id: p.empreendimento_id,
    empreendimento_nome: p.empreendimentos?.nome ?? null,
    unidade_id: p.unidade_id,
    unidade_codigo: p.unidades?.unidade ?? null,
    comprador_nome: p.comprador_nome,
    comprador_documento: p.comprador_documento,
    valor_proposto: p.valor_proposto,
    valor_imovel: p.valor_imovel,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }))

  return NextResponse.json({ propostas })
}
