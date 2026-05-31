import ReactPDF, { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#111' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: '#E8390E' },
  logo: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: '#E8390E' },
  headerSub: { fontSize: 9, color: '#6b7280', textAlign: 'right' },
  titulo: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitulo: { fontSize: 10, color: '#6b7280', marginBottom: 20 },
  secao: { marginBottom: 16 },
  secaoTitulo: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#E8390E', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#f3d5cc' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  campo: { width: '48%', marginBottom: 8 },
  campoFull: { width: '100%', marginBottom: 8 },
  label: { fontSize: 8, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase' },
  valor: { fontSize: 10, color: '#111' },
  destaque: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#E8390E' },
  rodape: { position: 'absolute', bottom: 30, left: 40, right: 40, borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  rodapeTexto: { fontSize: 8, color: '#9ca3af' },
})

function Campo({ label, valor, full = false }: { label: string; valor: string; full?: boolean }) {
  if (!valor) return null
  return (
    <View style={full ? styles.campoFull : styles.campo}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  )
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.secao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  )
}

function fmt(v: any) {
  if (!v) return '—'
  return `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
}

export async function gerarPdfProposta(dados: {
  empreendimento: string
  unidade: string
  pavimento: string
  area: string
  quartos: string
  comprador1_nome: string
  comprador1_cpf: string
  comprador1_rg: string
  comprador1_profissao: string
  comprador1_email: string
  comprador1_telefone: string
  comprador1_nascimento: string
  comprador1_estado_civil: string
  conjuge_nome?: string
  conjuge_cpf?: string
  comprador2_nome?: string
  comprador2_cpf?: string
  corretor_nome: string
  corretor_cpf_cnpj: string
  corretor_creci: string
  corretor_telefone: string
  imobiliaria_nome: string
  segue_tabela: boolean
  valor_proposto: number
  valor_sinal: number
  quantidade_parcelas: number
  valor_parcela: number
  quantidade_intercaladas: number
  periodicidade_intercaladas: string
  valor_intercalada: number
  valor_chaves: number
  observacoes_pagamento: string
  observacoes: string
  propostaId: string
  dataEnvio: string
}): Promise<string> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>Casa Forte</Text>
          <View>
            <Text style={styles.headerSub}>Proposta de Compra</Text>
            <Text style={styles.headerSub}>#{dados.propostaId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerSub}>{dados.dataEnvio}</Text>
          </View>
        </View>

        {/* Identificação */}
        <Text style={styles.titulo}>{dados.empreendimento}</Text>
        <Text style={styles.subtitulo}>Unidade {dados.unidade} · {dados.pavimento} · {dados.area}m² · {dados.quartos} quartos</Text>

        {/* Comprador */}
        <Secao titulo="Dados do Comprador">
          <Campo label="Nome completo" valor={dados.comprador1_nome} full />
          <Campo label="CPF" valor={dados.comprador1_cpf} />
          <Campo label="RG" valor={dados.comprador1_rg} />
          <Campo label="Profissão" valor={dados.comprador1_profissao} />
          <Campo label="Nascimento" valor={dados.comprador1_nascimento} />
          <Campo label="Estado civil" valor={dados.comprador1_estado_civil} />
          <Campo label="E-mail" valor={dados.comprador1_email} />
          <Campo label="Telefone" valor={dados.comprador1_telefone} />
          {dados.conjuge_nome && <Campo label="Cônjuge" valor={dados.conjuge_nome} />}
          {dados.conjuge_cpf && <Campo label="CPF cônjuge" valor={dados.conjuge_cpf} />}
          {dados.comprador2_nome && <Campo label="2º comprador" valor={dados.comprador2_nome} full />}
          {dados.comprador2_cpf && <Campo label="CPF 2º comprador" valor={dados.comprador2_cpf} />}
        </Secao>

        {/* Corretor */}
        <Secao titulo="Corretor / Imobiliária">
          <Campo label="Corretor" valor={dados.corretor_nome} full />
          <Campo label="CPF/CNPJ" valor={dados.corretor_cpf_cnpj} />
          <Campo label="CRECI" valor={dados.corretor_creci} />
          <Campo label="Telefone" valor={dados.corretor_telefone} />
          <Campo label="Imobiliária" valor={dados.imobiliaria_nome} />
        </Secao>

        {/* Pagamento */}
        <Secao titulo="Condições de Pagamento">
          <View style={styles.campoFull}>
            <Text style={styles.label}>Valor total proposto</Text>
            <Text style={styles.destaque}>{fmt(dados.valor_proposto)}</Text>
            {dados.segue_tabela && <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>Segue valores da tabela</Text>}
          </View>
          <Campo label="Sinal" valor={fmt(dados.valor_sinal)} />
          <Campo label="Parcelas mensais" valor={dados.quantidade_parcelas ? `${dados.quantidade_parcelas}x de ${fmt(dados.valor_parcela)}` : ''} />
          <Campo label="Intercaladas" valor={dados.quantidade_intercaladas ? `${dados.quantidade_intercaladas}x de ${fmt(dados.valor_intercalada)} (${dados.periodicidade_intercaladas})` : ''} />
          <Campo label="Chaves" valor={fmt(dados.valor_chaves)} />
          {dados.observacoes_pagamento && <Campo label="Obs. pagamento" valor={dados.observacoes_pagamento} full />}
        </Secao>

        {/* Observações */}
        {dados.observacoes && (
          <Secao titulo="Observações">
            <Campo label="" valor={dados.observacoes} full />
          </Secao>
        )}

        {/* Rodapé */}
        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>Casa Forte Incorporações · tabelas.casaforteinc.com.br</Text>
          <Text style={styles.rodapeTexto}>Proposta #{dados.propostaId.slice(0, 8).toUpperCase()}</Text>
        </View>
      </Page>
    </Document>
  )

  const buffer = await ReactPDF.renderToBuffer(doc)
  return buffer.toString('base64')
}
