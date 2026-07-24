import { NextRequest, NextResponse } from 'next/server'
import { exigirPapel } from '@/lib/auth/guard'

// Exclui um usuário do Auth. Ação sensível e irreversível: exige papel
// 'admin_geral' (mesma regra do RLS "só admin geral exclui").
export async function POST(req: NextRequest) {
  try {
    const g = await exigirPapel(['admin_geral'])
    if (g.erro) return g.erro
    const { user, admin } = g

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
