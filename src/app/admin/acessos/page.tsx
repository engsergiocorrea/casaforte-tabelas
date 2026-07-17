import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const TZ = 'America/Sao_Paulo'

function hojeSaoPaulo(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ }) // YYYY-MM-DD
}
function proximoDia(dia: string): string {
  const [y, m, d] = dia.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return dt.toISOString().slice(0, 10)
}
function ehData(s?: string): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s)
}

interface Acesso {
  id: string
  corretor_nome: string
  creci: string | null
  ip: string | null
  created_at: string
}

export default async function AcessosPage({
  searchParams,
}: {
  searchParams: Promise<{ dia?: string; corretor?: string }>
}) {
  const sp = await searchParams
  const dia = ehData(sp.dia) ? sp.dia : hojeSaoPaulo()
  const corretorFiltro = (sp.corretor ?? '').trim()

  const supabase = await createClient()
  let query = supabase
    .from('tabelas_acessos')
    .select('id, corretor_nome, creci, ip, created_at')
    .gte('created_at', `${dia}T00:00:00-03:00`)
    .lt('created_at', `${proximoDia(dia)}T00:00:00-03:00`)
    .order('created_at', { ascending: false })

  if (corretorFiltro) {
    query = query.ilike('corretor_nome', `%${corretorFiltro}%`)
  }

  const { data, error } = await query
  const acessos = (data ?? []) as Acesso[]

  // Resumo por corretor (nome + creci).
  const porCorretor = new Map<string, { nome: string; creci: string | null; total: number }>()
  for (const a of acessos) {
    const chave = `${a.corretor_nome.toLowerCase()}|${(a.creci ?? '').toLowerCase()}`
    const atual = porCorretor.get(chave)
    if (atual) atual.total++
    else porCorretor.set(chave, { nome: a.corretor_nome, creci: a.creci, total: 1 })
  }
  const resumo = [...porCorretor.values()].sort((x, y) => y.total - x.total)

  const tabelaMissing = error && /tabelas_acessos/.test(error.message)

  const fmtHora = (iso: string) =>
    new Date(iso).toLocaleString('pt-BR', {
      timeZone: TZ,
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })

  const card: React.CSSProperties = { background: 'white', borderRadius: 12, border: '1px solid #DDD9D3', padding: 20, marginBottom: 16 }
  const th: React.CSSProperties = { padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase' }
  const td: React.CSSProperties = { padding: '10px 14px', fontSize: 13, color: '#111', borderBottom: '1px solid #f3f4f6' }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111' }}>Acessos ao site de tabelas</h1>
        <p style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
          Corretores que acessaram as tabelas públicas, por dia.
        </p>
      </div>

      {/* Filtros */}
      <form method="get" style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Dia</label>
          <input type="date" name="dia" defaultValue={dia}
            style={{ padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: 8, fontSize: 14, outline: 'none' }} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Corretor</label>
          <input type="text" name="corretor" defaultValue={corretorFiltro} placeholder="Nome do corretor/imobiliária"
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ padding: '9px 20px', background: '#E8390E', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          Filtrar
        </button>
        {(corretorFiltro || dia !== hojeSaoPaulo()) && (
          <Link href="/admin/acessos" style={{ padding: '9px 14px', fontSize: 13, color: '#6b7280', textDecoration: 'none' }}>Limpar</Link>
        )}
      </form>

      {tabelaMissing ? (
        <div style={{ ...card, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 14 }}>
          A tabela de acessos ainda não existe no banco. Rode a migração <code>sql/04_tabelas_acessos.sql</code> no SQL Editor do Supabase.
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase' }}>Acessos no dia</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#E8390E' }}>{acessos.length}</div>
            </div>
            <div style={{ ...card, flex: 1, minWidth: 180, marginBottom: 0 }}>
              <div style={{ fontSize: 12, color: '#9ca3af', textTransform: 'uppercase' }}>Corretores distintos</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111' }}>{resumo.length}</div>
            </div>
          </div>

          {/* Por corretor */}
          {resumo.length > 0 && (
            <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#111', borderBottom: '1px solid #f3f4f6' }}>Por corretor</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f9fafb' }}>
                  <th style={th}>Corretor</th><th style={th}>CRECI</th><th style={{ ...th, textAlign: 'right' }}>Acessos</th>
                </tr></thead>
                <tbody>
                  {resumo.map((r, i) => (
                    <tr key={i}>
                      <td style={td}>{r.nome}</td>
                      <td style={{ ...td, color: '#6b7280' }}>{r.creci || '—'}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: 600 }}>{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Detalhe (com IP) */}
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', fontSize: 14, fontWeight: 700, color: '#111', borderBottom: '1px solid #f3f4f6' }}>Detalhe dos acessos</div>
            {acessos.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhum acesso registrado neste dia.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
                  <thead><tr style={{ background: '#f9fafb' }}>
                    <th style={th}>Data/Hora</th><th style={th}>Corretor</th><th style={th}>CRECI</th><th style={th}>IP</th>
                  </tr></thead>
                  <tbody>
                    {acessos.map((a) => (
                      <tr key={a.id}>
                        <td style={{ ...td, color: '#6b7280', whiteSpace: 'nowrap' }}>{fmtHora(a.created_at)}</td>
                        <td style={{ ...td, fontWeight: 500 }}>{a.corretor_nome}</td>
                        <td style={{ ...td, color: '#6b7280' }}>{a.creci || '—'}</td>
                        <td style={{ ...td, color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{a.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
