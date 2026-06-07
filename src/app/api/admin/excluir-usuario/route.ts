import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { usuario_id } = await req.json()
    if (!usuario_id) return NextResponse.json({ ok: false }, { status: 400 })
    const supabase = createAdminClient()
    await supabase.auth.admin.deleteUser(usuario_id)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, erro: err.message }, { status: 500 })
  }
}
