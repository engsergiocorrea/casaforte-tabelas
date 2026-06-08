import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, nome, telefone } = await req.json()
    if (!email) return NextResponse.json({ ok: false, erro: 'Email obrigatório' }, { status: 400 })

    const supabase = createAdminClient()

    // Senha temporária
    const senhaTemp = 'CasaForte@' + Math.floor(1000 + Math.random() * 9000)

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: senhaTemp,
      email_confirm: true,
    })

    if (error) return NextResponse.json({ ok: false, erro: error.message }, { status: 400 })

    // Envia credenciais por WhatsApp
    if (telefone) {
      const numero = telefone.replace(/\D/g, '')
      const mensagem = `🏗️ *Portal de Obras - Casa Forte*\n\nOlá, ${nome}!\n\nSeu acesso ao Portal de Obras foi criado.\n\n📧 *E-mail:* ${email}\n🔑 *Senha temporária:* ${senhaTemp}\n\n🔗 Acesse: https://obras.casaforteinc.com.br\n\nRecomendamos trocar sua senha após o primeiro acesso em "Esqueci minha senha".`

      await fetch('https://evolution-api-production-f2e51.up.railway.app/message/sendText/casaforte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': 'casaforte2024secreto' },
        body: JSON.stringify({ number: numero, text: mensagem }),
      })
    }

    return NextResponse.json({ ok: true, usuario_id: data.user.id })
  } catch (err: any) {
    console.error('[criar-usuario]', err)
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
