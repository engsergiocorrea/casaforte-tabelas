import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: false, erro: 'Email obrigatório' }, { status: 400 })

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 })

    // Gera e envia o link de recuperação com redirect correto
    const { error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://obras.casaforteinc.com.br/obras/nova-senha',
      },
    })

    if (linkError) console.error('[criar-usuario] generateLink error:', linkError.message)

    return NextResponse.json({ ok: true, usuario_id: data.user.id })
  } catch (err: any) {
    console.error('[criar-usuario]', err)
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
