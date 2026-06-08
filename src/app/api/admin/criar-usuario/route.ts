import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } = from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, telefone } = await req.json()
    if (!email) return NextResponse.json({ ok: false, erro: 'Email obrigatório' }, { status: 400 })

    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 })

    // Gera o link de recuperação
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: 'https://obras.casaforteinc.com.br/obras/auth/callback?type=recovery&next=nova-senha',
      },
    })

    if (linkError) {
      console.error('[criar-usuario] generateLink error:', linkError.message)
      return NextResponse.json({ ok: true, usuario_id: data.user.id, aviso: 'Usuário criado mas link não gerado' })
    }

    const link = linkData.properties.action_link

    // Envia por WhatsApp se tiver telefone
    if (telefone) {
      const numero = telefone.replace(/\D/g, '')
      const mensagem = `🏗️ *Portal de Obras - Casa Forte*\n\nOlá, ${nome}!\n\nSeu acesso ao Portal de Obras foi criado.\n\nClique no link abaixo para definir sua senha:\n${link}\n\n⚠️ Este link expira em 24 horas.`
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', '') ?? ''}`, {}).catch(() => {})

      const EVOLUTION_URL = 'https://evolution-api-production-f2e51.up.railway.app'
      const EVOLUTION_KEY = 'casaforte2024secreto'
      await fetch(`${EVOLUTION_URL}/message/sendText/casaforte`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': EVOLUTION_KEY },
        body: JSON.stringify({ number: numero, text: mensagem }),
      })
    }

    return NextResponse.json({ ok: true, usuario_id: data.user.id, link })
  } catch (err: any) {
    console.error('[criar-usuario]', err)
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
