import { createClient } from '@supabase/supabase-js'

// Client service-role (somente para os endpoints internos, server-to-server)
// usando @supabase/supabase-js — envia a service role como Bearer ao PostgREST
// e ignora RLS de forma confiável (o createServerClient do @supabase/ssr, sem
// cookies, roda como anon e pode bater em "permission denied"). Apenas leitura.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
