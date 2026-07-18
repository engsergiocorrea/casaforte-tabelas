// Identificação do corretor/imobiliária que acessa as tabelas públicas.
// Guardada num cookie (não sensível) para: (1) liberar a visualização dos
// empreendimentos, (2) pré-preencher a proposta e (3) registrar o acesso.
// Funções puras — usáveis no servidor (cookies()), no middleware (edge) e no
// cliente (document.cookie).

export const CORRETOR_COOKIE = 'cf_corretor'
export const CORRETOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 180 // 180 dias

// Versão da identificação. Para forçar TODOS os corretores a se identificarem
// de novo (ex.: limpar identificações antigas em cache), basta incrementar
// este número e publicar: os cookies com versão diferente passam a valer como
// "não identificado" e o gate reaparece.
export const CORRETOR_VERSION = 2

export interface CorretorInfo {
  nome: string
  creci: string
}

export function encodeCorretor(info: CorretorInfo): string {
  return encodeURIComponent(
    JSON.stringify({ v: CORRETOR_VERSION, n: info.nome, c: info.creci })
  )
}

export function decodeCorretor(raw: string | undefined | null): CorretorInfo | null {
  if (!raw) return null
  try {
    const obj = JSON.parse(decodeURIComponent(raw))
    // Cookie de versão antiga (ou sem versão) → tratar como não identificado.
    if (Number(obj?.v) !== CORRETOR_VERSION) return null
    const nome = String(obj?.n ?? obj?.nome ?? '').trim()
    const creci = String(obj?.c ?? obj?.creci ?? '').trim()
    if (!nome) return null
    return { nome, creci }
  } catch {
    return null
  }
}

// Lê o cookie do corretor no navegador (client components).
export function lerCorretorDoNavegador(): CorretorInfo | null {
  if (typeof document === 'undefined') return null
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(CORRETOR_COOKIE + '='))
    ?.split('=')
    .slice(1)
    .join('=')
  return decodeCorretor(raw)
}
