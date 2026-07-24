import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type UserRole = 'admin_geral' | 'admin_comercial' | 'financeiro' | 'visualizador'

// Papéis considerados "administrativos" por padrão (podem editar).
export const ROLES_ADMIN: UserRole[] = ['admin_geral', 'admin_comercial']

type Guard =
  | { erro: NextResponse; user?: undefined; perfil?: undefined; admin?: undefined }
  | { erro?: undefined; user: { id: string; email?: string }; perfil: { role: UserRole; nome: string }; admin: ReturnType<typeof createAdminClient> }

// Exige que a requisição venha de um usuário logado (sessão via cookies) com um
// dos papéis permitidos e ativo. Uso nas rotas:
//   const g = await exigirPapel(['admin_geral']); if (g.erro) return g.erro
//   const { user, admin } = g
// Assim nenhuma rota nova esquece de checar sessão/papel (foi o que abriu o
// buraco da exclusão de usuário).
export async function exigirPapel(rolesPermitidos: UserRole[] = ROLES_ADMIN): Promise<Guard> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { erro: NextResponse.json({ ok: false, erro: 'Não autenticado.' }, { status: 401 }) }
  }
  const admin = createAdminClient()
  const { data: perfil } = await admin
    .from('profiles')
    .select('role, ativo, nome')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!perfil || !perfil.ativo || !rolesPermitidos.includes(perfil.role as UserRole)) {
    return { erro: NextResponse.json({ ok: false, erro: 'Sem permissão para esta ação.' }, { status: 403 }) }
  }
  return { user: { id: user.id, email: user.email }, perfil: { role: perfil.role as UserRole, nome: perfil.nome }, admin }
}
