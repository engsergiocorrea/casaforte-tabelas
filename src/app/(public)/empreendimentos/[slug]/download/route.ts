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

  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '—'

  const unidadesFiltradas = (unidades ?? []).filter(u => u.status !== 'bloqueada' && u.status !== 'indisponivel')

  const statusLabel: Record<string, string> = {
    disponivel: 'Disponível',
    reservada: 'Reservada',
    vendida: 'Vendida',
  }

  const statusColor: Record<string, string> = {
    disponivel: '#15803d',
    reservada: '#b45309',
    vendida: '#b91c1c',
  }

  const statusBg: Record<string, string> = {
    disponivel: '#dcfce7',
    reservada: '#fef3c7',
    vendida: '#fee2e2',
  }

  const rows = unidadesFiltradas.map(u => `
    <tr style="background:${u.status === 'reservada' ? '#fffbeb' : u.status === 'vendida' ? '#fef2f2' : 'white'}; opacity:${u.status === 'vendida' ? '0.8' : '1'}">
      <td style="padding:8px 10px;font-weight:600;border-bottom:1px solid #f3f4f6">${u.unidade}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6">${u.pavimento ?? '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:right">${u.area_construida ? u.area_construida + 'm²' : '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:center">${u.quartos ?? '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-transform:capitalize">${u.posicao?.replace('_',' ') ?? '—'}</td>
      <td style="padding:8px 10px;font-weight:600;border-bottom:1px solid #f3f4f6;text-align:right">${u.valor_imovel ? fmt(u.valor_imovel) : '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:right">${u.valor_sinal ? fmt(u.valor_sinal) : '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:right">${u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x ${fmt(u.valor_parcela)}` : '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:right">${u.quantidade_intercaladas && u.valor_intercalada ? `${u.quantidade_intercaladas}x ${fmt(u.valor_intercalada)}` : '—'}</td>
      <td style="padding:8px 10px;color:#6b7280;border-bottom:1px solid #f3f4f6;text-align:right">${u.valor_chaves ? fmt(u.valor_chaves) : '—'}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f3f4f6;text-align:center">
        <span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;background:${statusBg[u.status]??'#f3f4f6'};color:${statusColor[u.status]??'#6b7280'}">
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tabela de Vendas — ${empreendimento.nome}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f3f0; color: #111; }
    @media print {
      body { background: white; }
      .no-print { display: none !important; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div style="max-width:1100px;margin:0 auto;padding:24px 16px">

    <!-- Header -->
    <div style="background:#1E1E1E;border-radius:12px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:14px">
        <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png" style="height:40px;filter:brightness(0) invert(1)" alt="Casa Forte" />
        <div>
          <div style="color:white;font-size:18px;font-weight:700">${empreendimento.nome}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px">${empreendimento.cidade}, ${empreendimento.estado}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div style="color:rgba(255,255,255,0.5);font-size:11px">Tabela de Vendas</div>
        <div style="color:white;font-size:12px">${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </div>

    <!-- Resumo -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
      <div style="background:white;border-radius:10px;border:1px solid #e5e7eb;padding:14px;text-align:center">
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Total</div>
        <div style="font-size:24px;font-weight:700">${unidadesFiltradas.length}</div>
      </div>
      <div style="background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;padding:14px;text-align:center">
        <div style="font-size:11px;color:#15803d;margin-bottom:4px">Disponíveis</div>
        <div style="font-size:24px;font-weight:700;color:#15803d">${disponiveis}</div>
      </div>
      <div style="background:#fffbeb;border-radius:10px;border:1px solid #fde68a;padding:14px;text-align:center">
        <div style="font-size:11px;color:#b45309;margin-bottom:4px">Reservadas</div>
        <div style="font-size:24px;font-weight:700;color:#b45309">${reservadas}</div>
      </div>
      <div style="background:#fef2f2;border-radius:10px;border:1px solid #fecaca;padding:14px;text-align:center">
        <div style="font-size:11px;color:#b91c1c;margin-bottom:4px">Vendidas</div>
        <div style="font-size:24px;font-weight:700;color:#b91c1c">${vendidas}</div>
      </div>
    </div>

    <!-- Condições -->
    <div style="background:white;border-radius:10px;border:1px solid #e5e7eb;padding:14px 20px;margin-bottom:20px;display:flex;gap:32px">
      <div><span style="font-size:11px;color:#9ca3af">Correção até entrega</span><br><strong style="font-size:14px">${empreendimento.indice_ate_entrega ?? '—'}</strong></div>
      <div><span style="font-size:11px;color:#9ca3af">Correção após entrega</span><br><strong style="font-size:14px">${empreendimento.indice_apos_entrega?.replace('_mais_','% + ').replace('1_mais_igpm','1% + IGP-M').replace('1_mais_ipca','1% + IPCA') ?? '—'}</strong></div>
      <div><span style="font-size:11px;color:#9ca3af">Parcelamento</span><br><strong style="font-size:14px">Até ${empreendimento.parcelas_padrao ?? 60}x mensais</strong></div>
      ${empreendimento.data_prevista_entrega ? `<div><span style="font-size:11px;color:#9ca3af">Previsão de entrega</span><br><strong style="font-size:14px">${new Date(empreendimento.data_prevista_entrega).toLocaleDateString('pt-BR')}</strong></div>` : ''}
    </div>

    <!-- Botão imprimir -->
    <div class="no-print" style="margin-bottom:16px;text-align:right">
      <button onclick="window.print()" style="padding:8px 20px;background:#E8390E;color:white;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer">🖨️ Imprimir / Salvar PDF</button>
    </div>

    <!-- Tabela -->
    <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:900px">
          <thead>
            <tr style="background:#f9fafb;border-bottom:2px solid #e5e7eb">
              <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Unidade</th>
              <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Pavimento</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Área</th>
              <th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Qtos</th>
              <th style="padding:10px 10px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Posição</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Valor</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Entrada</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Parcelas</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Intercaladas</th>
              <th style="padding:10px 10px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Chaves</th>
              <th style="padding:10px 10px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase">Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>

    <!-- Observações -->
    ${empreendimento.observacoes_publicas ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:14px 20px;margin-top:16px;font-size:13px;color:#92400e">
      <strong>Observações:</strong> ${empreendimento.observacoes_publicas}
    </div>` : ''}

    <!-- Footer -->
    <div style="margin-top:20px;text-align:center;font-size:11px;color:#9ca3af">
      © ${new Date().getFullYear()} Casa Forte Construtora e Incorporadora. Os valores são de referência e podem sofrer alteração sem aviso prévio.
    </div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
