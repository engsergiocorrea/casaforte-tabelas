import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/server'
import { CORRETOR_COOKIE, decodeCorretor } from '@/lib/corretor'

// Recebe a proposta do corretor e grava com service role. Assim a chave pública
// (anon) NÃO precisa mais de acesso à tabela 'propostas' — o que evita que
// qualquer um leia os dados (CPF/RG/e-mail) de todas as propostas.
// Exige o cookie de corretor (mesmo gate do restante do site).
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const corretor = decodeCorretor(cookieStore.get(CORRETOR_COOKIE)?.value)
    if (!corretor) {
      return NextResponse.json({ erro: 'Identifique-se como corretor para enviar propostas.' }, { status: 401 })
    }

    const data = await req.json()
    if (!data?.unidade_id || !data?.empreendimento_id || !data?.comprador1_nome) {
      return NextResponse.json({ erro: 'Dados obrigatórios ausentes.' }, { status: 400 })
    }

    // Não deixa o cliente forjar status/identificadores — usa os defaults do banco.
    for (const campo of ['id', 'status', 'created_at', 'updated_at', 'aprovado_por', 'data_aprovacao']) {
      delete data[campo]
    }

    const admin = createAdminClient()
    const { data: proposta, error } = await admin.from('propostas').insert([data]).select('id').single()
    if (error) return NextResponse.json({ erro: error.message }, { status: 500 })

    return NextResponse.json({ id: proposta.id })
  } catch (err: any) {
    return NextResponse.json({ erro: err?.message ?? 'Erro inesperado.' }, { status: 500 })
  }
}
