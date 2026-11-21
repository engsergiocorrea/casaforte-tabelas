import type { SupabaseClient } from '@supabase/supabase-js'

// "Diretoria" no Tabelas = perfil admin_geral ativo (mesmo login do /admin).
// Tabelas marcadas como visibilidade='diretoria' só abrem para esse perfil.
export const PAPEIS_DIRETORIA = ['admin_geral'] as const

export async function ehDiretoria(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('role, ativo').eq('user_id', user.id).maybeSingle()
  return Boolean(data?.ativo && (PAPEIS_DIRETORIA as readonly string[]).includes(data.role))
}

// Empreendimento pode ser exibido para quem está pedindo?
export function podeVer(emp: { visibilidade?: string | null } | null, diretoria: boolean) {
  if (!emp) return false
  return emp.visibilidade !== 'diretoria' || diretoria
}
