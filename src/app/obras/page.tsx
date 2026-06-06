'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { RELATORIO_STATUS_LABELS, RELATORIO_STATUS_COLORS } from '@/types'

export default function ObrasRDODetalhePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [rdo, setRdo] = useState<any>(null)
  const [perfil, setPerfil] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.push('/obras/login'); return }
      const { data: eng } = await supabase.from('engenheiros').select('*').eq('usuario_id', session.user.id).single()
      const { data: cli } = await supabase.from('clientes').select('*').eq('usuario_id', session.user.id).single()
      setPerfil(eng ? { ...eng, tipo: 'engenheiro' } : cli ? { ...cli, tipo: 'cliente' } : null)
      const { data } = await supabase
        .from('relatorios')
        .select('*, obras(nome, endereco, cidade, estado, contratante_nome), engenheiros(nome, cargo, registro_profissional, tipo_registro, uf_registro), relatorio_mao_obra(*), relatorio_atividades(*), relatorio_imagens(*)')
        .eq('id', id)
        .single()
      setRdo(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Carregando...</div>
  if (!rdo) return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>RDO não encontrado.</div>

  const sc = RELATORIO_STATUS_COLORS[rdo.status as keyof typeof RELATORIO_STATUS_COLORS]

  const campo = (label: string, valor: any) => valor ? (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase' as const, marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '14px', color: '#111', fontWeight: '500' }}>{valor}</div>
    </div>
  ) : null

  const climaLabel: Record<string, string> = {
    sol: '☀️ Sol', nublado: '⛅ Nublado',
    chuva_fraca: '🌦️ Chuva fraca', chuva_forte: '⛈️ Chuva forte', vento: '💨 Vento',
  }

  const atividadeStatusLabel: Record<string, string> = {
    nao_iniciada: 'Não iniciada', em_andamento: 'Em andamento',
    concluida: 'Concluída', paralisada: 'Paralisada',
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <Link href="/obras" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'none' }}>← Voltar</Link>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111', marginTop: '4px' }}>RDO #{rdo.numero ?? '—'}</h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            {rdo.data_relatorio ? new Date(rdo.data_relatorio).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', background: sc?.bg, color: sc?.color }}>
            {RELATORIO_STATUS_LABELS[rdo.status as keyof typeof RELATORIO_STATUS_LABELS]}
          </span>
          {perfil?.tipo === 'engenheiro' && (rdo.status === 'rascunho' || rdo.status === 'recusado') && (
            <Link href={'/obras/rdos/' + id + '/editar'}
              style={{ padding: '6px 14px', background: '#f3f4f6', border: '1px solid #e5e7eb', color: '#374151', borderRadius: '8px', textDecoration: 'none', fontSize: '13px' }}>
              ✏️ Editar
            </Link>
          )}
        </div>
      </div>

      {rdo.status === 'recusado' && rdo.motivo_recusa && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px', marginBottom: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: '600', color: '#b91c1c', marginBottom: '4px' }}>MOTIVO DA RECUSA</div>
          <p style={{ fontSize: '14px', color: '#374151' }}>{rdo.motivo_recusa}</p>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Obra</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {campo('Nome', rdo.obras?.nome)}
          {campo('Local', [rdo.obras?.endereco, rdo.obras?.cidade, rdo.obras?.estado].filter(Boolean).join(', '))}
          {campo('Contratante', rdo.obras?.contratante_nome)}
          {campo('Engenheiro', rdo.engenheiros?.nome)}
        </div>
      </div>

      {(rdo.prazo_contratual_dias || rdo.prazo_decorrido_dias || rdo.prazo_a_vencer_dias) && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Prazos</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {campo('Prazo contratual', rdo.prazo_contratual_dias ? rdo.prazo_contratual_dias + ' dias' : null)}
            {campo('Prazo decorrido', rdo.prazo_decorrido_dias ? rdo.prazo_decorrido_dias + ' dias' : null)}
            {campo('Prazo a vencer', rdo.prazo_a_vencer_dias !== null ? rdo.prazo_a_vencer_dias + ' dias' : null)}
          </div>
        </div>
      )}

      {(rdo.clima_manha || rdo.clima_tarde) && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Condição climática</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {campo('Manhã', rdo.clima_manha ? climaLabel[rdo.clima_manha] : null)}
            {campo('Tarde', rdo.clima_tarde ? climaLabel[rdo.clima_tarde] : null)}
            {campo('Observações', rdo.observacoes_clima)}
          </div>
        </div>
      )}

      {rdo.relatorio_mao_obra?.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Mão de obra</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const }}>Função</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const }}>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              {rdo.relatorio_mao_obra.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', color: '#111' }}>{m.funcao}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '600' }}>{m.quantidade}</td>
                </tr>
              ))}
              <tr style={{ background: '#f9fafb' }}>
                <td style={{ padding: '8px 12px', fontWeight: '600' }}>Total</td>
                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#E8390E' }}>
                  {rdo.relatorio_mao_obra.reduce((a: number, m: any) => a + m.quantidade, 0)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {rdo.relatorio_atividades?.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Atividades</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Descrição', '%', 'Status'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' as const }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rdo.relatorio_atividades.map((a: any) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '8px 12px', color: '#111' }}>{a.descricao}</td>
                  <td style={{ padding: '8px 12px', color: '#6b7280' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: '#f3f4f6', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#E8390E', width: Math.min(a.percentual ?? 0, 100) + '%' }} />
                      </div>
                      <span>{a.percentual ?? 0}%</span>
                    </div>
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: '600',
                      background: a.status === 'concluida' ? '#dcfce7' : a.status === 'em_andamento' ? '#dbeafe' : a.status === 'paralisada' ? '#fee2e2' : '#f3f4f6',
                      color: a.status === 'concluida' ? '#15803d' : a.status === 'em_andamento' ? '#1d4ed8' : a.status === 'paralisada' ? '#b91c1c' : '#6b7280',
                    }}>
                      {atividadeStatusLabel[a.status] ?? a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rdo.comentarios && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Comentários</h2>
          <p style={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap' as const }}>{rdo.comentarios}</p>
        </div>
      )}

      {rdo.relatorio_imagens?.length > 0 && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #DDD9D3', padding: '24px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>Fotos ({rdo.relatorio_imagens.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {rdo.relatorio_imagens.map((img: any) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                <img src={img.url} alt="" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      {rdo.status === 'aprovado' && (
        <div style={{ marginTop: '8px' }}>
          <Link href={'/api/rdos/' + id + '/pdf'}
            style={{ padding: '10px 20px', background: '#E8390E', color: 'white', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            📄 Baixar PDF
          </Link>
        </div>
      )}
    </div>
  )
}
