import { randomBytes } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { ehDiretoria } from '@/lib/diretoria'

// Links de convite das tabelas "Só diretoria" — só a diretoria gera/vê/revoga.
//   GET    ?empreendimento_id=…            → lista
//   POST   { empreendimento_id, rotulo, dias } → cria (dias vazio = sem validade)
//   DELETE ?id=…                          → revoga
export const dynamic = 'force-dynamic'

async function guarda() {
  const supabase = await createClient()
  if (!(await ehDiretoria(supabase))) return { erro: NextResponse.json({ erro: 'Só a diretoria gerencia convites.' }, { status: 403 }) }
  const { data: { user } } = await supabase.auth.getUser()
  return { userId: user?.id ?? null }
}

export async function GET(req: NextRequest) {
  const g = await guarda(); if ('erro' in g) return g.erro
  const emp = req.nextUrl.searchParams.get('empreendimento_id')
  if (!emp) return NextResponse.json({ erro: 'empreendimento_id' }, { status: 400 })
  const { data } = await createAdminClient().from('tabela_convites')
    .select('id, token, rotulo, criado_em, expira_em, revogado_em, acessos, ultimo_acesso')
    .eq('empreendimento_id', emp).order('criado_em', { ascending: false })
  const origem = req.nextUrl.origin
  return NextResponse.json((data ?? []).map((c) => ({ ...c, link: `${origem}/c/${c.token}` })))
}

export async function POST(req: NextRequest) {
  const g = await guarda(); if ('erro' in g) return g.erro
  const b: any = await req.json().catch(() => ({}))
  if (!b?.empreendimento_id) return NextResponse.json({ erro: 'empreendimento_id' }, { status: 400 })
  const dias = Number(b?.dias) || null
  const token = randomBytes(24).toString('base64url')
  const { data, error } = await createAdminClient().from('tabela_convites').insert([{
    empreendimento_id: b.empreendimento_id, token, rotulo: String(b?.rotulo ?? '').trim().slice(0, 80) || null,
    criado_por: g.userId, expira_em: dias ? new Date(Date.now() + dias * 86_400_000).toISOString() : null,
  }]).select('id, token').single()
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id, link: `${req.nextUrl.origin}/c/${data.token}` })
}

export async function DELETE(req: NextRequest) {
  const g = await guarda(); if ('erro' in g) return g.erro
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ erro: 'id' }, { status: 400 })
  await createAdminClient().from('tabela_convites').update({ revogado_em: new Date().toISOString() }).eq('id', id)
  return NextResponse.json({ ok: true })
}
