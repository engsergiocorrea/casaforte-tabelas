async function enviarMensagem(numero: string, mensagem: string) {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: numero,
      text: mensagem,
    }),
  })

  if (!res.ok) {
    console.error(`[WhatsApp] Erro ao enviar para ${numero}:`, await res.text())
  }

  return res.json()
}

export async function enviarWhatsApp(dados: {
  corretorTelefone: string | null
  mensagem: string
}) {
  const destinatarios = [
    process.env.WHATSAPP_RUANA!,
    process.env.WHATSAPP_BRUNA!,
    process.env.WHATSAPP_SERGIO!,
  ]

  // Adiciona o corretor se tiver telefone
  if (dados.corretorTelefone) {
    const tel = dados.corretorTelefone.replace(/\D/g, '')
    if (tel.length >= 10) {
      destinatarios.push(tel.startsWith('55') ? tel : `55${tel}`)
    }
  }

  // Envia para todos em paralelo
  await Promise.allSettled(
    destinatarios.map(numero => enviarMensagem(numero, dados.mensagem))
  )
}

export function formatarMensagemProposta(dados: {
  empreendimento: string
  unidade: string
  comprador: string
  corretor: string
  valorProposto: number | null
  propostaId: string
}) {
  const valor = dados.valorProposto
    ? `R$ ${dados.valorProposto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : 'Segue tabela'

  return [
    'Nova Proposta Recebida!',
    '',
    `Empreendimento: ${dados.empreendimento}`,
    `Unidade: ${dados.unidade}`,
    `Comprador: ${dados.comprador}`,
    `Corretor: ${dados.corretor}`,
    `Valor proposto: ${valor}`,
    '',
    `Ver proposta: https://tabelas.casaforteinc.com.br/admin/propostas/${dados.propostaId}`,
  ].join('\n')
}
