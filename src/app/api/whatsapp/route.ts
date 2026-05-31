import { NextRequest, NextResponse } from 'next/server'
import { enviarWhatsApp, formatarMensagemProposta } from '@/lib/whatsapp'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const mensagem = formatarMensagemProposta(body)
    await enviarWhatsApp({
      corretorTelefone: body.corretorTelefone,
      mensagem,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/whatsapp]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
