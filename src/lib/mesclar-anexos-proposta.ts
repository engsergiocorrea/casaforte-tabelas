import { PDFDocument } from 'pdf-lib'
import type { SupabaseClient } from '@supabase/supabase-js'

type Doc = { nome?: string; path: string; mime: string; tamanho?: number }

// Mescla os documentos anexados à proposta no MESMO PDF (após as páginas da
// proposta): PDFs têm as páginas copiadas; imagens (jpg/png) viram uma página
// A4 centralizada. webp e outros formatos são pulados (pdf-lib não os embute).
// Best-effort: um anexo problemático é ignorado, nunca quebra o PDF.
export async function mesclarAnexosNoPdfProposta(
  pdfBase64: string,
  propostaId: string,
  supabase: SupabaseClient,
): Promise<{ base64: string; anexados: number; pulados: number }> {
  const { data: prop } = await supabase.from('propostas').select('documentos').eq('id', propostaId).maybeSingle()
  const docs: Doc[] = Array.isArray((prop as { documentos?: Doc[] } | null)?.documentos) ? (prop as { documentos: Doc[] }).documentos : []
  if (!docs.length) return { base64: pdfBase64, anexados: 0, pulados: 0 }

  const pdf = await PDFDocument.load(Buffer.from(pdfBase64, 'base64'))
  const A4W = 595.28, A4H = 841.89, MARGEM = 24
  let anexados = 0, pulados = 0

  for (const d of docs) {
    try {
      const { data: file, error } = await supabase.storage.from('proposta-documentos').download(d.path)
      if (error || !file) { pulados++; continue }
      const bytes = new Uint8Array(await file.arrayBuffer())

      if (d.mime === 'application/pdf') {
        const src = await PDFDocument.load(bytes, { ignoreEncryption: true })
        const pages = await pdf.copyPages(src, src.getPageIndices())
        pages.forEach((p) => pdf.addPage(p))
        anexados++
      } else if (d.mime === 'image/jpeg' || d.mime === 'image/png') {
        const img = d.mime === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes)
        const page = pdf.addPage([A4W, A4H])
        const escala = Math.min((A4W - MARGEM * 2) / img.width, (A4H - MARGEM * 2) / img.height, 1)
        const w = img.width * escala, h = img.height * escala
        page.drawImage(img, { x: (A4W - w) / 2, y: (A4H - h) / 2, width: w, height: h })
        anexados++
      } else {
        pulados++ // webp e outros: pdf-lib não embute
      }
    } catch {
      pulados++
    }
  }

  const out = await pdf.save()
  return { base64: Buffer.from(out).toString('base64'), anexados, pulados }
}
