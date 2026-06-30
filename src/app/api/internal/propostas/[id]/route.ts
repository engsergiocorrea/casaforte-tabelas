import { NextResponse } from 'next/server'
import { requireTabelasInternalKey } from '@/lib/internal-api/auth'
import { createServiceClient } from '@/lib/internal-api/db'

// GET /api/internal/propostas/[id]
// Detalhe completo da proposta para gerar o contrato. Somente leitura.
// O comprador na proposta tem apenas nome/documento — os demais campos do
// comprador vêm como null (não existem no Tabelas; serão completados pelo
// Contratos/Portal). Não expõe observações internas da proposta.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = requireTabelasInternalKey(request)
  if (!auth.ok) return auth.response

  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('propostas')
    .select(
      '*, empreendimentos(id, nome, slug), ' +
        'unidades(id, unidade, tipo, categoria, area_privativa_total, area_privativa_externa, valor_imovel, status)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Falha ao consultar proposta.' }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: 'Proposta não encontrada.' }, { status: 404 })
  }
  const p: any = data

  const emp: any = p.empreendimentos ?? {}
  const uni: any = p.unidades ?? {}
  const mensaisTotal = (Number(p.quantidade_parcelas) || 0) * (Number(p.valor_parcela) || 0)
  const intercaladasTotal = (Number(p.quantidade_intercaladas) || 0) * (Number(p.valor_intercalada) || 0)

  return NextResponse.json({
    proposta: {
      id: p.id,
      status_proposta: p.status_proposta,
      empreendimento: { id: emp.id ?? p.empreendimento_id, nome: emp.nome ?? null, slug: emp.slug ?? null },
      unidade: {
        id: uni.id ?? p.unidade_id,
        codigo: uni.unidade ?? null,
        tipologia: uni.tipo ?? uni.categoria ?? null,
        area_privativa: uni.area_privativa_total ?? null,
        area_externa: uni.area_privativa_externa ?? null,
        valor_imovel: uni.valor_imovel ?? null,
        status: uni.status ?? null,
      },
      comprador: {
        nome: p.comprador_nome ?? null,
        documento: p.comprador_documento ?? null,
        // Campos não existentes na proposta do Tabelas — completados depois
        // pelo Contratos (e eventualmente cruzando com o cliente do Portal).
        email: null,
        telefone: null,
        endereco: null,
        nacionalidade: null,
        estado_civil: null,
        profissao: null,
        identidade: null,
        naturalidade: null,
        data_nascimento: null,
        regime_bens: null,
      },
      conjuge: {
        nome: p.conjuge_nome ?? null,
        cpf: p.conjuge_cpf ?? null,
        rg: p.conjuge_rg ?? null,
        email: p.conjuge_email ?? null,
        telefone: p.conjuge_telefone ?? null,
        nascimento: p.conjuge_nascimento ?? null,
        profissao: p.conjuge_profissao ?? null,
      },
      corretor: {
        nome: p.corretor_nome ?? null,
        cpf_cnpj: p.corretor_cpf_cnpj ?? null,
        creci: p.corretor_creci ?? null,
        email: p.corretor_email ?? null,
        telefone: p.corretor_telefone ?? null,
        imobiliaria_nome: p.imobiliaria_nome ?? null,
      },
      pagamento: {
        valor_imovel: p.valor_imovel ?? null,
        valor_proposto: p.valor_proposto ?? null,
        segue_tabela: p.segue_tabela ?? null,
        valor_sinal: p.valor_sinal ?? null,
        mensais_quantidade: p.quantidade_parcelas ?? null,
        mensais_valor: p.valor_parcela ?? null,
        mensais_total: mensaisTotal,
        intercaladas_quantidade: p.quantidade_intercaladas ?? null,
        intercaladas_valor: p.valor_intercalada ?? null,
        intercaladas_total: intercaladasTotal,
        intercaladas_periodicidade: p.periodicidade_intercaladas ?? null,
        chaves_valor: p.valor_chaves ?? null,
        observacoes_pagamento: p.observacoes_pagamento ?? null,
      },
    },
  })
}
