import { NextRequest, NextResponse } from 'next/server'
import { enviarWhatsApp, formatarMensagemProposta } from '@/lib/whatsapp'
import { gerarPdfProposta } from '@/lib/gerar-pdf-proposta'
import { mesclarAnexosNoPdfProposta } from '@/lib/mesclar-anexos-proposta'
import { createServiceClient } from '@/lib/internal-api/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const mensagem = formatarMensagemProposta({
      empreendimento: body.empreendimento,
      unidade: body.unidade,
      comprador: body.comprador1_nome,
      corretor: body.corretor_nome || 'Não informado',
      valorProposto: body.segue_tabela ? null : body.valor_proposto,
      propostaId: body.propostaId,
    })

    let pdfBase64: string | undefined
    let pdfErro: string | undefined

    try {
      console.log('[PDF] Iniciando geração...')
      console.log('[PDF] Dados recebidos:', JSON.stringify({
        empreendimento: body.empreendimento,
        unidade: body.unidade,
        comprador1_nome: body.comprador1_nome,
        propostaId: body.propostaId,
      }))
      pdfBase64 = await gerarPdfProposta({
        ...body,
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
      })
      console.log('[PDF] Gerado com sucesso, tamanho base64:', pdfBase64.length)

      // Mescla a documentação anexada dentro do MESMO PDF da proposta.
      if (pdfBase64 && body.propostaId) {
        try {
          const sb = createServiceClient()
          const merge = await mesclarAnexosNoPdfProposta(pdfBase64, body.propostaId, sb)
          pdfBase64 = merge.base64
          console.log(`[PDF] Anexos mesclados: ${merge.anexados} · pulados: ${merge.pulados}`)
        } catch (e: any) {
          console.error('[PDF] Falha ao mesclar anexos (segue com o PDF da proposta):', e?.message ?? e)
        }
      }
    } catch (err: any) {
      pdfErro = err?.message ?? String(err)
      console.error('[PDF] Erro ao gerar:', pdfErro)
    }

    await enviarWhatsApp({
      corretorTelefone: body.corretorTelefone || null,
      compradorTelefone: body.compradorTelefone || null,
      mensagem,
      pdfBase64,
      nomeArquivo: `proposta-casaforte-${body.unidade}.pdf`,
    })

    return NextResponse.json({ ok: true, pdfGerado: !!pdfBase64, pdfErro })
  } catch (err) {
    console.error('[/api/whatsapp]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
