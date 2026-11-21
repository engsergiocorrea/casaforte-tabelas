import { createBrowserClient } from '@supabase/ssr'
import { opcoesCookie } from '@/lib/supabase/sso'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookieOptions: opcoesCookie(typeof window !== 'undefined' ? window.location.hostname : null) })
}
