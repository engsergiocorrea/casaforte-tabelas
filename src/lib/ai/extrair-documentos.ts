// Extração de dados de documentos do cliente (RG/CNH, CPF, comprovante,
// certidão) via Google Gemini (File API — suporta arquivos grandes). Usada na
// proposta pública para pré-preencher os dados do comprador. Server-only.

export interface PessoaExtraida {
  nome?: string
  cpf?: string
  rg?: string
  orgao_rg?: string
  data_nascimento?: string
  nacionalidade?: string
  naturalidade?: string
  profissao?: string
  estado_civil?: string
  endereco?: string
  email?: string
  telefone?: string
}

export interface DadosExtraidos {
  comprador?: PessoaExtraida
  conjuge?: PessoaExtraida
  comprador2?: PessoaExtraida
}

export interface ArquivoEntrada {
  mimeType: string
  bytes: Buffer
  nome?: string
}

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta'
const UPLOAD_BASE = 'https://generativelanguage.googleapis.com/upload/v1beta/files'

const PROMPT = `Você lê documentos pessoais brasileiros (RG, CNH, CPF, comprovante de residência, certidão de casamento) e extrai os dados para preencher a proposta de compra de um imóvel.

Analise TODOS os arquivos enviados (podem ser de uma ou mais pessoas) e retorne um JSON com esta estrutura exata:
{
  "comprador":  { "nome": "", "cpf": "", "rg": "", "orgao_rg": "", "data_nascimento": "", "profissao": "", "estado_civil": "", "email": "", "telefone": "" },
  "conjuge":    { "nome": "", "cpf": "", "rg": "", "orgao_rg": "", "data_nascimento": "", "profissao": "", "email": "", "telefone": "" },
  "comprador2": { "nome": "", "cpf": "", "rg": "", "orgao_rg": "", "data_nascimento": "", "profissao": "", "estado_civil": "", "email": "", "telefone": "" }
}

Regras:
- "comprador" = a pessoa principal (dona do RG/CNH). Havendo certidão de casamento, o cônjuge dela vai em "conjuge". Documentos de uma segunda pessoa compradora claramente distinta (não cônjuge) vão em "comprador2".
- Datas no formato DD/MM/AAAA.
- CPF no formato 000.000.000-00. Em "rg" ponha o número como está no documento; o órgão emissor (ex.: SSP/AL, SDS/PE) vai em "orgao_rg".
- "estado_civil" deve ser exatamente um destes: "solteiro", "casado", "divorciado", "viuvo", "uniao_estavel".
- Preencha SOMENTE o que estiver nos documentos. Campo não encontrado: string vazia "". NÃO invente dados.
- Havendo só uma pessoa, preencha só "comprador" e deixe os demais com campos vazios.
Responda APENAS com o JSON, sem texto ao redor.`

const SAFETY = [
  'HARM_CATEGORY_HARASSMENT',
  'HARM_CATEGORY_HATE_SPEECH',
  'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  'HARM_CATEGORY_DANGEROUS_CONTENT',
].map((category) => ({ category, threshold: 'BLOCK_NONE' }))

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function iaConfigurada(): boolean {
  return !!process.env.GEMINI_API_KEY
}

