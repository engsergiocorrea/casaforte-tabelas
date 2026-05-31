import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#E8390E' },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#E8390E' },
  headerSub: { fontSize: 9, color: '#6b7280', textAlign: 'right' },
  titulo: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitulo: { fontSize: 10, color: '#6b7280', marginBottom: 20 },
  secaoTitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#E8390E', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f3d5cc' },
  secao: { marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  campo: { width: '50%', marginBottom: 8, paddingRight: 8 },
  campoFull: { width: '100%', marginBottom: 8 },
  label: { fontSize: 8, color: '#9ca3af', marginBottom: 2 },
  valor: { fontSize: 10, color: '#111' },
  destaque: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#E8390E' },
  rodape: { position: 'absolute', bottom: 28, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: '#e5e7eb', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  rodapeTexto: { fontSize: 7, color: '#9ca3af' },
})

function fmt(v: any): string {
  if (!v && v !== 0) return ''
  const n = Number(v)
  if (!n) return ''
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

// Cria elementos sem JSX usando a API interna do @react-pdf/renderer
const el = (type: any, props: any, ...children: any[]) => ({
  type,
  props: { ...props, children: children.filter(Boolean) },
  key: null,
})

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

export async function gerarPdfProposta(dados: DadosProposta): Promise<string> {
  const parcelas = dados.quantidade_parcelas && dados.valor_parcela
    ? `${dados.quantidade_parcelas}x de ${fmt(dados.valor_parcela)}`
    : ''

  const intercaladas = dados.quantidade_intercaladas && dados.valor_intercalada
    ? `${dados.quantidade_intercaladas}x de ${fmt(dados.valor_intercalada)}${dados.periodicidade_intercaladas ? ` (${dados.periodicidade_intercaladas})` : ''}`
    : ''

  function campo(label: string, valor: any, full = false) {
    if (!valor) return null
    return el(View, { style: full ? styles.campoFull : styles.campo },
      el(Text, { style: styles.label }, label),
      el(Text, { style: styles.valor }, String(valor))
    )
  }

  function secao(titulo: string, ...filhos: any[]) {
    return el(View, { style: styles.secao },
      el(Text, { style: styles.secaoTitulo }, titulo),
      el(View, { style: styles.grid }, ...filhos.filter(Boolean))
    )
  }

  const doc = el(Document, {},
    el(Page, { size: 'A4', style: styles.page },

      el(View, { style: styles.header },
        el(Text, { style: styles.logo }, 'Casa Forte'),
        el(View, {},
          el(Text, { style: styles.headerSub }, 'Proposta de Compra'),
          el(Text, { style: styles.headerSub }, `#${dados.propostaId.slice(0, 8).toUpperCase()}`),
          el(Text, { style: styles.headerSub }, dados.dataEnvio),
        )
      ),

      el(Text, { style: styles.titulo }, dados.empreendimento),
      el(Text, { style: styles.subtitulo },
        `Unidade ${dados.unidade}${dados.pavimento ? ` · ${dados.pavimento}` : ''}${dados.area ? ` · ${dados.area}m²` : ''}${dados.quartos ? ` · ${dados.quartos} quartos` : ''}`
      ),

      secao('Dados do Comprador',
        campo('Nome completo', dados.comprador1_nome, true),
        campo('CPF', dados.comprador1_cpf),
        campo('RG', dados.comprador1_rg),
        campo('Profissão', dados.comprador1_profissao),
        campo('Nascimento', dados.comprador1_nascimento),
        campo('Estado civil', dados.comprador1_estado_civil),
        campo('E-mail', dados.comprador1_email),
        campo('Telefone', dados.comprador1_telefone),
        campo('Cônjuge', dados.conjuge_nome),
        campo('CPF cônjuge', dados.conjuge_cpf),
        campo('2º comprador', dados.comprador2_nome, true),
        campo('CPF 2º comprador', dados.comprador2_cpf),
      ),

      secao('Corretor / Imobiliária',
        campo('Corretor', dados.corretor_nome, true),
        campo('CPF/CNPJ', dados.corretor_cpf_cnpj),
        campo('CRECI', dados.corretor_creci),
        campo('Telefone', dados.corretor_telefone),
        campo('Imobiliária', dados.imobiliaria_nome),
      ),

      el(View, { style: styles.secao },
        el(Text, { style: styles.secaoTitulo }, 'Condições de Pagamento'),
        el(View, { style: styles.grid },
          el(View, { style: styles.campoFull },
            el(Text, { style: styles.label }, 'Valor total proposto'),
            el(Text, { style: styles.destaque }, fmt(dados.valor_proposto) || 'Segue tabela'),
            dados.segue_tabela ? el(Text, { style: { fontSize: 8, color: '#6b7280', marginTop: 2 } }, 'Segue valores da tabela') : null,
          ),
          campo('Sinal', fmt(dados.valor_sinal)),
          campo('Parcelas mensais', parcelas),
          campo('Intercaladas', intercaladas),
          campo('Chaves', fmt(dados.valor_chaves)),
          campo('Obs. pagamento', dados.observacoes_pagamento, true),
        )
      ),

      dados.observacoes ? secao('Observações', campo('', dados.observacoes, true)) : null,

      el(View, { style: styles.rodape },
        el(Text, { style: styles.rodapeTexto }, 'Casa Forte Incorporações · tabelas.casaforteinc.com.br'),
        el(Text, { style: styles.rodapeTexto }, `#${dados.propostaId.slice(0, 8).toUpperCase()}`),
      )
    )
  )

  const buffer = await renderToBuffer(doc as any)
  return buffer.toString('base64')
}
