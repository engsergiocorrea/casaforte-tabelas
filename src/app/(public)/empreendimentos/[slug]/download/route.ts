import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: empreendimento } = await supabase
    .from('empreendimentos')
    .select('*')
    .eq('slug', slug)
    .eq('ativo_publico', true)
    .single()

  if (!empreendimento) return new NextResponse('Não encontrado', { status: 404 })

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento')
    .order('unidade')

  const unidadesFiltradas = (unidades ?? []).filter(u => u.status !== 'bloqueada' && u.status !== 'indisponivel')

  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'

  const statusLabel: Record<string, string> = { disponivel: 'Disponivel', reservada: 'Reservada', vendida: 'Vendida' }
  const statusColor: Record<string, any> = {
    disponivel: rgb(0.08, 0.5, 0.24),
    reservada: rgb(0.7, 0.28, 0.04),
    vendida: rgb(0.73, 0.07, 0.07),
  }
  const statusBg: Record<string, any> = {
    disponivel: rgb(0.86, 0.99, 0.9),
    reservada: rgb(1, 0.98, 0.86),
    vendida: rgb(1, 0.95, 0.95),
  }

  // PDF em paisagem A4
  const pdfDoc = await PDFDocument.create()
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const preto = rgb(0.07, 0.07, 0.07)
  const cinza = rgb(0.62, 0.62, 0.62)
  const cinzaClaro = rgb(0.97, 0.97, 0.97)
  const vermelho = rgb(0.91, 0.22, 0.055)
  const branco = rgb(1, 1, 1)
  const escuro = rgb(0.12, 0.12, 0.12)

  // Logo
  let logoImage: any = null
  try {
    const logoResp = await fetch('https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png')
    const logoBytes = new Uint8Array(await logoResp.arrayBuffer())
    logoImage = await pdfDoc.embedPng(logoBytes)
  } catch (e) {}

  // Dimensões A4 paisagem
  const W = 841.89
  const H = 595.28
  const mL = 24, mR = 24, mT = 20, mB = 20

  function novaPage() {
    const p = pdfDoc.addPage([W, H])

    // Header escuro
    p.drawRectangle({ x: 0, y: H - 52, width: W, height: 52, color: escuro })
    p.drawRectangle({ x: 0, y: H - 54, width: W, height: 2, color: vermelho })

    if (logoImage) {
      p.drawImage(logoImage, { x: mL, y: H - 46, width: 80, height: 30 })
    } else {
      p.drawText('CASA FORTE', { x: mL, y: H - 28, size: 14, font: fontB, color: branco })
    }

    p.drawText(empreendimento.nome, { x: mL + 90, y: H - 26, size: 13, font: fontB, color: branco })
    p.drawText(`${empreendimento.cidade}, ${empreendimento.estado}`, { x: mL + 90, y: H - 40, size: 9, font: fontR, color: cinza })

    const dataStr = `Tabela de Vendas  |  ${new Date().toLocaleDateString('pt-BR')}`
    p.drawText(dataStr, { x: W - mR - fontR.widthOfTextAtSize(dataStr, 9), y: H - 32, size: 9, font: fontR, color: cinza })

    // Rodapé
    p.drawLine({ start: { x: mL, y: mB + 10 }, end: { x: W - mR, y: mB + 10 }, thickness: 0.5, color: cinza })
    p.drawText('Casa Forte Construtora e Incorporadora  |  Os valores são de referência e podem sofrer alteração sem aviso prévio.', { x: mL, y: mB, size: 7, font: fontR, color: cinza })

    return { p, y: H - 60 }
  }

  let { p: page, y } = novaPage()
  const contentW = W - mL - mR

  // Resumo rápido
  const disponiveis = unidadesFiltradas.filter(u => u.status === 'disponivel').length
  const reservadas = unidadesFiltradas.filter(u => u.status === 'reservada').length
  const vendidas = unidadesFiltradas.filter(u => u.status === 'vendida').length

  y -= 8
  const boxW = (contentW - 24) / 4
  const boxes = [
    { label: 'Total', val: String(unidadesFiltradas.length), cor: preto },
    { label: 'Disponiveis', val: String(disponiveis), cor: rgb(0.08, 0.5, 0.24) },
    { label: 'Reservadas', val: String(reservadas), cor: rgb(0.7, 0.28, 0.04) },
    { label: 'Vendidas', val: String(vendidas), cor: rgb(0.73, 0.07, 0.07) },
  ]
  boxes.forEach((b, i) => {
    const bx = mL + i * (boxW + 8)
    page.drawRectangle({ x: bx, y: y - 28, width: boxW, height: 32, color: cinzaClaro, borderColor: rgb(0.88, 0.88, 0.88), borderWidth: 0.5 })
    page.drawText(b.label, { x: bx + 6, y: y + 0, size: 7, font: fontR, color: cinza })
    page.drawText(b.val, { x: bx + 6, y: y - 18, size: 14, font: fontB, color: b.cor })
  })
  y -= 38

  // Condições
  y -= 6
  const conds = [
    `Correcao ate entrega: ${empreendimento.indice_ate_entrega ?? '-'}`,
    `Correcao apos entrega: ${empreendimento.indice_apos_entrega ?? '-'}`,
    `Parcelamento: ate ${empreendimento.parcelas_padrao ?? 60}x mensais`,
    empreendimento.data_prevista_entrega ? `Entrega: ${new Date(empreendimento.data_prevista_entrega).toLocaleDateString('pt-BR')}` : '',
  ].filter(Boolean)
  conds.forEach((c, i) => {
    page.drawText(c, { x: mL + i * (contentW / 4), y, size: 8, font: fontR, color: preto })
  })
  y -= 14

  // Colunas da tabela
  const cols = [
    { label: 'Unidade', w: 55, align: 'left' },
    { label: 'Pavimento', w: 55, align: 'left' },
    { label: 'Area', w: 40, align: 'right' },
    { label: 'Qtos', w: 30, align: 'center' },
    { label: 'Posicao', w: 55, align: 'left' },
    { label: 'Valor Total', w: 90, align: 'right' },
    { label: 'Entrada', w: 80, align: 'right' },
    { label: 'Parcelas', w: 95, align: 'right' },
    { label: 'Intercaladas', w: 95, align: 'right' },
    { label: 'Chaves', w: 80, align: 'right' },
    { label: 'Status', w: 55, align: 'center' },
  ]

  function drawHeader(yPos: number) {
    page.drawRectangle({ x: mL, y: yPos - 4, width: contentW, height: 16, color: cinzaClaro })
    page.drawRectangle({ x: mL, y: yPos - 4, width: contentW, height: 1.5, color: rgb(0.85, 0.85, 0.85) })
    let x = mL
    cols.forEach(col => {
      page.drawText(col.label.toUpperCase(), { x: col.align === 'right' ? x + col.w - fontB.widthOfTextAtSize(col.label.toUpperCase(), 7) : x + 3, y: yPos + 6, size: 7, font: fontB, color: cinza })
      x += col.w
    })
    return yPos - 18
  }

  y = drawHeader(y)

  // Linhas da tabela
  let alternate = false
  for (const u of unidadesFiltradas) {
    if (y < mB + 30) {
      const np = novaPage()
      page = np.p
      y = np.y - 8
      y = drawHeader(y)
    }

    const rowBg = u.status === 'reservada' ? rgb(1, 0.98, 0.93) : u.status === 'vendida' ? rgb(1, 0.96, 0.96) : alternate ? rgb(0.98, 0.98, 0.98) : branco
    page.drawRectangle({ x: mL, y: y - 3, width: contentW, height: 14, color: rowBg })

    const vals = [
      u.unidade ?? '-',
      u.pavimento ?? '-',
      u.area_construida ? u.area_construida + 'm2' : '-',
      u.quartos ? String(u.quartos) : '-',
      u.posicao?.replace('_', ' ') ?? '-',
      u.valor_imovel ? fmt(u.valor_imovel) : '-',
      u.valor_sinal ? fmt(u.valor_sinal) : '-',
      u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x ${fmt(u.valor_parcela)}` : '-',
      u.quantidade_intercaladas && u.valor_intercalada ? `${u.quantidade_intercaladas}x ${fmt(u.valor_intercalada)}` : '-',
      u.valor_chaves ? fmt(u.valor_chaves) : '-',
      statusLabel[u.status] ?? u.status,
    ]

    let x = mL
    vals.forEach((val, i) => {
      const col = cols[i]
      const isStatus = i === vals.length - 1
      const color = isStatus ? (statusColor[u.status] ?? preto) : i === 5 ? preto : cinza
      const font = i === 0 || i === 5 ? fontB : fontR
      const size = 8
      const tw = font.widthOfTextAtSize(val, size)
      const tx = col.align === 'right' ? x + col.w - tw - 3 : col.align === 'center' ? x + (col.w - tw) / 2 : x + 3
      page.drawText(val, { x: tx, y: y + 2, size, font, color })
      x += col.w
    })

    page.drawLine({ start: { x: mL, y: y - 3 }, end: { x: W - mR, y: y - 3 }, thickness: 0.3, color: rgb(0.92, 0.92, 0.92) })

    alternate = !alternate
    y -= 14
  }

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="tabela-${slug}.pdf"`,
    },
  })
}
