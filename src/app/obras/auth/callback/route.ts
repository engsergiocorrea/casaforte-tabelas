import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token = searchParams.get('token')
  const type = searchParams.get('type')
  const next = searchParams.get('next')

  // PKCE flow com token direto
  if (token && type === 'recovery') {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    })
    if (!error) {
      return NextResponse.redirect(new URL('/obras/nova-senha', origin))
    }
  }

  // Authorization code flow
  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.session) {
      if (type === 'recovery' || next === 'nova-senha') {
        return NextResponse.redirect(new URL('/obras/nova-senha', origin))
      }
      return NextResponse.redirect(new URL('/obras', origin))
    }
  }

  return NextResponse.redirect(new URL('/obras/login', origin))
}
