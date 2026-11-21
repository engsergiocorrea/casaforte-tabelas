import { NextResponse, type NextRequest } from 'next/server'
import { ehDominioCasaForte, urlLoginUnico } from './sso'

// Em produção, a tela de login de cada sistema vira um desvio para o login
// único do Portal; depois de entrar, a pessoa volta para `destinos[caminho]`
// deste sistema já autenticada (cookie compartilhado).
// Trava anti-loop: se o desvio aconteceu há menos de 60s e a pessoa voltou
// para cá sem sessão, mostra o login local em vez de desviar de novo.
const IDA = 'cf_sso_ida'

export function desviarParaLoginUnico(request: NextRequest, destinos: Record<string, string>) {
  const destino = destinos[request.nextUrl.pathname]
  if (!destino) return null
  const host = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '').split(',')[0].trim()
  if (!ehDominioCasaForte(host) || host.startsWith('sistemas.')) return null
  if (request.cookies.get(IDA)) return null
  const res = NextResponse.redirect(urlLoginUnico(`https://${host}${destino}`))
  res.cookies.set(IDA, '1', { maxAge: 60, path: '/', httpOnly: true, secure: true, sameSite: 'lax' })
  return res
}
