import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { numero, mensagem } = await req.json()
    if (!numero || !mensagem) {
      return NextResponse.json({ ok: false, erro: 'numero e mensagem obrigatorios' }, { status: 400 })
    }

    const EVOLUTION_URL = process.env.EVOLUTION_API_URL ?? 'https://evolution-api-production-f2e51.up.railway.app'
    const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY ?? 'casaforte2024secreto'
    const INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'casaforte'

    const res = await fetch(`${EVOLUTION_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY,
      },
      body: JSON.stringify({
        number: numero,
        text: mensagem,
      }),
    })

    const data = await res.json()
    console.log('[whatsapp-rdo]', { numero, status: res.status, data })

    return NextResponse.json({ ok: true, data })
  } catch (err) {
    console.error('[whatsapp-rdo]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
