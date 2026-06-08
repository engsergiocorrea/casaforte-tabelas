import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, nome } = await req.json()
    if (!email) return NextResponse.json({ ok: false, erro: 'Email obrigatório' }, { status: 400 })

    const supabase = createAdminClient()

    // Cria o usuário com email confirmado
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 })

    // Envia email de recuperação para o engenheiro definir a senha
    await supabase.auth.resetPasswordForEmail(email, {
     await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'https://obras.casaforteinc.com.br/obras/auth/callback?type=recovery',
})
    })

    return NextResponse.json({ ok: true, usuario_id: data.user.id })
  } catch (err: any) {
    console.error('[criar-usuario]', err)
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
