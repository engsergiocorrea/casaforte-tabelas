import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: p } = await supabase
    .from('propostas')
    .select('*, empreendimentos(nome,cidade,estado,indice_ate_entrega,indice_apos_entrega,parcelas_padrao,observacoes_publicas), unidades(unidade,pavimento,posicao,area_construida,area_privativa_externa,area_total,quartos,valor_imovel,valor_sinal,percentual_sinal,quantidade_parcelas,valor_parcela,quantidade_intercaladas,periodicidade_intercaladas,valor_intercalada,valor_chaves,percentual_chaves)')
    .eq('id', id)
    .single()

  if (!p) return new NextResponse('Não encontrado', { status: 404 })

  const emp = p.empreendimentos as any
  const uni = p.unidades as any
  const fmt = (v: any) => v ? `R$ ${Number(v).toLocaleString('pt-BR', {minimumFractionDigits:2})}` : '—'
  const fmtDate = (v: any) => v ? new Date(v+'T00:00:00').toLocaleDateString('pt-BR') : '—'
  const today = new Date().toLocaleDateString('pt-BR')

  const estadoCivilLabel: Record<string,string> = {
    solteiro: 'Solteiro(a)', casado: 'Casado(a)', divorciado: 'Divorciado(a)',
    viuvo: 'Viúvo(a)', uniao_estavel: 'União estável'
  }

  const row = (label: string, value: any) => value ? `
    <tr>
      <td style="padding:6px 12px;font-size:12px;color:#6b7280;width:180px;border-bottom:1px solid #f3f4f6">${label}</td>
      <td style="padding:6px 12px;font-size:12px;color:#111;font-weight:500;border-bottom:1px solid #f3f4f6">${value}</td>
    </tr>` : ''

  const section = (title: string, content: string) => `
    <div style="margin-bottom:20px">
      <div style="background:#E8390E;color:white;padding:8px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${title}</div>
      <table style="width:100%;border-collapse:collapse;background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
        ${content}
      </table>
    </div>`

  const somatorio = (Number(p.valor_sinal)||0) +
    ((Number(p.quantidade_parcelas)||0) * (Number(p.valor_parcela)||0)) +
    ((Number(p.quantidade_intercaladas)||0) * (Number(p.valor_intercalada)||0)) +
    (Number(p.valor_chaves)||0)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Proposta — ${emp?.nome} — Unidade ${uni?.unidade}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f3f0; color: #111; font-size: 13px; }
    @media print {
      body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
<div style="max-width:820px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="background:#1E1E1E;border-radius:12px;padding:20px 24px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:16px">
      <img src="https://idjzhzqvfhtfycvmfoen.supabase.co/storage/v1/object/public/empreendimentos/logosemfundo%20casa%20forte.png"
        style="height:44px;filter:brightness(0) invert(1)" alt="Casa Forte" />
      <div style="border-left:1px solid rgba(255,255,255,0.2);padding-left:16px">
        <div style="color:white;font-size:18px;font-weight:700">Proposta de Compra</div>
        <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:2px">${emp?.nome} — Unidade ${uni?.unidade}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,0.4);font-size:10px;text-transform:uppercase;margin-bottom:2px">Data</div>
      <div style="color:white;font-size:13px;font-weight:600">${today}</div>
    </div>
  </div>

  <!-- Botão imprimir -->
  <div class="no-print" style="margin-bottom:16px;text-align:right">
    <button onclick="window.print()" style="padding:8px 20px;background:#E8390E;color:white;border:none;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer">🖨️ Imprimir / Salvar PDF</button>
  </div>

  <!-- Unidade -->
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:16px 20px;margin-bottom:20px">
    <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:12px;letter-spacing:0.05em">Dados do Imóvel</div>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
      <div><div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Empreendimento</div><div style="font-weight:700;font-size:14px">${emp?.nome}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Unidade</div><div style="font-weight:700;font-size:14px">${uni?.unidade}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Pavimento</div><div style="font-weight:600">${uni?.pavimento ?? '—'}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Área construída</div><div style="font-weight:600">${uni?.area_construida ? uni.area_construida+'m²' : '—'}</div></div>
      <div><div style="font-size:10px;color:#9ca3af;margin-bottom:2px">Quartos</div><div style="font-weight:600">${uni?.quartos ?? '—'}</div></div>
    </div>
  </div>

  <!-- Comprador -->
  ${section('👤 Dados do Comprador', `
    ${row('Nome completo', p.comprador1_nome)}
    ${row('CPF', p.comprador1_cpf)}
    ${row('RG', p.comprador1_rg)}
    ${row('Profissão', p.comprador1_profissao)}
    ${row('Data de nascimento', fmtDate(p.comprador1_nascimento))}
    ${row('Estado civil', estadoCivilLabel[p.comprador1_estado_civil] ?? p.comprador1_estado_civil)}
    ${row('E-mail', p.comprador1_email)}
    ${row('Telefone/WhatsApp', p.comprador1_telefone)}
  `)}

  <!-- Cônjuge -->
  ${p.conjuge_nome ? section('💑 Dados do Cônjuge', `
    ${row('Nome completo', p.conjuge_nome)}
    ${row('CPF', p.conjuge_cpf)}
    ${row('RG', p.conjuge_rg)}
    ${row('Profissão', p.conjuge_profissao)}
    ${row('Data de nascimento', fmtDate(p.conjuge_nascimento))}
    ${row('E-mail', p.conjuge_email)}
    ${row('Telefone', p.conjuge_telefone)}
  `) : ''}

  <!-- Comprador 2 -->
  ${p.comprador2_nome ? section('👤 Segundo Comprador', `
    ${row('Nome completo', p.comprador2_nome)}
    ${row('CPF', p.comprador2_cpf)}
    ${row('RG', p.comprador2_rg)}
    ${row('Profissão', p.comprador2_profissao)}
    ${row('Data de nascimento', fmtDate(p.comprador2_nascimento))}
    ${row('Estado civil', estadoCivilLabel[p.comprador2_estado_civil] ?? p.comprador2_estado_civil)}
    ${row('E-mail', p.comprador2_email)}
    ${row('Telefone', p.comprador2_telefone)}
  `) : ''}

  <!-- Corretor -->
  ${section('🏢 Corretor / Imobiliária', `
    ${row('Nome do corretor', p.corretor_nome)}
    ${row('CPF/CNPJ', p.corretor_cpf_cnpj)}
    ${row('CRECI', p.corretor_creci)}
    ${row('Imobiliária', p.imobiliaria_nome)}
    ${row('E-mail', p.corretor_email)}
    ${row('Telefone', p.corretor_telefone)}
  `)}

  <!-- Pagamento -->
  <div style="margin-bottom:20px">
    <div style="background:#E8390E;color:white;padding:8px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">💰 Condições de Pagamento</div>
    <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:16px">
      <div style="background:${p.segue_tabela?'#f0fdf4':'#fffbeb'};border:1px solid ${p.segue_tabela?'#bbf7d0':'#fde68a'};border-radius:6px;padding:8px 12px;margin-bottom:14px;font-size:12px;font-weight:600;color:${p.segue_tabela?'#15803d':'#92400e'}">
        ${p.segue_tabela ? '✅ Segue os valores da tabela de vendas' : '⚠️ Propõe condições diferentes da tabela'}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:14px">
        <div style="background:#f8fafc;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Valor proposto</div>
          <div style="font-size:18px;font-weight:700;color:#E8390E">${fmt(p.valor_proposto)}</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Sinal (${uni?.percentual_sinal ?? 10}%)</div>
          <div style="font-size:16px;font-weight:600">${fmt(p.valor_sinal)}</div>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:12px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Chaves (${uni?.percentual_chaves ?? 20}%)</div>
          <div style="font-size:16px;font-weight:600">${fmt(p.valor_chaves)}</div>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:14px">
        ${p.quantidade_parcelas && p.valor_parcela ? `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:6px 0;font-size:12px;color:#6b7280">Parcelas mensais</td>
          <td style="padding:6px 0;font-size:12px;font-weight:600;text-align:right">${p.quantidade_parcelas}x de ${fmt(p.valor_parcela)}</td>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;text-align:right;padding-left:12px">= ${fmt(p.quantidade_parcelas * p.valor_parcela)}</td>
        </tr>` : ''}
        ${p.quantidade_intercaladas && p.valor_intercalada ? `
        <tr style="border-bottom:1px solid #f3f4f6">
          <td style="padding:6px 0;font-size:12px;color:#6b7280">Intercaladas (${p.periodicidade_intercaladas})</td>
          <td style="padding:6px 0;font-size:12px;font-weight:600;text-align:right">${p.quantidade_intercaladas}x de ${fmt(p.valor_intercalada)}</td>
          <td style="padding:6px 0;font-size:12px;color:#6b7280;text-align:right;padding-left:12px">= ${fmt(p.quantidade_intercaladas * p.valor_intercalada)}</td>
        </tr>` : ''}
      </table>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;font-weight:600;color:#374151">Somatório total:</span>
        <span style="font-size:18px;font-weight:700;color:#15803d">${fmt(somatorio)}</span>
      </div>
      ${p.observacoes_pagamento ? `
      <div style="margin-top:10px;padding:10px 12px;background:#fffbeb;border-radius:6px;font-size:12px;color:#92400e">
        <strong>Obs.:</strong> ${p.observacoes_pagamento}
      </div>` : ''}
    </div>
  </div>

  ${p.observacoes ? `
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:14px 20px;margin-bottom:20px">
    <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:8px">Observações Gerais</div>
    <p style="font-size:13px;color:#374151">${p.observacoes}</p>
  </div>` : ''}

  <!-- Assinaturas -->
  <div style="background:white;border-radius:12px;border:1px solid #e5e7eb;padding:20px;margin-bottom:20px">
    <div style="font-size:11px;color:#9ca3af;text-transform:uppercase;font-weight:600;margin-bottom:20px">Assinaturas</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px">
      <div>
        <div style="border-top:1px solid #374151;padding-top:8px;margin-top:40px">
          <div style="font-size:12px;font-weight:600">${p.comprador1_nome}</div>
          <div style="font-size:11px;color:#6b7280">Comprador — CPF: ${p.comprador1_cpf ?? '___________________'}</div>
        </div>
      </div>
      <div>
        <div style="border-top:1px solid #374151;padding-top:8px;margin-top:40px">
          <div style="font-size:12px;font-weight:600">${p.corretor_nome ?? 'Corretor Responsável'}</div>
          <div style="font-size:11px;color:#6b7280">CRECI: ${p.corretor_creci ?? '___________________'}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:10px;color:#9ca3af;margin-top:8px">
    Casa Forte Construtora e Incorporadora · Proposta gerada em ${today} · Os valores são de referência e sujeitos à aprovação da diretoria comercial.
  </div>

</div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
