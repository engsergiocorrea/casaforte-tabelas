import { cookies } from 'next/headers'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { ehDiretoria } from '@/lib/diretoria'
import { CONVITES_COOKIE, empreendimentosConvidados, tokensDoCookie } from '@/lib/convites'

// Quem pode ver a tabela de um empreendimento:
//   pública   → qualquer corretor identificado
//   diretoria → diretoria logada OU quem abriu um link de convite válido
// Os dados são lidos com a service role DEPOIS da checagem (o banco esconde
// as tabelas restritas da chave pública).
export type Acesso = 'publico' | 'diretoria' | 'convite'

export async function carregarEmpreendimento(slug: string, colunas = '*') {
  const { data } = await createAdminClient().from('empreendimentos').select(colunas).eq('slug', slug).eq('ativo_publico', true).maybeSingle()
  return data as any
}

export async function acessoTabela(emp: { id: string; visibilidade?: string | null } | null): Promise<Acesso | null> {
  if (!emp) return null
  if (emp.visibilidade !== 'diretoria') return 'publico'
  if (await ehDiretoria(await createClient())) return 'diretoria'
  const tokens = tokensDoCookie((await cookies()).get(CONVITES_COOKIE)?.value)
  return (await empreendimentosConvidados(tokens)).has(emp.id) ? 'convite' : null
}
