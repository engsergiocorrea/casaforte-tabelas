import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      // Verifica se é recuperação de senha pelo tipo ou pelo next
      if (type === 'recovery' || next === 'nova-senha') {
        return NextResponse.redirect(new URL('/obras/nova-senha', origin))
      }
      return NextResponse.redirect(new URL('/obras', origin))
    }
  }

  return NextResponse.redirect(new URL('/obras/login', origin))
}
