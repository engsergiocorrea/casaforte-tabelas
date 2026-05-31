async function enviarMensagem(numero: string, mensagem: string) {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({ number: numero, text: mensagem }),
  })

  if (!res.ok) {
    console.error(`[WhatsApp] Erro ao enviar para ${numero}:`, await res.text())
  }
}

async function enviarDocumento(numero: string, pdfBase64: string, nomeArquivo: string) {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendMedia/${process.env.EVOLUTION_INSTANCE}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: numero,
      mediatype: 'document',
      mimetype: 'application/pdf',
      media: pdfBase64,
      fileName: nomeArquivo,
    }),
  })

  if (!res.ok) {
    console.error(`[WhatsApp] Erro ao enviar PDF para ${numero}:`, await res.text())
  }
}

export async function enviarWhatsApp(dados: {
  corretorTelefone: string | null
  compradorTelefone: string | null
  mensagem: string
  pdfBase64?: string
  nomeArquivo?: string
}) {
  const internos = [
    process.env.WHATSAPP_RUANA!,
    process.env.WHATSAPP_BRUNA!,
    process.env.WHATSAPP_SERGIO!,
  ]

  // Adiciona corretor
  if (dados.corretorTelefone) {
    const tel = dados.corretorTelefone.replace(/\D/g, '')
    if (tel.length >= 10) internos.push(tel.startsWith('55') ? tel : `55${tel}`)
  }

  // Adiciona comprador
  if (dados.compradorTelefone) {
    const tel = dados.compradorTelefone.replace(/\D/g, '')
    if (tel.length >= 10) internos.push(tel.startsWith('55') ? tel : `55${tel}`)
  }

  // Envia texto para todos
  await Promise.allSettled(internos.map(n => enviarMensagem(n, dados.mensagem)))

  // Envia PDF para todos (se disponível)
  if (dados.pdfBase64 && dados.nomeArquivo) {
    await Promise.allSettled(internos.map(n => enviarDocumento(n, dados.pdfBase64!, dados.nomeArquivo!)))
  }
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

  return `🏠 *Nova Proposta Recebida!*

📍 *Empreendimento:* ${dados.empreendimento}
🏢 *Unidade:* ${dados.unidade}
👤 *Comprador:* ${dados.comprador}
🤝 *Corretor:* ${dados.corretor}
💰 *Valor proposto:* ${valor}

🔗 https://tabelas.casaforteinc.com.br/admin/propostas/${dados.propostaId}`
}
