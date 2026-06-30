import { NextResponse } from 'next/server'

// Autenticação server-to-server dos endpoints internos do Tabelas
// (/api/internal/*), consumidos pelo futuro módulo Contratos. Valida
// `Authorization: Bearer <TABELAS_INTERNAL_API_KEY>`. Nunca loga a chave.

export type InternalAuthResult = { ok: true } | { ok: false; response: NextResponse }

export function requireTabelasInternalKey(request: Request): InternalAuthResult {
  const configured = process.env.TABELAS_INTERNAL_API_KEY
  if (!configured) {
    return { ok: false, response: NextResponse.json({ error: 'TABELAS_INTERNAL_API_KEY ausente' }, { status: 500 }) }
  }

  const header = request.headers.get('authorization') ?? request.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  }

  const provided = header.slice('Bearer '.length).trim()
  if (!provided || provided !== configured) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado.' }, { status: 401 }) }
  }

  return { ok: true }
}
