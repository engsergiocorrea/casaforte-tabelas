import { NextRequest, NextResponse } from 'next/server'
import { exigirPapel } from '@/lib/auth/guard'

// Altera o status de várias unidades de uma vez (ex.: marcar várias como
// indisponível). Exige usuário logado com papel administrativo.
const STATUSES = new Set(['disponivel', 'reservada', 'vendida', 'bloqueada', 'indisponivel'])

export async function POST(req: NextRequest) {
  try {
    const g = await exigirPapel()
    if (g.erro) return g.erro
    const { admin } = g

    const { empreendimento_id, unidade_ids, status } = await req.json()
    if (!empreendimento_id || !Array.isArray(unidade_ids) || unidade_ids.length === 0 || !STATUSES.has(status)) {
      return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 })
    }
    const { data, error } = await admin
      .from('unidades')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('empreendimento_id', empreendimento_id)
      .in('id', unidade_ids)
      .select('id')
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, atualizadas: data?.length ?? 0 })
  } catch (err: any) {
    return NextResponse.json({ erro: err?.message ?? 'Erro inesperado.' }, { status: 500 })
  }
}
