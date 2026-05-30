export async function enviarWhatsApp(mensagem: string) {
  const url = `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE}`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': process.env.EVOLUTION_API_KEY!,
    },
    body: JSON.stringify({
      number: process.env.WHATSAPP_DESTINO,
      text: mensagem,
    }),
  })

  if (!res.ok) {
    console.error('[WhatsApp] Erro:', await res.text())
    throw new Error('Falha no envio')
  }

  return res.json()
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
    : '_Segue tabela_'

  return `🏠 *Nova proposta recebida!*

📍 *Empreendimento:* ${dados.empreendimento}
🏢 *Unidade:* ${dados.unidade}
👤 *Comprador:* ${dados.comprador}
🤝 *Corretor:* ${dados.corretor ?? 'Não informado'}
💰 *Valor proposto:* ${valor}

🔗 https://tabelas.casaforteinc.com.br/admin/propostas/${dados.propostaId}`
}
