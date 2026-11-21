// Sessão única Casa Forte (SSO entre subdomínios).
// Em produção (*.casaforteinc.com.br) TODOS os sistemas — Portal, Compras,
// Contratos, Obras, Tabelas e o Financeiro — leem e gravam a sessão Supabase
// no MESMO cookie (`cf-sso`), no domínio pai. Entrou em um, entrou em todos;
// saiu de um, saiu de todos. Fora desse domínio (localhost, previews) cada app
// mantém o cookie padrão do Supabase, como antes.
export const SSO_COOKIE = 'cf-sso'
export const SSO_DOMINIO = '.casaforteinc.com.br'
export const PORTAL_URL = 'https://sistemas.casaforteinc.com.br'

export function ehDominioCasaForte(host?: string | null): boolean {
  const h = (host ?? '').split(',')[0].trim().split(':')[0].toLowerCase()
  return h === 'casaforteinc.com.br' || h.endsWith('.casaforteinc.com.br')
}

export function opcoesCookie(host?: string | null) {
  if (!ehDominioCasaForte(host)) return undefined
  return { name: SSO_COOKIE, domain: SSO_DOMINIO, path: '/', sameSite: 'lax' as const, secure: true }
}

// Endereço de login único (Portal), voltando para `destino` depois de entrar.
export function urlLoginUnico(destino: string): string {
  return `${PORTAL_URL}/login?next=${encodeURIComponent(destino)}`
}

// Só aceita voltar para sistemas da Casa Forte (evita redirecionamento aberto).
export function destinoSeguro(next: string | null | undefined, padrao = '/dashboard'): string {
  if (!next) return padrao
  if (next.startsWith('/') && !next.startsWith('//')) return next
  try {
    const u = new URL(next)
    if (u.protocol === 'https:' && ehDominioCasaForte(u.hostname)) return u.toString()
  } catch {}
  return padrao
}
