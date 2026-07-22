import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Link curto e com a marca para compartilhar o folder de um empreendimento:
//   https://tabelas.casaforteinc.com.br/f/<slug>
// Redireciona direto para o PDF do folder. Público (não passa pelo gate do
// corretor), já que folder é material de divulgação feito para ser compartilhado.
// Se o empreendimento não tiver folder, cai na página pública do empreendimento.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('empreendimentos')
    .select('folder_url')
    .eq('slug', slug)
    .eq('ativo_publico', true)
    .maybeSingle()

  if (data?.folder_url) {
    return NextResponse.redirect(data.folder_url, { status: 302 })
  }
  return NextResponse.redirect(new URL(`/empreendimentos/${slug}`, req.url), { status: 302 })
}
