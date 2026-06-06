import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rdo } = await supabase
    .from('relatorios')
    .select('*, obras(nome, endereco, cidade, estado, contratante_nome, data_inicio, prazo_contratual_dias), engenheiros(nome, cargo, registro_profissional, tipo_registro, uf_registro), relatorio_mao_obra(*), relatorio_atividades(*), relatorio_imagens(*)')
    .eq('id', id)
    .single()

  if (!rdo) return NextResponse.json({ error: 'RDO não encontrado' }, { status: 404 })
  if (rdo.status !== 'aprovado') return NextResponse.json({ error: 'RDO não aprovado' }, { status: 403 })

  const pdfDoc = await PDFDocument.create()
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const vermelho = rgb(0.91, 0.22, 0.055)
  const preto = rgb(0.07, 0.07, 0.07)
  const cinza = rgb(0.62, 0.62, 0.62)
  const cinzaClaro = rgb(0.97, 0.97, 0.97)
  const branco = rgb(1, 1, 1)

  function novaPage() {
    const p = pdfDoc.addPage([595, 842])
    const { width, height } = p.getSize()
    p.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: vermelho })
    p.drawText('CASA FORTE', { x: 30, y: height - 28, size: 16, font: fontBold, color: branco })
    p.drawText('Construtora e Incorporadora', { x: 30, y: height - 44, size: 9, font: fontRegular, color: rgb(1, 0.8, 0.8) })
    p.drawText('RELATORIO DIARIO DE OBRA - RDO', { x: 30, y: height - 60, size: 8, font: fontBold, color: branco })
    const rdoInfo = 'RDO No ' + (rdo.numero ?? '-') + '   |   ' + (rdo.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR') : '-') + '   |   APROVADO'
    p.drawText(rdoInfo, { x: width - 30 - fontRegular.widthOfTextAtSize(rdoInfo, 8), y: height - 44, size: 8, font: fontRegular, color: branco })
    p.drawLine({ start: { x: 30, y: 30 }, end: { x: width - 30, y: 30 }, thickness: 0.5, color: cinza })
    p.drawText('Casa Forte Construtora e Incorporadora', { x: 30, y: 18, size: 7, font: fontRegular, color: cinza })
    p.drawText('RDO #' + (rdo.numero ?? '-'), { x: width - 30 - fontRegular.widthOfTextAtSize('RDO #' + (rdo.numero ?? '-'), 7), y: 18, size: 7, font: fontRegular, color: cinza })
    return { p, y: height - 90 }
  }

  let { p: page, y } = novaPage()
  const { width } = page.getSize()
  const marginL = 30
  const marginR = 30
  const contentW = width - marginL - marginR

  function checkY(needed = 40) {
    if (y < needed + 40) {
      const np = novaPage()
      page = np.p
      y = np.y
    }
  }

  function drawText(text: string, x: number, yPos: number, opts: { bold?: boolean, size?: number, color?: any } = {}) {
    page.drawText(String(text || ''), { x, y: yPos, size: opts.size ?? 9, font: opts.bold ? fontBold : fontRegular, color: opts.color ?? preto })
  }

  function drawSecao(titulo: string) {
    checkY(30)
    y -= 10
    page.drawRectangle({ x: marginL, y: y - 4, width: contentW, height: 18, color: rgb(0.95, 0.95, 0.95) })
    page.drawRectangle({ x: marginL, y: y - 4, width: 4, height: 18, color: vermelho })
    drawText(titulo.toUpperCase(), marginL + 10, y + 8, { bold: true, size: 8, color: preto })
    y -= 20
  }

  const climaLabel: Record<string, string> = {
    sol: 'Sol', nublado: 'Nublado',
    chuva_fraca: 'Chuva fraca', chuva_forte: 'Chuva forte', vento: 'Vento',
  }

  // DADOS GERAIS
  drawSecao('Dados Gerais')
  const col1 = marginL, col2 = marginL + contentW / 2
  drawText('OBRA', col1, y, { size: 7, color: cinza })
  drawText((rdo.obras as any)?.nome ?? '-', col1, y - 11, { size: 9, bold: true })
  drawText('DATA', col2, y, { size: 7, color: cinza })
  drawText(rdo.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR') : '-', col2, y - 11, { size: 9 })
  y -= 26

  drawText('LOCAL', col1, y, { size: 7, color: cinza })
  const local = [(rdo.obras as any)?.endereco, (rdo.obras as any)?.cidade, (rdo.obras as any)?.estado].filter(Boolean).join(', ')
  drawText(local || '-', col1, y - 11, { size: 9 })
  drawText('CONTRATANTE', col2, y, { size: 7, color: cinza })
  drawText((rdo.obras as any)?.contratante_nome ?? '-', col2, y - 11, { size: 9 })
  y -= 26

  drawText('RESPONSAVEL TECNICO', col1, y, { size: 7, color: cinza })
  const engNome = (rdo.engenheiros as any)?.nome ?? '-'
  const engReg = (rdo.engenheiros as any)?.registro_profissional ? (rdo.engenheiros as any).tipo_registro + ' ' + (rdo.engenheiros as any).registro_profissional : ''
  drawText(engNome + (engReg ? ' - ' + engReg : ''), col1, y - 11, { size: 9 })
  y -= 26

  // PRAZOS
  if (rdo.prazo_contratual_dias || rdo.prazo_decorrido_dias || rdo.prazo_a_vencer_dias) {
    drawSecao('Prazos')
    const col3 = marginL + contentW / 3
    const col4 = marginL + (contentW / 3) * 2
    drawText('PRAZO CONTRATUAL', col1, y, { size: 7, color: cinza })
    drawText(rdo.prazo_contratual_dias ? rdo.prazo_contratual_dias + ' dias' : '-', col1, y - 11, { size: 9 })
    drawText('PRAZO DECORRIDO', col3, y, { size: 7, color: cinza })
    drawText(rdo.prazo_decorrido_dias ? rdo.prazo_decorrido_dias + ' dias' : '-', col3, y - 11, { size: 9 })
    drawText('PRAZO A VENCER', col4, y, { size: 7, color: cinza })
    drawText(rdo.prazo_a_vencer_dias !== null ? rdo.prazo_a_vencer_dias + ' dias' : '-', col4, y - 11, { size: 9 })
    y -= 26
  }

  // CLIMA
  if (rdo.clima_manha || rdo.clima_tarde) {
    drawSecao('Condicao Climatica')
    drawText('MANHA', col1, y, { size: 7, color: cinza })
    drawText(rdo.clima_manha ? climaLabel[rdo.clima_manha] ?? rdo.clima_manha : '-', col1, y - 11, { size: 9 })
    drawText('TARDE', col2, y, { size: 7, color: cinza })
    drawText(rdo.clima_tarde ? climaLabel[rdo.clima_tarde] ?? rdo.clima_tarde : '-', col2, y - 11, { size: 9 })
    y -= 26
    if (rdo.observacoes_clima) {
      drawText('OBSERVACOES', col1, y, { size: 7, color: cinza })
      drawText(rdo.observacoes_clima, col1, y - 11, { size: 9 })
      y -= 26
    }
  }

  // MAO DE OBRA
  if (rdo.relatorio_mao_obra?.length > 0) {
    drawSecao('Mao de Obra')
    page.drawRectangle({ x: marginL, y: y - 4, width: contentW, height: 16, color: cinzaClaro })
    drawText('FUNCAO', marginL + 8, y + 8, { size: 7, color: cinza, bold: true })
    drawText('QTD', marginL + contentW - 50, y + 8, { size: 7, color: cinza, bold: true })
    y -= 20
    let totalMao = 0
    for (const m of rdo.relatorio_mao_obra) {
      checkY(20)
      page.drawLine({ start: { x: marginL, y: y + 8 }, end: { x: marginL + contentW, y: y + 8 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) })
      drawText(m.funcao, marginL + 8, y, { size: 9 })
      drawText(String(m.quantidade), marginL + contentW - 45, y, { size: 9, bold: true })
      totalMao += m.quantidade
      y -= 18
    }
    checkY(20)
    page.drawRectangle({ x: marginL, y: y - 4, width: contentW, height: 16, color: cinzaClaro })
    drawText('TOTAL DE MAO DE OBRA DIRETA', marginL + 8, y + 8, { size: 8, bold: true })
    drawText(String(totalMao), marginL + contentW - 45, y + 8, { size: 10, bold: true, color: vermelho })
    y -= 24
  }

  // ATIVIDADES
  if (rdo.relatorio_atividades?.length > 0) {
    drawSecao('Atividades')
    page.drawRectangle({ x: marginL, y: y - 4, width: contentW, height: 16, color: cinzaClaro })
    drawText('DESCRICAO', marginL + 8, y + 8, { size: 7, color: cinza, bold: true })
    drawText('%', marginL + contentW - 100, y + 8, { size: 7, color: cinza, bold: true })
    drawText('STATUS', marginL + contentW - 70, y + 8, { size: 7, color: cinza, bold: true })
    y -= 20
    const statusLabel: Record<string, string> = { nao_iniciada: 'Nao iniciada', em_andamento: 'Em andamento', concluida: 'Concluida', paralisada: 'Paralisada' }
    for (const a of rdo.relatorio_atividades) {
      checkY(20)
      page.drawLine({ start: { x: marginL, y: y + 8 }, end: { x: marginL + contentW, y: y + 8 }, thickness: 0.3, color: rgb(0.9, 0.9, 0.9) })
      drawText(a.descricao, marginL + 8, y, { size: 9 })
      drawText((a.percentual ?? 0) + '%', marginL + contentW - 100, y, { size: 9 })
      drawText(statusLabel[a.status] ?? a.status, marginL + contentW - 70, y, { size: 8 })
      y -= 18
    }
    y -= 6
  }

  // COMENTARIOS
  if (rdo.comentarios) {
    drawSecao('Comentarios')
    const linhas = rdo.comentarios.match(/.{1,90}/g) ?? []
    for (const linha of linhas) {
      checkY(16)
      drawText(linha, marginL + 8, y, { size: 9 })
      y -= 14
    }
    y -= 6
  }

  // ASSINATURA
  checkY(80)
  y -= 20
  page.drawLine({ start: { x: marginL, y }, end: { x: marginL + 200, y }, thickness: 0.5, color: preto })
  drawText((rdo.engenheiros as any)?.nome ?? 'Responsavel Tecnico', marginL, y - 12, { size: 9 })
  if ((rdo.engenheiros as any)?.registro_profissional) {
    drawText((rdo.engenheiros as any).tipo_registro + ' ' + (rdo.engenheiros as any).registro_profissional, marginL, y - 22, { size: 8, color: cinza })
  }

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename="RDO-' + (rdo.numero ?? id) + '.pdf"',
    },
  })
}
