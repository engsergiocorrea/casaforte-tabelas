import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Só protege rotas /admin (exceto /admin/login)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value ||
      [...request.cookies.getAll()].find(c => c.name.includes('auth-token'))?.value

    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
