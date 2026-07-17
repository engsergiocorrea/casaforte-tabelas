import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Registra um acesso de corretor às tabelas públicas em public.tabelas_acessos
// (idjzh). Best-effort: lê o IP no servidor e nunca quebra a navegação do
// corretor. Usa service role (a tabela tem RLS: só a diretoria lê, ver
// sql/tabelas_acessos.sql).
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const nome = String(body?.nome ?? '').trim()
    if (!nome) return NextResponse.json({ ok: false })

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ ok: false })

    const ip =
      (req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        '').trim() || null

    const sb = createClient(url, key, { auth: { persistSession: false } })
    await sb.from('tabelas_acessos').insert({
      corretor_nome: nome,
      creci: String(body?.creci ?? '').trim() || null,
      ip,
      user_agent: req.headers.get('user-agent'),
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
