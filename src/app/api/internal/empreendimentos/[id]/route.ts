import { NextResponse } from 'next/server'
import { requireTabelasInternalKey } from '@/lib/internal-api/auth'
import { createServiceClient } from '@/lib/internal-api/db'

// GET /api/internal/empreendimentos/[id]
// Dados do empreendimento necessários ao contrato. Somente leitura.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTabelasInternalKey(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const supabase = createServiceClient()

  const { data: e, error } = await supabase
    .from('empreendimentos')
    .select('id, nome, slug, status, descricao_curta, descricao_completa')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Falha ao consultar empreendimento.' }, { status: 500 })
  }
  if (!e) {
    return NextResponse.json({ error: 'Empreendimento não encontrado.' }, { status: 404 })
  }

  return NextResponse.json({
    empreendimento: {
      id: e.id,
      nome: e.nome,
      slug: e.slug,
      status: e.status,
      descricao: e.descricao_completa ?? e.descricao_curta ?? null,
    },
  })
}
