import { createAdminClient } from '@/lib/supabase/server'

// Convites (links) para tabelas "Só diretoria". Quem abre /c/<token> recebe
// o token num cookie httpOnly; as páginas da tabela checam o token no banco
// (válido, não revogado, não expirado, do mesmo empreendimento).

export const CONVITES_COOKIE = 'cf_convites'
export const CONVITES_MAX_AGE = 60 * 60 * 24 * 120 // 120 dias

export function tokensDoCookie(raw: string | undefined | null): string[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(decodeURIComponent(raw))
    return Array.isArray(arr) ? arr.filter((t) => typeof t === 'string' && /^[A-Za-z0-9_-]{20,80}$/.test(t)).slice(0, 30) : []
  } catch { return [] }
}
export const cookieComToken = (raw: string | undefined | null, token: string) =>
  encodeURIComponent(JSON.stringify([token, ...tokensDoCookie(raw).filter((t) => t !== token)].slice(0, 30)))

type Convite = { id: string; empreendimento_id: string; token: string; expira_em: string | null; revogado_em: string | null }
const valido = (c: Convite) => !c.revogado_em && (!c.expira_em || new Date(c.expira_em) > new Date())

// Empreendimentos liberados pelos convites do cookie.
export async function empreendimentosConvidados(tokens: string[]): Promise<Set<string>> {
  if (!tokens.length) return new Set()
  const { data } = await createAdminClient().from('tabela_convites').select('id, empreendimento_id, token, expira_em, revogado_em').in('token', tokens)
  return new Set(((data ?? []) as Convite[]).filter(valido).map((c) => c.empreendimento_id))
}

export async function conviteValido(token: string): Promise<(Convite & { slug: string }) | null> {
  if (!/^[A-Za-z0-9_-]{20,80}$/.test(token)) return null
  const admin = createAdminClient()
  const { data } = await admin.from('tabela_convites').select('id, empreendimento_id, token, expira_em, revogado_em, empreendimentos(slug)').eq('token', token).maybeSingle()
  if (!data || !valido(data as any)) return null
  return { ...(data as any), slug: (data as any).empreendimentos?.slug }
}

export async function registrarAcessoConvite(id: string) {
  const admin = createAdminClient()
  const { data } = await admin.from('tabela_convites').select('acessos').eq('id', id).maybeSingle()
  await admin.from('tabela_convites').update({ acessos: (data?.acessos ?? 0) + 1, ultimo_acesso: new Date().toISOString() }).eq('id', id)
}
