import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { CORRETOR_COOKIE, decodeCorretor } from '@/lib/corretor'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Gate do corretor: páginas de empreendimento (detalhe, proposta, download)
  // exigem identificação. Sem o cookie, manda para a home, que mostra a tela
  // de identificação, preservando o destino em ?next=.
  if (pathname.startsWith('/empreendimentos')) {
    const corretor = decodeCorretor(request.cookies.get(CORRETOR_COOKIE)?.value)
    if (!corretor) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = `?next=${encodeURIComponent(pathname)}`
      return NextResponse.redirect(url)
    }
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
