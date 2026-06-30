import { NextResponse } from 'next/server'
import { requireTabelasInternalKey } from '@/lib/internal-api/auth'
import { createServiceClient } from '@/lib/internal-api/db'

// GET /api/internal/unidades/[id]
// Dados da unidade necessários ao contrato. Somente leitura.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTabelasInternalKey(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const supabase = createServiceClient()

  const { data: u, error } = await supabase
    .from('unidades')
    .select('id, empreendimento_id, unidade, tipo, categoria, area_privativa_total, area_privativa_externa, valor_imovel, status')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Falha ao consultar unidade.' }, { status: 500 })
  }
  if (!u) {
    return NextResponse.json({ error: 'Unidade não encontrada.' }, { status: 404 })
  }

  return NextResponse.json({
    unidade: {
      id: u.id,
      empreendimento_id: u.empreendimento_id,
      codigo: u.unidade,
      tipologia: u.tipo ?? u.categoria ?? null,
      area_privativa: u.area_privativa_total ?? null,
      area_externa: u.area_privativa_externa ?? null,
      valor_imovel: u.valor_imovel ?? null,
      status: u.status,
    },
  })
}
