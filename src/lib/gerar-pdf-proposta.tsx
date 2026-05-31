import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface DadosProposta {
  empreendimento: string
  unidade: string
  pavimento?: string
  area?: string | number
  quartos?: string | number
  comprador1_nome: string
  comprador1_cpf?: string
  comprador1_rg?: string
  comprador1_profissao?: string
  comprador1_email?: string
  comprador1_telefone?: string
  comprador1_nascimento?: string
  comprador1_estado_civil?: string
  conjuge_nome?: string
  conjuge_cpf?: string
  comprador2_nome?: string
  comprador2_cpf?: string
  corretor_nome?: string
  corretor_cpf_cnpj?: string
  corretor_creci?: string
  corretor_telefone?: string
  imobiliaria_nome?: string
  segue_tabela?: boolean
  valor_proposto?: number
  valor_sinal?: number
  quantidade_parcelas?: number
  valor_parcela?: number
  quantidade_intercaladas?: number
  periodicidade_intercaladas?: string
  valor_intercalada?: number
  valor_chaves?: number
  observacoes_pagamento?: string
  observacoes?: string
  propostaId: string
  dataEnvio: string
}

function fmt(v: any): string {
  if (!v && v !== 0) return '—'
  const n = Number(v)
  if (!n) return '—'
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export async function gerarPdfProposta(dados: DadosProposta): Promise<string> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595, 842])
  const { width, height } = page.getSize()

  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const vermelho = rgb(0.91, 0.22, 0.055)
  const cinza = rgb(0.62, 0.62, 0.62)
  const preto = rgb(0.07, 0.07, 0.07)
  const cinzaClaro = rgb(0.96, 0.98, 0.99)

  let y = height - 40

  function texto(txt: string, x: number, yPos: number, opts: { bold?: boolean, size?: number, color?: any } = {}) {
    const font = opts.bold ? fontBold : fontRegular
    const size = opts.size ?? 10
    const color = opts.color ?? preto
    page.drawText(String(txt || ''), { x, y: yPos, size, font, color })
  }

  function linha(yPos: number) {
    page.drawLine({ start: { x: 40, y: yPos }, end: { x: width - 40, y: yPos }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })
  }

  function retangulo(x: number, yPos: number, w: number, h: number, color: any) {
    page.drawRectangle({ x, y: yPos, width: w, height: h, color })
  }

  function secao(titulo: string) {
    y -= 8
    page.drawLine({ start: { x: 40, y }, end: { x: width - 40, y }, thickness: 0.5, color: rgb(0.95, 0.84, 0.8) })
    y -= 14
    texto(titulo, 40, y, { bold: true, size: 10, color: vermelho })
    y -= 16
  }

  // Header
  retangulo(0, height - 60, width, 60, rgb(0.99, 0.99, 0.99))
  texto('Casa Forte', 40, height - 30, { bold: true, size: 18, color: vermelho })
  texto('Proposta de Compra', width - 180, height - 22, { size: 8, color: cinza })
  texto(`#${dados.propostaId.slice(0, 8).toUpperCase()}`, width - 180, height - 34, { size: 8, color: cinza })
  texto(dados.dataEnvio, width - 180, height - 46, { size: 8, color: cinza })
  page.drawLine({ start: { x: 40, y: height - 62 }, end: { x: width - 40, y: height - 62 }, thickness: 2, color: vermelho })

  y = height - 80

  // Titulo
  texto(dados.empreendimento, 40, y, { bold: true, size: 14 })
  y -= 16
  const subtitulo = `Unidade ${dados.unidade}${dados.pavimento ? ` - ${dados.pavimento}` : ''}${dados.area ? ` - ${dados.area}m2` : ''}${dados.quartos ? ` - ${dados.quartos} quartos` : ''}`
  texto(subtitulo, 40, y, { size: 9, color: cinza })
  y -= 24

  // Comprador
  secao('Dados do Comprador')
  texto('NOME COMPLETO', 40, y, { size: 7, color: cinza })
  texto(dados.comprador1_nome || '', 40, y - 12, { size: 9 })
  y -= 28

  const col1 = 40, col2 = 310
  const pares: [string, any][] = [
    ['CPF', dados.comprador1_cpf],
    ['RG', dados.comprador1_rg],
    ['PROFISSAO', dados.comprador1_profissao],
    ['NASCIMENTO', dados.comprador1_nascimento],
    ['ESTADO CIVIL', dados.comprador1_estado_civil],
    ['E-MAIL', dados.comprador1_email],
    ['TELEFONE', dados.comprador1_telefone],
  ]
  for (let i = 0; i < pares.length; i += 2) {
    const [l1, v1] = pares[i]
    const [l2, v2] = pares[i + 1] ?? ['', null]
    if (v1) { texto(l1, col1, y, { size: 7, color: cinza }); texto(String(v1), col1, y - 12, { size: 9 }) }
    if (v2) { texto(l2, col2, y, { size: 7, color: cinza }); texto(String(v2), col2, y - 12, { size: 9 }) }
    if (v1 || v2) y -= 28
  }
  if (dados.conjuge_nome) { texto('CONJUGE', col1, y, { size: 7, color: cinza }); texto(dados.conjuge_nome, col1, y - 12, { size: 9 }); y -= 28 }
  if (dados.comprador2_nome) { texto('2 COMPRADOR', col1, y, { size: 7, color: cinza }); texto(dados.comprador2_nome, col1, y - 12, { size: 9 }); y -= 28 }

  // Corretor
  secao('Corretor / Imobiliaria')
  if (dados.corretor_nome) { texto('CORRETOR', col1, y, { size: 7, color: cinza }); texto(dados.corretor_nome, col1, y - 12, { size: 9, bold: true }) }
  if (dados.corretor_telefone) { texto('TELEFONE', col2, y, { size: 7, color: cinza }); texto(dados.corretor_telefone, col2, y - 12, { size: 9 }) }
  y -= 28
  if (dados.corretor_creci) { texto('CRECI', col1, y, { size: 7, color: cinza }); texto(dados.corretor_creci, col1, y - 12, { size: 9 }) }
  if (dados.imobiliaria_nome) { texto('IMOBILIARIA', col2, y, { size: 7, color: cinza }); texto(dados.imobiliaria_nome, col2, y - 12, { size: 9 }) }
  y -= 28

  // Pagamento
  secao('Condicoes de Pagamento')
  retangulo(40, y - 36, width - 80, 44, cinzaClaro)
  texto('VALOR TOTAL PROPOSTO', 48, y - 8, { size: 7, color: cinza })
  texto(fmt(dados.valor_proposto) !== '—' ? fmt(dados.valor_proposto) : 'Segue tabela', 48, y - 22, { bold: true, size: 14, color: vermelho })
  if (dados.segue_tabela) texto('Segue valores da tabela', 48, y - 34, { size: 7, color: cinza })
  y -= 52

  const pagPares: [string, any][] = [
    ['SINAL', fmt(dados.valor_sinal)],
    ['PARCELAS MENSAIS', dados.quantidade_parcelas ? `${dados.quantidade_parcelas}x de ${fmt(dados.valor_parcela)}` : null],
    ['INTERCALADAS', dados.quantidade_intercaladas ? `${dados.quantidade_intercaladas}x de ${fmt(dados.valor_intercalada)}${dados.periodicidade_intercaladas ? ` (${dados.periodicidade_intercaladas})` : ''}` : null],
    ['CHAVES', fmt(dados.valor_chaves)],
  ]
  for (let i = 0; i < pagPares.length; i += 2) {
    const [l1, v1] = pagPares[i]
    const [l2, v2] = pagPares[i + 1] ?? ['', null]
    if (v1 && v1 !== '—') { texto(l1, col1, y, { size: 7, color: cinza }); texto(String(v1), col1, y - 12, { size: 9 }) }
    if (v2 && v2 !== '—') { texto(l2, col2, y, { size: 7, color: cinza }); texto(String(v2), col2, y - 12, { size: 9 }) }
    if ((v1 && v1 !== '—') || (v2 && v2 !== '—')) y -= 28
  }
  if (dados.observacoes_pagamento) {
    texto('OBS. PAGAMENTO', col1, y, { size: 7, color: cinza })
    texto(dados.observacoes_pagamento.slice(0, 80), col1, y - 12, { size: 9 })
    y -= 28
  }

  // Observacoes
  if (dados.observacoes) {
    secao('Observacoes')
    texto(dados.observacoes.slice(0, 120), 40, y, { size: 9 })
    y -= 28
  }

  // Rodape
  linha(40)
  texto('Casa Forte Incorporacoes - tabelas.casaforteinc.com.br', 40, 28, { size: 7, color: cinza })
  texto(`#${dados.propostaId.slice(0, 8).toUpperCase()}`, width - 100, 28, { size: 7, color: cinza })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes).toString('base64')
}
