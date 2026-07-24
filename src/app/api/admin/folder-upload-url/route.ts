import { NextRequest, NextResponse } from 'next/server'
import { exigirPapel } from '@/lib/auth/guard'

// Gera uma URL assinada para o navegador subir arquivos do empreendimento
// (folder em PDF, imagem de capa, logo) direto para o Storage. A URL é criada
// com service role, então o upload NÃO depende de policy de RLS no bucket — só
// exige que quem pede esteja logado (mesmo critério do admin). O upload em si
// vai do navegador direto para o Supabase (sem passar pelo servidor), então não
// há limite de tamanho de corpo da função.

const CAMPOS = new Set(['folder_url', 'imagem_capa_url', 'logo_url'])
const EXTS = new Set(['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif'])
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  try {
    const g = await exigirPapel()
    if (g.erro) return g.erro
    const { admin } = g

    const { id, field, ext } = await req.json()
    const e = String(ext ?? '').toLowerCase()
    if (!UUID.test(String(id ?? '')) || !CAMPOS.has(field) || !EXTS.has(e)) {
      return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 })
    }

    const path = `${id}-${field}.${e}`
    const { data, error } = await admin.storage
      .from('empreendimentos')
      .createSignedUploadUrl(path, { upsert: true })
    if (error || !data) {
      return NextResponse.json({ erro: error?.message ?? 'Falha ao gerar URL de upload.' }, { status: 500 })
    }

    const { data: pub } = admin.storage.from('empreendimentos').getPublicUrl(path)
    return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl: pub.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ erro: err?.message ?? 'Erro inesperado.' }, { status: 500 })
  }
}
