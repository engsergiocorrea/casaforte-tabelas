import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Se for recuperação de senha, vai para nova-senha
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/obras/nova-senha', origin))
      }
      return NextResponse.redirect(new URL('/obras', origin))
    }
  }

  return NextResponse.redirect(new URL('/obras/login', origin))
}
