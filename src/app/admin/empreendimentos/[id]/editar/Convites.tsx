'use client'
import { useCallback, useEffect, useState } from 'react'

// Links de convite para corretores (tabelas "Só diretoria"): cada link libera
// esta tabela só para quem o recebe. Pode expirar e ser revogado.
type Convite = { id: string; rotulo: string | null; criado_em: string; expira_em: string | null; revogado_em: string | null; acessos: number; ultimo_acesso: string | null; link: string }
const data = (s: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—')

export default function Convites({ empreendimentoId }: { empreendimentoId: string }) {
  const [lista, setLista] = useState<Convite[] | null>(null)
  const [rotulo, setRotulo] = useState('')
  const [dias, setDias] = useState('30')
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState('')
  const carregar = useCallback(() => {
    fetch(`/api/admin/convites?empreendimento_id=${empreendimentoId}`).then(async (r) => (r.ok ? setLista(await r.json()) : setErro((await r.json()).erro ?? 'Erro')))
  }, [empreendimentoId])
  useEffect(() => { carregar() }, [carregar])

  async function gerar() {
    setErro('')
    const r = await fetch('/api/admin/convites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ empreendimento_id: empreendimentoId, rotulo, dias }) })
    const j = await r.json()
    if (!r.ok) return setErro(j.erro ?? 'Erro ao gerar')
    setRotulo(''); carregar(); copiar(j.link)
  }
  async function revogar(id: string) {
    if (!confirm('Revogar este link? Quem o recebeu deixa de ver a tabela.')) return
    await fetch(`/api/admin/convites?id=${id}`, { method: 'DELETE' }); carregar()
  }
  function copiar(link: string) { navigator.clipboard?.writeText(link).catch(() => null); setCopiado(link); setTimeout(() => setCopiado(''), 2500) }

  const inp: React.CSSProperties = { padding: '8px 12px', border: '1px solid #DDD9D3', borderRadius: '8px', fontSize: '14px' }
  return (
    <div style={{ gridColumn: '1/-1', marginTop: '8px', padding: '14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#fafafa' }}>
      <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>🔑 Links de convite para corretores</div>
      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>Cada link libera esta tabela (unidades, PDF e proposta) só para quem o recebe. O corretor ainda se identifica com nome e CRECI.</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
        <input value={rotulo} onChange={(e) => setRotulo(e.target.value)} placeholder="Para quem? (ex.: João — Imobiliária X)" style={{ ...inp, flex: '1 1 240px' }} />
        <select value={dias} onChange={(e) => setDias(e.target.value)} style={inp}>
          <option value="7">Vale 7 dias</option><option value="30">Vale 30 dias</option><option value="90">Vale 90 dias</option><option value="">Sem validade</option>
        </select>
        <button type="button" onClick={gerar} style={{ ...inp, background: '#E8390E', color: 'white', border: 0, fontWeight: 600, cursor: 'pointer' }}>Gerar link</button>
      </div>
      {erro && <p style={{ color: '#b91c1c', fontSize: '13px' }}>{erro}</p>}
      {copiado && <p style={{ color: '#15803d', fontSize: '13px' }}>Link copiado: {copiado}</p>}
      {lista && lista.length === 0 && <p style={{ fontSize: '13px', color: '#9ca3af' }}>Nenhum link gerado ainda.</p>}
      {lista && lista.length > 0 && (
        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
          <thead><tr style={{ textAlign: 'left', color: '#6b7280' }}><th>Para</th><th>Criado</th><th>Validade</th><th>Acessos</th><th></th></tr></thead>
          <tbody>
            {lista.map((c) => {
              const ativo = !c.revogado_em && (!c.expira_em || new Date(c.expira_em) > new Date())
              return (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb', opacity: ativo ? 1 : 0.5 }}>
                  <td style={{ padding: '6px 0' }}>{c.rotulo ?? '—'}</td>
                  <td>{data(c.criado_em)}</td>
                  <td>{c.revogado_em ? 'Revogado' : c.expira_em ? (ativo ? `até ${data(c.expira_em)}` : 'Expirado') : 'Sem validade'}</td>
                  <td>{c.acessos}{c.ultimo_acesso ? ` (último ${data(c.ultimo_acesso)})` : ''}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {ativo && <button type="button" onClick={() => copiar(c.link)} style={{ marginRight: '8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '3px 8px', background: 'white', cursor: 'pointer' }}>Copiar link</button>}
                    {ativo && <button type="button" onClick={() => revogar(c.id)} style={{ fontSize: '12px', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', padding: '3px 8px', background: 'white', cursor: 'pointer' }}>Revogar</button>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
