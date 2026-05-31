import React from 'react'
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

function fmt(v: any) {
  if (!v && v !== 0) return ''
  const n = Number(v)
  if (!n) return ''
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

function campo(label: string, valor: any, full = false) {
  if (!valor) return null
  return React.createElement(View, { style: full ? styles.campoFull : styles.campo },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.valor }, String(valor))
  )
}

function secao(titulo: string, ...campos: any[]) {
  return React.createElement(View, { style: styles.secao },
    React.createElement(Text, { style: styles.secaoTitulo }, titulo),
    React.createElement(View, { style: styles.grid }, ...campos.filter(Boolean))
  )
}

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

  const doc = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },

      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.logo }, 'Casa Forte'),
        React.createElement(View, null,
          React.createElement(Text, { style: styles.headerSub }, 'Proposta de Compra'),
          React.createElement(Text, { style: styles.headerSub }, `#${dados.propostaId.slice(0, 8).toUpperCase()}`),
          React.createElement(Text, { style: styles.headerSub }, dados.dataEnvio),
        )
      ),

      // Título
      React.createElement(Text, { style: styles.titulo }, dados.empreendimento),
      React.createElement(Text, { style: styles.subtitulo },
        `Unidade ${dados.unidade}${dados.pavimento ? ` · ${dados.pavimento}` : ''}${dados.area ? ` · ${dados.area}m²` : ''}${dados.quartos ? ` · ${dados.quartos} quartos` : ''}`
      ),

      // Comprador
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

      // Corretor
      secao('Corretor / Imobiliária',
        campo('Corretor', dados.corretor_nome, true),
        campo('CPF/CNPJ', dados.corretor_cpf_cnpj),
        campo('CRECI', dados.corretor_creci),
        campo('Telefone', dados.corretor_telefone),
        campo('Imobiliária', dados.imobiliaria_nome),
      ),

      // Pagamento
      React.createElement(View, { style: styles.secao },
        React.createElement(Text, { style: styles.secaoTitulo }, 'Condições de Pagamento'),
        React.createElement(View, { style: styles.grid },
          React.createElement(View, { style: styles.campoFull },
            React.createElement(Text, { style: styles.label }, 'Valor total proposto'),
            React.createElement(Text, { style: styles.destaque }, fmt(dados.valor_proposto)),
            dados.segue_tabela ? React.createElement(Text, { style: { fontSize: 8, color: '#6b7280', marginTop: 2 } }, 'Segue valores da tabela') : null,
          ),
          campo('Sinal', fmt(dados.valor_sinal)),
          campo('Parcelas mensais', parcelas),
          campo('Intercaladas', intercaladas),
          campo('Chaves', fmt(dados.valor_chaves)),
          campo('Obs. pagamento', dados.observacoes_pagamento, true),
        )
      ),

      // Observações
      dados.observacoes ? secao('Observações', campo('', dados.observacoes, true)) : null,

      // Rodapé
      React.createElement(View, { style: styles.rodape },
        React.createElement(Text, { style: styles.rodapeTexto }, 'Casa Forte Incorporações · tabelas.casaforteinc.com.br'),
        React.createElement(Text, { style: styles.rodapeTexto }, `#${dados.propostaId.slice(0, 8).toUpperCase()}`),
      )
    )
  )

  const buffer = await renderToBuffer(doc)
  return buffer.toString('base64')
}
