import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: empreendimento } = await supabase
    .from('empreendimentos')
    .select('*')
    .eq('slug', slug)
    .eq('ativo_publico', true)
    .single()

  if (!empreendimento) return new NextResponse('Não encontrado', { status: 404 })

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento')
    .order('unidade')

  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'

  const unidadesFiltradas = (unidades ?? []).filter(u => u.status !== 'bloqueada' && u.status !== 'indisponivel')

  const statusLabel: Record<string, string> = { disponivel: 'Disponível', reservada: 'Reservada', vendida: 'Vendida' }
  const statusColor: Record<string, string> = { disponivel: '#15803d', reservada: '#b45309', vendida: '#b91c1c' }
  const statusBg: Record<string, string> = { disponivel: '#dcfce7', reservada: '#fef3c7', vendida: '#fee2e2' }

  const rows = unidadesFiltradas.map(u => `
    <tr style="background:${u.status === 'reservada' ? '#fffbeb' : u.status === 'vendida' ? '#fef2f2' : 'white'}">
      <td>${u.unidade}</td>
      <td>${u.pavimento ?? '—'}</td>
      <td style="text-align:right">${u.area_construida ? u.area_construida + 'm²' : '—'}</td>
      <td style="text-align:center">${u.quartos ?? '—'}</td>
      <td style="text-transform:capitalize">${u.posicao?.replace('_', ' ') ?? '—'}</td>
      <td style="text-align:right;font-weight:600">${u.valor_imovel ? fmt(u.valor_imovel) : '—'}</td>
      <td style="text-align:right">${u.valor_sinal ? fmt(u.valor_sinal) : '—'}</td>
      <td style="text-align:right">${u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x ${fmt(u.valor_parcela)}` : '—'}</td>
      <td style="text-align:right">${u.quantidade_intercaladas && u.valor_intercalada ? `${u.quantidade_intercaladas}x ${fmt(u.valor_intercalada)}` : '—'}</td>
      <td style="text-align:right">${u.valor_chaves ? fmt(u.valor_chaves) : '—'}</td>
      <td style="text-align:center">
        <span style="display:inline-block;padding:1px 6px;border-radius:20px;font-size:10px;font-weight:600;background:${statusBg[u.status] ?? '#f3f4f6'};color:${statusColor[u.status] ?? '#6b7280'}">
          ${statusLabel[u.status] ?? u.status}
        </span>
      </td>
    </tr>
  `).join('')

  const disponiveis = unidadesFiltradas.filter(u => u.status === 'disponivel').length
  const reservadas = unidadesFiltradas.filter(u => u.status === 'reservada').length
  const vendidas = unidadesFiltradas.filter(u => u.status === 'vendida').length

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Tabela de Vendas — ${empreendimento.nome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: white; color: #111; font-size: 11px; }

    @page { size: A4 landscape; margin: 8mm 10mm; }

    @media print {
      body { background: white; font-size: 10px; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
    }

    .header { background: #1E1E1E; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
    .resumo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
    .resumo-item { background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 8px; text-align: center; }
    .condicoes { background: white; border-radius: 8px; border: 1px solid #e5e7eb; padding: 10px 14px; margin-bottom: 12px; display: flex; gap: 24px; flex-wrap: wrap; }

    table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
    thead tr { background: #f9fafb; border-bottom: 2px solid #e5e7eb; }
    th { padding: 6px 8px; text-align: left; font-size: 9px; font-weight: 600; color: #6b7280; text-transform: uppercase; white-space: nowrap; }
    td { padding: 5px 8px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
    .table-wrapper { background: white; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden; }

    .footer { margin-top: 12px; text-align: center; font-size: 9px; color: #9ca3af; }
  </style>
</head>
<body>

  <div class="header">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" style="height:32px;filter:brightness(0) invert(1)" alt="Casa Forte" />
      <div>
        <div style="color:white;font-size:15px;font-weight:700">${empreendimento.nome}</div>
        <div style="color:rgba(255,255,255,0.5);font-size:11px">${empreendimento.cidade}, ${empreendimento.estado}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,0.5);font-size:10px">Tabela de Vendas</div>
      <div style="color:white;font-size:11px">${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
  </div>

  <div class="resumo">
    <div class="resumo-item">
      <div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Total</div>
      <div style="font-size:20px;font-weight:700">${unidadesFiltradas.length}</div>
    </div>
    <div class="resumo-item" style="background:#f0fdf4;border-color:#bbf7d0">
      <div style="font-size:10px;color:#15803d;margin-bottom:2px">Disponíveis</div>
      <div style="font-size:20px;font-weight:700;color:#15803d">${disponiveis}</div>
    </div>
    <div class="resumo-item" style="background:#fffbeb;border-color:#fde68a">
      <div style="font-size:10px;color:#b45309;margin-bottom:2px">Reservadas</div>
      <div style="font-size:20px;font-weight:700;color:#b45309">${reservadas}</div>
    </div>
    <div class="resumo-item" style="background:#fef2f2;border-color:#fecaca">
      <div style="font-size:10px;color:#b91c1c;margin-bottom:2px">Vendidas</div>
      <div style="font-size:20px;font-weight:700;color:#b91c1c">${vendidas}</div>
    </div>
  </div>

  <div class="condicoes">
    <div><span style="font-size:9px;color:#9ca3af">Correção até entrega</span><br><strong>${empreendimento.indice_ate_entrega ?? '—'}</strong></div>
    <div><span style="font-size:9px;color:#9ca3af">Correção após entrega</span><br><strong>${empreendimento.indice_apos_entrega ?? '—'}</strong></div>
    <div><span style="font-size:9px;color:#9ca3af">Parcelamento</span><br><strong>Até ${empreendimento.parcelas_padrao ?? 60}x mensais</strong></div>
    ${empreendimento.data_prevista_entrega ? `<div><span style="font-size:9px;color:#9ca3af">Previsão de entrega</span><br><strong>${new Date(empreendimento.data_prevista_entrega).toLocaleDateString('pt-BR')}</strong></div>` : ''}
  </div>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Unidade</th>
          <th>Pavimento</th>
          <th style="text-align:right">Área</th>
          <th style="text-align:center">Qtos</th>
          <th>Posição</th>
          <th style="text-align:right">Valor Total</th>
          <th style="text-align:right">Entrada</th>
          <th style="text-align:right">Parcelas</th>
          <th style="text-align:right">Intercaladas</th>
          <th style="text-align:right">Chaves</th>
          <th style="text-align:center">Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  ${empreendimento.observacoes_publicas ? `
  <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:10px 14px;margin-top:12px;font-size:11px;color:#92400e">
    <strong>Observações:</strong> ${empreendimento.observacoes_publicas}
  </div>` : ''}

  <div class="footer">
    © ${new Date().getFullYear()} Casa Forte Construtora e Incorporadora. Os valores são de referência e podem sofrer alteração sem aviso prévio.
  </div>

  <script>
    window.onload = function() {
      window.print()
    }
  </script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
