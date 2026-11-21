import { NextRequest, NextResponse } from 'next/server'
import { CONVITES_COOKIE, CONVITES_MAX_AGE, conviteValido, cookieComToken, registrarAcessoConvite } from '@/lib/convites'

// Link de convite: tabelas.casaforteinc.com.br/c/<token>
// Válido → guarda o token (cookie httpOnly) e abre a tabela do empreendimento.
// O corretor ainda passa pela identificação (nome/CRECI), como sempre.
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const c = await conviteValido(token)
  if (!c?.slug) return NextResponse.redirect(new URL('/?convite=invalido', req.url), { status: 302 })
  await registrarAcessoConvite(c.id).catch(() => null)
  const res = NextResponse.redirect(new URL(`/empreendimentos/${c.slug}`, req.url), { status: 302 })
  res.cookies.set(CONVITES_COOKIE, cookieComToken(req.cookies.get(CONVITES_COOKIE)?.value, token), {
    httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: CONVITES_MAX_AGE,
  })
  return res
}
