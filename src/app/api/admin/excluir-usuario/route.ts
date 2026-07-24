import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Exclui um usuário do Auth. Ação sensível e irreversível: exige que quem chama
// esteja logado E tenha papel 'admin_geral' (mesma regra do RLS "só admin geral
// exclui"). Sem isso, qualquer um que descobrisse a URL apagava usuários.
export async function POST(req: NextRequest) {
  try {
    // 1) precisa estar autenticado (sessão via cookies)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, erro: 'Não autenticado.' }, { status: 401 })

    // 2) precisa ser admin_geral e estar ativo
    const admin = createAdminClient()
    const { data: perfil } = await admin
      .from('profiles')
      .select('role, ativo')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!perfil || !perfil.ativo || perfil.role !== 'admin_geral') {
      return NextResponse.json({ ok: false, erro: 'Sem permissão para esta ação.' }, { status: 403 })
    }

    // 3) valida entrada e evita autoexclusão acidental
    const { usuario_id } = await req.json()
    if (!usuario_id) return NextResponse.json({ ok: false, erro: 'usuario_id ausente.' }, { status: 400 })
    if (usuario_id === user.id) {
      return NextResponse.json({ ok: false, erro: 'Você não pode excluir o próprio usuário.' }, { status: 400 })
    }

    await admin.auth.admin.deleteUser(usuario_id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
