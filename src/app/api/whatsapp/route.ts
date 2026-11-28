import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { enviarWhatsApp, formatarMensagemProposta } from '@/lib/whatsapp'
import { gerarPdfProposta } from '@/lib/gerar-pdf-proposta'
import { mesclarAnexosNoPdfProposta } from '@/lib/mesclar-anexos-proposta'
import { createServiceClient } from '@/lib/internal-api/db'
import { CORRETOR_COOKIE, decodeCorretor } from '@/lib/corretor'

// Avisa no WhatsApp (equipe + corretor + comprador) que uma proposta chegou.
// SEGURANÇA: só aceita o id de uma proposta gravada há poucos minutos; todos os
// dados e telefones vêm do BANCO, nunca do corpo da requisição. Antes, o corpo
// definia telefones e textos — qualquer um podia usar o número da empresa e
// receber os documentos anexados de uma proposta.
const JANELA_MS = 10 * 60 * 1000
const jaEnviadas = new Set<string>()

export async function POST(req: NextRequest) {
  try {
    const corretor = decodeCorretor((await cookies()).get(CORRETOR_COOKIE)?.value)
    if (!corretor) return NextResponse.json({ ok: false }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const propostaId = typeof body?.propostaId === 'string' ? body.propostaId : ''
    if (!/^[0-9a-f-]{36}$/i.test(propostaId)) return NextResponse.json({ ok: false }, { status: 400 })
    if (jaEnviadas.has(propostaId)) return NextResponse.json({ ok: true, repetido: true })

    const sb = createServiceClient()
    const { data: p } = await sb
      .from('propostas')
      .select('*, empreendimentos(nome), unidades(unidade, pavimento, area_construida, quartos, valor_imovel)')
      .eq('id', propostaId)
      .maybeSingle()
    if (!p) return NextResponse.json({ ok: false }, { status: 404 })
    if (Date.now() - new Date(p.created_at).getTime() > JANELA_MS) {
      return NextResponse.json({ ok: false, erro: 'Proposta antiga.' }, { status: 409 })
    }
    jaEnviadas.add(propostaId)

    const emp = (p as any).empreendimentos ?? {}
    const uni = (p as any).unidades ?? {}
    const valorProposto = p.segue_tabela ? Number(uni.valor_imovel) || Number(p.valor_proposto) : Number(p.valor_proposto)

    const mensagem = formatarMensagemProposta({
      empreendimento: emp.nome ?? '',
      unidade: uni.unidade ?? '',
      comprador: p.comprador1_nome,
      corretor: p.corretor_nome || 'Não informado',
      valorProposto: p.segue_tabela ? null : valorProposto,
      propostaId,
    })

    let pdfBase64: string | undefined
    let pdfErro: string | undefined
    try {
      pdfBase64 = await gerarPdfProposta({
        ...p,
        empreendimento: emp.nome ?? '',
        unidade: uni.unidade ?? '',
        pavimento: uni.pavimento ?? undefined,
        area: uni.area_construida ?? undefined,
        quartos: uni.quartos ?? undefined,
        valor_proposto: valorProposto,
        propostaId,
        dataEnvio: new Date().toLocaleDateString('pt-BR'),
      })
      if (pdfBase64) {
        try {
          pdfBase64 = (await mesclarAnexosNoPdfProposta(pdfBase64, propostaId, sb)).base64
        } catch (e: any) {
          console.error('[PDF] Falha ao mesclar anexos (segue com o PDF da proposta):', e?.message ?? e)
        }
      }
    } catch (err: any) {
      pdfErro = err?.message ?? String(err)
      console.error('[PDF] Erro ao gerar:', pdfErro)
    }

    await enviarWhatsApp({
      corretorTelefone: p.corretor_telefone || null,
      compradorTelefone: p.comprador1_telefone || null,
      mensagem,
      pdfBase64,
      nomeArquivo: `proposta-casaforte-${uni.unidade ?? 'unidade'}.pdf`,
      resumo: {
        empreendimento: emp.nome ?? '-',
        unidade: uni.unidade ?? '-',
        comprador: p.comprador1_nome ?? '-',
        corretor: p.corretor_nome || 'Não informado',
        valor: p.segue_tabela || !valorProposto ? 'segue tabela' : `R$ ${valorProposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      },
    })

    return NextResponse.json({ ok: true, pdfGerado: !!pdfBase64, pdfErro })
  } catch (err) {
    console.error('[/api/whatsapp]', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
