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

  if (!empreendimento) return new NextResponse('Nao encontrado', { status: 404 })

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento')
    .order('unidade')

  const unidadesFiltradas = (unidades ?? []).filter(u => u.status !== 'bloqueada' && u.status !== 'indisponivel')

  const fmt = (v: any) => v ? `R$${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'

  // Remove acentos para pdf-lib
  function s(text: string): string {
    return (text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x00-\x7F]/g, '')
  }

  const indiceLabel: Record<string, string> = {
    'incc_m': 'INCC-M', 'incc': 'INCC', 'igpm': 'IGP-M', 'ipca': 'IPCA',
    '1_mais_igpm': '1% + IGP-M', '1_mais_ipca': '1% + IPCA', '1_mais_incc': '1% + INCC',
    'pre_fixado': 'Pre-fixado', 'sem_correcao': 'Sem correcao',
  }

  const statusLabel: Record<string, string> = { disponivel: 'Disponivel', reservada: 'Reservada', vendida: 'Vendida' }
  const statusColor: Record<string, any> = {
    disponivel: rgb(0.08, 0.5, 0.24),
    reservada: rgb(0.7, 0.28, 0.04),
    vendida: rgb(0.73, 0.07, 0.07),
  }

  const pdfDoc = await PDFDocument.create()
  const fontR = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontB = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const preto = rgb(0.07, 0.07, 0.07)
  const cinza = rgb(0.55, 0.55, 0.55)
  const cinzaClaro = rgb(0.96, 0.96, 0.96)
  const vermelho = rgb(0.91, 0.22, 0.055)
  const branco = rgb(1, 1, 1)
  const escuro = rgb(0.12, 0.12, 0.12)
  const headerCor = rgb(0.18, 0.18, 0.18)

  let logoImage: any = null
  try {
    const logoResp = await fetch('https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png')
    const logoBytes = new Uint8Array(await logoResp.arrayBuffer())
    logoImage = await pdfDoc.embedPng(logoBytes)
  } catch (e) {}

  const W = 841.89
  const H = 595.28
  const mL = 18, mR = 18, mB = 18
  const contentW = W - mL - mR

  function novaPage() {
    const p = pdfDoc.addPage([W, H])
    p.drawRectangle({ x: 0, y: H - 50, width: W, height: 50, color: escuro })
    p.drawRectangle({ x: 0, y: H - 52, width: W, height: 2, color: vermelho })
    if (logoImage) p.drawImage(logoImage, { x: mL, y: H - 44, width: 75, height: 28 })
    p.drawText(s(empreendimento.nome), { x: mL + 85, y: H - 24, size: 13, font: fontB, color: branco })
    p.drawText(s(`${empreendimento.cidade}, ${empreendimento.estado}  |  Tabela de Vendas  |  ${new Date().toLocaleDateString('pt-BR')}`), { x: mL + 85, y: H - 38, size: 8, font: fontR, color: cinza })
    p.drawLine({ start: { x: mL, y: mB + 8 }, end: { x: W - mR, y: mB + 8 }, thickness: 0.4, color: cinza })
    p.drawText('Casa Forte Construtora e Incorporadora  |  Valores de referencia sujeitos a alteracao.', { x: mL, y: mB, size: 7, font: fontR, color: cinza })
    return { p, y: H - 58 }
  }

  let { p: page, y } = novaPage()

  // Resumo
  const disponiveis = unidadesFiltradas.filter(u => u.status === 'disponivel').length
  const reservadas = unidadesFiltradas.filter(u => u.status === 'reservada').length
  const vendidas = unidadesFiltradas.filter(u => u.status === 'vendida').length

  y -= 6
  const bw = (contentW - 18) / 4
  ;[
    { l: 'Total', v: String(unidadesFiltradas.length), c: preto },
    { l: 'Disponiveis', v: String(disponiveis), c: rgb(0.08, 0.5, 0.24) },
    { l: 'Reservadas', v: String(reservadas), c: rgb(0.7, 0.28, 0.04) },
    { l: 'Vendidas', v: String(vendidas), c: rgb(0.73, 0.07, 0.07) },
  ].forEach((b, i) => {
    const bx = mL + i * (bw + 6)
    page.drawRectangle({ x: bx, y: y - 26, width: bw, height: 30, color: cinzaClaro, borderColor: rgb(0.85, 0.85, 0.85), borderWidth: 0.5 })
    page.drawText(b.l, { x: bx + 5, y: y + 1, size: 7, font: fontR, color: cinza })
    page.drawText(b.v, { x: bx + 5, y: y - 17, size: 13, font: fontB, color: b.c })
  })
  y -= 36

  // Condições destacadas
  y -= 4
  page.drawRectangle({ x: mL, y: y - 6, width: contentW, height: 18, color: escuro })
  page.drawRectangle({ x: mL, y: y - 6, width: 3, height: 18, color: vermelho })
  const conds = [
    { label: 'Correcao ate entrega:', value: indiceLabel[empreendimento.indice_ate_entrega] ?? s(empreendimento.indice_ate_entrega ?? '-') },
    { label: 'Correcao apos entrega:', value: indiceLabel[empreendimento.indice_apos_entrega] ?? s(empreendimento.indice_apos_entrega ?? '-') },
    { label: 'Parcelamento:', value: `ate ${empreendimento.parcelas_padrao ?? 60}x mensais` },
    empreendimento.data_prevista_entrega ? { label: 'Entrega prev.:', value: new Date(empreendimento.data_prevista_entrega).toLocaleDateString('pt-BR') } : null,
  ].filter(Boolean) as { label: string, value: string }[]
  conds.forEach((c, i) => {
    const lx = mL + 6 + i * (contentW / 4)
    page.drawText(c.label, { x: lx, y: y + 5, size: 7, font: fontR, color: cinza })
    page.drawText(c.value, { x: lx + fontR.widthOfTextAtSize(c.label + ' ', 7), y: y + 5, size: 7.5, font: fontB, color: branco })
  })
  y -= 22

  // Colunas
  const temAreaExt = unidadesFiltradas.some(u => u.area_privativa_externa)
  const cols = temAreaExt ? [
    { label: 'Unidade',    w: 44,  align: 'left'   },
    { label: 'Pavimento',  w: 92,  align: 'left'   },
    { label: 'Area Priv.', w: 42,  align: 'right'  },
    { label: 'Area Ext.',  w: 42,  align: 'right'  },
    { label: 'Qtos',       w: 24,  align: 'center' },
    { label: 'Posicao',    w: 50,  align: 'left'   },
    { label: 'Valor',      w: 82,  align: 'right'  },
    { label: 'Entrada',    w: 72,  align: 'right'  },
    { label: 'Parcelas',   w: 84,  align: 'right'  },
    { label: 'Intercal.',  w: 84,  align: 'right'  },
    { label: 'Chaves',     w: 72,  align: 'right'  },
    { label: 'Status',     w: 57,  align: 'center' },
  ] : [
    { label: 'Unidade',    w: 48,  align: 'left'   },
    { label: 'Pavimento',  w: 102, align: 'left'   },
    { label: 'Area',       w: 42,  align: 'right'  },
    { label: 'Qtos',       w: 26,  align: 'center' },
    { label: 'Posicao',    w: 54,  align: 'left'   },
    { label: 'Valor',      w: 88,  align: 'right'  },
    { label: 'Entrada',    w: 76,  align: 'right'  },
    { label: 'Parcelas',   w: 90,  align: 'right'  },
    { label: 'Intercal.',  w: 90,  align: 'right'  },
    { label: 'Chaves',     w: 76,  align: 'right'  },
    { label: 'Status',     w: 53,  align: 'center' },
  ]

  // Ajusta para preencher exato
  const totalW = cols.reduce((a, c) => a + c.w, 0)
  cols[1].w += contentW - totalW

  function truncate(text: string, font: any, size: number, maxW: number): string {
    if (font.widthOfTextAtSize(text, size) <= maxW) return text
    let t = text
    while (t.length > 0 && font.widthOfTextAtSize(t + '..', size) > maxW) t = t.slice(0, -1)
    return t + '..'
  }

  function drawHeader(yPos: number) {
    page.drawRectangle({ x: mL, y: yPos - 4, width: contentW, height: 15, color: headerCor })
    let x = mL
    cols.forEach(col => {
      const txt = col.label.toUpperCase()
      const tw = fontB.widthOfTextAtSize(txt, 6.5)
      const tx = col.align === 'right' ? x + col.w - tw - 3 : col.align === 'center' ? x + (col.w - tw) / 2 : x + 3
      page.drawText(txt, { x: tx, y: yPos + 5, size: 6.5, font: fontB, color: branco })
      x += col.w
    })
    return yPos - 17
  }

  y = drawHeader(y)

  let alternate = false
  for (const u of unidadesFiltradas) {
    if (y < mB + 28) {
      const np = novaPage()
      page = np.p
      y = np.y - 8
      y = drawHeader(y)
    }

    const rowBg = u.status === 'reservada' ? rgb(1, 0.97, 0.88) : u.status === 'vendida' ? rgb(1, 0.95, 0.95) : alternate ? rgb(0.975, 0.975, 0.975) : branco
    page.drawRectangle({ x: mL, y: y - 2, width: contentW, height: 13, color: rowBg })

    const vals = temAreaExt ? [
      s(u.unidade ?? '-'),
      s(u.pavimento ?? '-'),
      u.area_construida ? u.area_construida + 'm2' : '-',
      u.area_privativa_externa ? u.area_privativa_externa + 'm2' : '-',
      u.quartos ? String(u.quartos) : '-',
      s(u.posicao?.replace(/_/g, ' ') ?? '-'),
      u.valor_imovel ? fmt(u.valor_imovel) : '-',
      u.valor_sinal ? fmt(u.valor_sinal) : '-',
      u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x ${fmt(u.valor_parcela)}` : '-',
      u.quantidade_intercaladas && u.valor_intercalada ? `${u.quantidade_intercaladas}x ${fmt(u.valor_intercalada)}` : '-',
      u.valor_chaves ? fmt(u.valor_chaves) : '-',
      statusLabel[u.status] ?? u.status,
    ] : [
      s(u.unidade ?? '-'),
      s(u.pavimento ?? '-'),
      u.area_construida ? u.area_construida + 'm2' : '-',
      u.quartos ? String(u.quartos) : '-',
      s(u.posicao?.replace(/_/g, ' ') ?? '-'),
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
      const isValor = temAreaExt ? i === 6 : i === 5
      const font = (i === 0 || isValor) ? fontB : fontR
      const color = isStatus ? (statusColor[u.status] ?? preto) : isValor ? preto : cinza
      const size = 8
      const maxW = col.w - 5
      const txt = truncate(String(val), font, size, maxW)
      const tw = font.widthOfTextAtSize(txt, size)
      const tx = col.align === 'right' ? x + col.w - tw - 3 : col.align === 'center' ? x + (col.w - tw) / 2 : x + 3
      page.drawText(txt, { x: tx, y: y + 2, size, font, color })
      x += col.w
    })

    page.drawLine({ start: { x: mL, y: y - 2 }, end: { x: W - mR, y: y - 2 }, thickness: 0.2, color: rgb(0.9, 0.9, 0.9) })
    alternate = !alternate
    y -= 13
  }

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="tabela-${slug}.pdf"`,
    },
  })
}
