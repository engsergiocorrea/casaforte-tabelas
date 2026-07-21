import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient as createSbClient } from '@supabase/supabase-js'
import { CORRETOR_COOKIE, decodeCorretor } from '@/lib/corretor'
import { extrairDadosDeDocumentos, camposProposta, iaConfigurada, type ArquivoEntrada } from '@/lib/ai/extrair-documentos'
import {
  MAX_DOCUMENT_FILES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  MAX_DOCUMENT_BATCH_SIZE_BYTES,
  MIME_EXTENSION_MAP,
  isValidDocumentPath,
  type AllowedDocumentMime,
} from '@/lib/documentos-proposta'

export const runtime = 'nodejs'
export const maxDuration = 120

const BUCKET = 'proposta-documentos'

// Tipo derivado da extensão do path — que só existe porque o path é gerado a
// partir da allowlist de MIME (ver createSafeDocumentFilename).
const EXT_TO_MIME: Record<string, AllowedDocumentMime> = Object.entries(MIME_EXTENSION_MAP).reduce(
  (acc, [mime, ext]) => ({ ...acc, [ext]: mime as AllowedDocumentMime }),
  {} as Record<string, AllowedDocumentMime>
)

// POST /api/extrair-documentos  (JSON: { paths: string[] })
// Os arquivos já foram enviados ao Storage pelo navegador. Aqui o servidor os
// baixa e manda para a IA (File API do Gemini). Exige a identificação do
// corretor (cookie do gate). Revalida limites — não confia no cliente.
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
  if (paths.length > MAX_DOCUMENT_FILES) {
    return NextResponse.json({ ok: false, error: `Máximo de ${MAX_DOCUMENT_FILES} arquivos por vez.` }, { status: 400 })
  }
  if (new Set(paths).size !== paths.length) {
    return NextResponse.json({ ok: false, error: 'Documento repetido no envio.' }, { status: 400 })
  }

  const admin = createSbClient(url, key, { auth: { persistSession: false } })
  const arquivos: ArquivoEntrada[] = []
  let totalBytes = 0

  for (const p of paths) {
    // Formato controlado: documentos/{uuid}/documento-{uuid}.{ext da allowlist}
    if (!isValidDocumentPath(p)) {
      return NextResponse.json({ ok: false, error: 'Caminho de documento inválido.' }, { status: 400 })
    }
    const ext = (p.split('.').pop() || '').toLowerCase()
    const mimeType = EXT_TO_MIME[ext]
    if (!mimeType) {
      return NextResponse.json({ ok: false, error: 'Formato não permitido. Envie PDF, JPG, PNG ou WEBP.' }, { status: 400 })
    }

    const { data: blob, error } = await admin.storage.from(BUCKET).download(p)
    if (error || !blob) {
      return NextResponse.json({ ok: false, error: 'Documento não encontrado.' }, { status: 400 })
    }

    const bytes = Buffer.from(await blob.arrayBuffer())
    if (bytes.length === 0) {
      return NextResponse.json({ ok: false, error: 'O documento parece estar vazio ou corrompido.' }, { status: 400 })
    }
    if (bytes.length > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'Documento acima do tamanho permitido.' }, { status: 400 })
    }
    totalBytes += bytes.length
    if (totalBytes > MAX_DOCUMENT_BATCH_SIZE_BYTES) {
      return NextResponse.json({ ok: false, error: 'O conjunto de documentos ultrapassa o limite permitido.' }, { status: 400 })
    }

    arquivos.push({ bytes, mimeType, nome: p.split('/').pop() || 'documento' })
  }

  try {
    const dados = await extrairDadosDeDocumentos(arquivos)
    return NextResponse.json({ ok: true, campos: camposProposta(dados) })
  } catch (e: any) {
    // Nunca expõe conteúdo do documento nem resposta bruta da IA ao usuário.
    console.error('[extrair-documentos]', e?.message)
    return NextResponse.json({ ok: false, error: 'Não foi possível ler os documentos. Tente novamente.' }, { status: 500 })
  }
}
