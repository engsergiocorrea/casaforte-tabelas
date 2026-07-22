import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Salva a "tabela por m²": o valor do m² do empreendimento e a área de cada
// unidade. A partir disso calcula e grava, por unidade:
//   valor_imovel = área × valor_m2
//   entrada (sinal) = 20% do valor_imovel  (o saldo, 80%, é financiamento)
// Assim a administração edita SOMENTE o m² e as áreas. Roda com service role
// (evita depender de RLS), mas exige usuário logado.
const round2 = (n: number) => Math.round(n * 100) / 100

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ erro: 'Não autenticado.' }, { status: 401 })

    const { empreendimento_id, valor_m2, unidades } = await req.json()
    if (!empreendimento_id || !Array.isArray(unidades)) {
      return NextResponse.json({ erro: 'Parâmetros inválidos.' }, { status: 400 })
    }
    const vm2 = valor_m2 === '' || valor_m2 == null ? null : Number(valor_m2)
    if (vm2 != null && (!isFinite(vm2) || vm2 < 0)) {
      return NextResponse.json({ erro: 'Valor do m² inválido.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error: empErr } = await admin
      .from('empreendimentos')
      .update({ valor_m2: vm2, percentual_sinal_padrao: 20 })
      .eq('id', empreendimento_id)
    if (empErr) return NextResponse.json({ erro: empErr.message }, { status: 500 })

    let atualizadas = 0
    for (const u of unidades) {
      if (!u?.id) continue
      const area = u.area_construida === '' || u.area_construida == null ? null : Number(u.area_construida)
      const temValores = vm2 != null && area != null && isFinite(area) && area > 0
      const valor_imovel = temValores ? round2(area! * vm2!) : null
      const valor_sinal = temValores ? round2(valor_imovel! * 0.2) : null
      const { error } = await admin
        .from('unidades')
        .update({
          area_construida: area,
          valor_imovel,
          percentual_sinal: temValores ? 20 : null,
          valor_sinal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', u.id)
        .eq('empreendimento_id', empreendimento_id)
      if (!error) atualizadas++
    }

    return NextResponse.json({ ok: true, atualizadas })
  } catch (err: any) {
    return NextResponse.json({ erro: err?.message ?? 'Erro inesperado.' }, { status: 500 })
  }
}
