import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// Registra um login na auditoria (public.acessos_log, no idjzh). Best-effort:
// lê o IP do header no servidor e nunca deixa a auditoria quebrar o login.
export async function POST(req: Request) {
  try {
    const { email } = await req.json().catch(() => ({}))
    if (!email) return NextResponse.json({ ok: false })
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ ok: false })
    const ip = (req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '').trim() || null
    const sb = createClient(url, key, { auth: { persistSession: false } })
    const { data: prof } = await sb.from('profiles').select('id').eq('email', email).maybeSingle()
    await sb.from('acessos_log').insert({
      profile_id: prof?.id ?? null, email, acao: 'login', ip, user_agent: req.headers.get('user-agent'),
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