async function subirArquivo(apiKey: string, a: ArquivoEntrada): Promise<{ uri: string; name: string }> {
  const start = await fetch(`${UPLOAD_BASE}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(a.bytes.length),
      'X-Goog-Upload-Header-Content-Type': a.mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: a.nome || 'documento' } }),
  })
  if (!start.ok) throw new Error(`Gemini upload/start HTTP ${start.status}`)
  const uploadUrl = start.headers.get('x-goog-upload-url')
  if (!uploadUrl) throw new Error('Gemini upload: sem URL de upload.')

  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: { 'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize' },
    body: a.bytes as any,
  })
  if (!up.ok) throw new Error(`Gemini upload HTTP ${up.status}`)
  let file = (await up.json())?.file
  if (!file?.uri) throw new Error('Gemini upload: sem uri.')

  let tries = 0
  while (file.state === 'PROCESSING' && tries < 25) {
    await sleep(800)
    const g = await fetch(`${API_BASE}/${file.name}?key=${apiKey}`)
    file = await g.json()
    tries++
  }
  if (file.state !== 'ACTIVE') throw new Error(`Gemini: arquivo não ficou pronto (${file.state}).`)
  return { uri: file.uri, name: file.name }
}

async function deletarArquivo(apiKey: string, name: string) {
  try {
    await fetch(`${API_BASE}/${name}?key=${apiKey}`, { method: 'DELETE' })
  } catch {}
}

export async function extrairDadosDeDocumentos(arquivos: ArquivoEntrada[]): Promise<DadosExtraidos> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada.')
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const subidos: { uri: string; name: string; mimeType: string }[] = []
  try {
    for (const a of arquivos) {
      const f = await subirArquivo(apiKey, a)
      subidos.push({ ...f, mimeType: a.mimeType })
    }

    const parts: any[] = [{ text: PROMPT }]
    for (const s of subidos) parts.push({ file_data: { mime_type: s.mimeType, file_uri: s.uri } })

    const response = await fetch(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
        safetySettings: SAFETY,
      }),
    })
    if (!response.ok) {
      const body = await response.text().catch(() => '')
      throw new Error(`Gemini HTTP ${response.status}: ${body.slice(0, 200)}`)
    }

    const data = await response.json()
    const cand = data?.candidates?.[0]
    const text: string | undefined = cand?.content?.parts?.map((p: any) => p?.text).filter(Boolean).join('')
    if (!text) {
      const motivo = cand?.finishReason || data?.promptFeedback?.blockReason || 'resposta vazia'
      throw new Error(`Gemini não retornou texto (${motivo}).`)
    }

    const limpo = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
    let parsed: DadosExtraidos
    try {
      parsed = JSON.parse(limpo) as DadosExtraidos
    } catch {
      throw new Error(`Resposta não é JSON válido: ${limpo.slice(0, 120)}`)
    }
    return {
      comprador: parsed.comprador ?? {},
      conjuge: parsed.conjuge ?? {},
      comprador2: parsed.comprador2 ?? {},
    }
  } finally {
    for (const s of subidos) await deletarArquivo(apiKey, s.name)
  }
}

// DD/MM/AAAA -> YYYY-MM-DD (para inputs type=date da proposta).
function isoDate(v?: string): string {
  const s = (v ?? '').toString().trim()
  let m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  if (m) return `${m[3]}-${m[2]}-${m[1]}`
  m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) return s
  return ''
}

const ESTADOS = ['solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel']

// Converte o resultado da IA nos nomes de campo do formulário da PROPOSTA.
export function camposProposta(d: DadosExtraidos): Record<string, string> {
  const out: Record<string, string> = {}
  const set = (k: string, v: unknown) => {
    const s = (v ?? '').toString().trim()
    if (s) out[k] = s
  }
  const rg = (p?: PessoaExtraida) => [p?.rg, p?.orgao_rg].map((x) => (x ?? '').toString().trim()).filter(Boolean).join(' ')
  const ec = (v?: string) => {
    const s = (v ?? '').toString().toLowerCase().trim()
    return ESTADOS.includes(s) ? s : ''
  }

  const cp = d.comprador ?? {}
  set('comprador1_nome', cp.nome)
  set('comprador1_cpf', cp.cpf)
  set('comprador1_rg', rg(cp))
  set('comprador1_profissao', cp.profissao)
  set('comprador1_email', cp.email)
  set('comprador1_telefone', cp.telefone)
  set('comprador1_nascimento', isoDate(cp.data_nascimento))
  set('comprador1_estado_civil', ec(cp.estado_civil))

  const cj = d.conjuge ?? {}
  set('conjuge_nome', cj.nome)
  set('conjuge_cpf', cj.cpf)
  set('conjuge_rg', rg(cj))
  set('conjuge_profissao', cj.profissao)
  set('conjuge_email', cj.email)
  set('conjuge_telefone', cj.telefone)
  set('conjuge_nascimento', isoDate(cj.data_nascimento))

  const c2 = d.comprador2 ?? {}
  set('comprador2_nome', c2.nome)
  set('comprador2_cpf', c2.cpf)
  set('comprador2_rg', rg(c2))
  set('comprador2_profissao', c2.profissao)
  set('comprador2_email', c2.email)
  set('comprador2_telefone', c2.telefone)
  set('comprador2_nascimento', isoDate(c2.data_nascimento))
  set('comprador2_estado_civil', ec(c2.estado_civil))

  return out
}
