import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSbClient } from '@supabase/supabase-js'
import { CORRETOR_COOKIE, decodeCorretor } from '@/lib/corretor'
import { extrairDadosDeDocumentos, camposProposta, iaConfigurada, type ArquivoEntrada } from '@/lib/ai/extrair-documentos'

export const runtime = 'nodejs'
export const maxDuration = 120

const BUCKET = 'proposta-documentos'

function mimeDoNome(nome: string, fallback: string): string {
  const ext = (nome.split('.').pop() || '').toLowerCase()
  const map: Record<string, string> = {
    pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif',
  }
  return map[ext] || (fallback && fallback !== 'application/octet-stream' ? fallback : 'application/octet-stream')
}

// POST /api/extrair-documentos  (JSON: { paths: string[] })
// Os arquivos já foram enviados ao Storage (bucket 'proposta-documentos',
// prefixo 'documentos/') pelo navegador do corretor. Aqui o servidor os baixa
// e manda para a IA (File API do Gemini). Exige a identificação do corretor
// (cookie do gate) para não expor a IA a qualquer um.
export async function POST(req: Request) {
  const cookieStore = await cookies()
  const corretor = decodeCorretor(cookieStore.get(CORRETOR_COOKIE)?.value)
  if (!corretor) {
    return NextResponse.json({ ok: false, error: 'Identifique-se para usar a leitura de documentos.' }, { status: 401 })
  }

  if (!iaConfigurada()) {
    return NextResponse.json(
      { ok: false, error: 'IA ainda não configurada (defina GEMINI_API_KEY no ambiente do Tabelas).' },
      { status: 503 }
    )
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ ok: false, error: 'Storage não configurado.' }, { status: 503 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Envio inválido.' }, { status: 400 })
  }

  const paths: string[] = Array.isArray(body?.paths) ? body.paths.filter((p: any) => typeof p === 'string') : []
  if (paths.length === 0) return NextResponse.json({ ok: false, error: 'Nenhum documento enviado.' }, { status: 400 })
  if (paths.length > 6) return NextResponse.json({ ok: false, error: 'Máximo de 6 arquivos por vez.' }, { status: 400 })

  const admin = createSbClient(url, key, { auth: { persistSession: false } })
  const arquivos: ArquivoEntrada[] = []
  for (const p of paths) {
    if (!p.startsWith('documentos/')) {
      return NextResponse.json({ ok: false, error: 'Caminho de documento inválido.' }, { status: 400 })
    }
    const { data: blob, error } = await admin.storage.from(BUCKET).download(p)
    if (error || !blob) {
      return NextResponse.json({ ok: false, error: `Documento não encontrado no Storage: ${p}` }, { status: 400 })
    }
    const bytes = Buffer.from(await blob.arrayBuffer())
    const nome = p.split('/').pop() || 'documento'
    arquivos.push({ bytes, mimeType: mimeDoNome(nome, (blob as any).type || ''), nome })
  }

  try {
    const dados = await extrairDadosDeDocumentos(arquivos)
    return NextResponse.json({ ok: true, campos: camposProposta(dados) })
  } catch (e: any) {
    console.error('[extrair-documentos]', e?.message)
    return NextResponse.json(
      { ok: false, error: 'Não foi possível ler os documentos. Tente novamente.' },
      { status: 500 }
    )
  }
}
