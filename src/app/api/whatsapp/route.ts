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

    // Gera o PDF no servidor
    let pdfBase64: string | undefined
    try {
      pdfBase64 = await gerarPdfProposta({
        ...body,
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
      })
    } catch (pdfErr) {
      console.error('[PDF] Erro ao gerar:', pdfErr)
      // Não quebra o fluxo — envia o texto mesmo sem o PDF
    }

    await enviarWhatsApp({
      corretorTelefone: body.corretorTelefone || null,
      compradorTelefone: body.compradorTelefone || null,
      mensagem,
      pdfBase64,
      nomeArquivo: `proposta-${body.empreendimento.toLowerCase().replace(/\s+/g, '-')}-${body.unidade}.pdf`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[/api/whatsapp]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
