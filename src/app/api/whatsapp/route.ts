import { NextRequest, NextResponse } from 'next/server'
import { enviarWhatsApp, formatarMensagemProposta } from '@/lib/whatsapp'
import { gerarPdfProposta } from '@/lib/gerar-pdf-proposta'

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
