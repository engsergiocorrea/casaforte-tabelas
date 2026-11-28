// Central de WhatsApp da Casa Forte (no braIAn). Enquanto o canal for
// "evolution", cada sistema continua enviando como antes; quando a diretoria
// troca para "meta" no Portal (/whatsapp), todos passam a enviar pela central,
// que usa o número oficial na Meta (texto dentro de 24h, modelo aprovado fora).
// Autenticação: a chave de serviço do banco central (SUPABASE_SERVICE_ROLE_KEY).

const BASE = () => (process.env.CENTRAL_WHATSAPP_URL || 'https://casaforte-ia-production.up.railway.app').trim().replace(/\/$/, '')
const CHAVE = () => (process.env.CENTRAL_WHATSAPP_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

let cache: { ate: number; canal: 'evolution' | 'meta' } | null = null

export async function canalWhatsApp(): Promise<'evolution' | 'meta'> {
  if (cache && cache.ate > Date.now()) return cache.canal
  let canal: 'evolution' | 'meta' = 'evolution'
  try {
    const r = await fetch(`${BASE()}/central/config`, { headers: { Authorization: `Bearer ${CHAVE()}` }, cache: 'no-store', signal: AbortSignal.timeout(5000) })
    if (r.ok) canal = ((await r.json()) as { canal?: string }).canal === 'meta' ? 'meta' : 'evolution'
  } catch { /* central fora do ar: mantém Evolution */ }
  cache = { ate: Date.now() + 30_000, canal }
  return canal
}

export type EnvioCentral = {
  para: string
  texto?: string
  documento?: { base64?: string; url?: string; nome: string; mime?: string }
  modelo?: { nome: string; campos: Record<string, string> | string[] }
  codigo?: string
  origem: string
  nome?: string
}

export async function enviarPelaCentral(p: EnvioCentral): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const r = await fetch(`${BASE()}/central/enviar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${CHAVE()}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
      cache: 'no-store',
      signal: AbortSignal.timeout(90_000),
    })
    const j = (await r.json().catch(() => ({}))) as { ok?: boolean; erro?: string }
    return j.ok ? { ok: true } : { ok: false, erro: j.erro ?? `central ${r.status}` }
  } catch (e) {
    return { ok: false, erro: `central indisponível: ${(e as Error).message}` }
  }
}
