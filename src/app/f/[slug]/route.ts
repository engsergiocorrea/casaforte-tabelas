import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Roda no Edge: feito para fazer streaming/proxy de arquivos grandes sem o
// limite de corpo das funções serverless comuns.
export const runtime = 'edge'

// Link curto e com a marca para compartilhar o folder de um empreendimento:
//   https://tabelas.casaforteinc.com.br/f/<slug>
// A rota SERVE o PDF pelo nosso domínio (proxy/stream), então a URL do Supabase
// nunca aparece na barra do navegador — o link continua sendo o nosso. A
// resposta é cacheada na CDN da Vercel, então cliques repetidos não repuxam o
// arquivo do Supabase toda vez. Público (não passa pelo gate do corretor), pois
// folder é material de divulgação feito para ser compartilhado.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('empreendimentos')
    .select('folder_url')
    .eq('slug', slug)
    .eq('ativo_publico', true)
    .maybeSingle()

  // Sem folder: manda para a página pública do empreendimento.
  if (!data?.folder_url) {
    return NextResponse.redirect(new URL(`/empreendimentos/${slug}`, req.url), { status: 302 })
  }

  // Busca o arquivo no Storage e devolve pelo nosso domínio (stream, sem bufferizar).
  const upstream = await fetch(data.folder_url)
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Folder indisponível no momento.', { status: 502 })
  }

  const contentType = upstream.headers.get('content-type') || 'application/pdf'
  const ext = (data.folder_url.split('?')[0].split('.').pop() || 'pdf').toLowerCase()
  const headers = new Headers()
  headers.set('Content-Type', contentType)
  const len = upstream.headers.get('content-length')
  if (len) headers.set('Content-Length', len)
  // inline: abre no próprio navegador (preview); nome amigável ao baixar.
  headers.set('Content-Disposition', `inline; filename="folder-${slug}.${ext}"`)
  // Cache na CDN por 10 min (re-upload reflete em até 10 min).
  headers.set('Cache-Control', 'public, max-age=600, s-maxage=600, stale-while-revalidate=300')

  return new NextResponse(upstream.body, { status: 200, headers })
}
