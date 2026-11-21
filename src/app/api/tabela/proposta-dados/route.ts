import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { acessoTabela, carregarEmpreendimento } from '@/lib/acesso-tabela'
import { COLUNAS_UNIDADE_PUBLICA, STATUS_UNIDADE_PUBLICO } from '@/lib/unidades-publicas'

// Dados da tela de proposta (empreendimento + unidade), com a mesma regra de
// acesso da tabela: pública, diretoria logada ou link de convite.
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? ''
  const unidadeId = req.nextUrl.searchParams.get('unidade') ?? ''
  const empreendimento = await carregarEmpreendimento(slug)
  if (!empreendimento || !(await acessoTabela(empreendimento))) return NextResponse.json({ erro: 'Não encontrado' }, { status: 404 })
  const { data: unidade } = await createAdminClient()
    .from('unidades').select(COLUNAS_UNIDADE_PUBLICA)
    .eq('id', unidadeId).eq('empreendimento_id', empreendimento.id)
    .in('status', STATUS_UNIDADE_PUBLICO as unknown as string[])
    .maybeSingle()
  if (!unidade) return NextResponse.json({ erro: 'Unidade não encontrada' }, { status: 404 })
  return NextResponse.json({ empreendimento, unidade }, { headers: { 'Cache-Control': 'no-store' } })
}
