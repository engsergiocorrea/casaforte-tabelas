import { NextResponse } from 'next/server'
import { requireTabelasInternalKey } from '@/lib/internal-api/auth'
import { createServiceClient } from '@/lib/internal-api/db'

// GET /api/internal/propostas
// Autenticado por TABELAS_INTERNAL_API_KEY (server-to-server). Lista propostas
// para o módulo Contratos. Por padrão retorna apenas as APROVADAS (relevantes
// para gerar contrato). Filtros: ?status=, ?empreendimento_id=, ?unidade_id=,
// ?limit=. Somente leitura — não expõe observações internas.
export async function GET(request: Request) {
  const auth = requireTabelasInternalKey(request)
  if (!auth.ok) return auth.response

  const { searchParams } = new URL(request.url)

  // Diagnóstico temporário: ?_role=1 informa o TIPO da SUPABASE_SERVICE_ROLE_KEY
  // (sem expor o valor) para confirmar se está como service_role do projeto certo.
  if (searchParams.get('_role') === '1') {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    let info = 'AUSENTE'
    if (key.startsWith('eyJ')) {
      try {
        const j = JSON.parse(Buffer.from(key.split('.')[1], 'base64').toString('utf-8'))
        info = `JWT legacy: role=${j.role}, ref=${j.ref}`
      } catch { info = 'JWT indecifrável' }
    } else if (key.startsWith('sb_secret_')) info = 'sb_secret (service role nova) — OK'
    else if (key.startsWith('sb_publishable_')) info = 'sb_publishable (ANON nova) — ERRADA'
    else if (key) info = `desconhecido (prefixo ${key.slice(0, 6)}…)`
    const urlRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').match(/https:\/\/([a-z0-9]+)\.supabase/)?.[1] ?? null
    const sb = createServiceClient()
    const testar = async (t: string) => {
      const { error } = await sb.from(t).select('id').limit(1)
      return error ? error.message : 'ok'
    }
    return NextResponse.json({
      service_role_tipo: info,
      url_ref: urlRef,
      leitura: {
        propostas: await testar('propostas'),
        unidades: await testar('unidades'),
        empreendimentos: await testar('empreendimentos'),
      },
    })
  }

  const status = searchParams.get('status')
  const empreendimentoId = searchParams.get('empreendimento_id')
  const unidadeId = searchParams.get('unidade_id')
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? 100) || 100, 1), 500)

  const supabase = createServiceClient()
  let query = supabase
    .from('propostas')
    .select(
      'id, status_proposta, status, empreendimento_id, unidade_id, ' +
        'comprador1_nome, comprador1_cpf, valor_proposto, created_at, updated_at, ' +
        'empreendimentos(nome), unidades(unidade)'
    )
    .order('created_at', { ascending: false })
    .limit(limit)

  // Padrão: apenas aprovadas. ?status= permite sobrescrever.
  query = status ? query.eq('status_proposta', status) : query.eq('status_proposta', 'aprovada')
  if (empreendimentoId) query = query.eq('empreendimento_id', empreendimentoId)
  if (unidadeId) query = query.eq('unidade_id', unidadeId)

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: 'Falha ao consultar propostas.', detalhe: error.message, code: (error as any).code ?? null }, { status: 500 })
  }

  const propostas = (data ?? []).map((p: any) => ({
    id: p.id,
    status_proposta: p.status_proposta,
    status: p.status,
    empreendimento_id: p.empreendimento_id,
    empreendimento_nome: p.empreendimentos?.nome ?? null,
    unidade_id: p.unidade_id,
    unidade_codigo: p.unidades?.unidade ?? null,
    comprador_nome: p.comprador1_nome ?? null,
    comprador_documento: p.comprador1_cpf ?? null,
    valor_proposto: p.valor_proposto ?? null,
    created_at: p.created_at,
    updated_at: p.updated_at,
  }))

  return NextResponse.json({ propostas })
}
