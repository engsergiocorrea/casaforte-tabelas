// src/app/(public)/empreendimentos/[slug]/download/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { TabelaPDF } from '@/components/pdf/TabelaPDF'
import React from 'react'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createClient()

  // Buscar dados
  const { data: empreendimento } = await supabase
    .from('empreendimentos')
    .select('*')
    .eq('slug', params.slug)
    .eq('ativo_publico', true)
    .single()

  if (!empreendimento) {
    return new NextResponse('Empreendimento não encontrado', { status: 404 })
  }

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento', { ascending: true })
    .order('unidade', { ascending: true })

  const { data: configuracao } = await supabase
    .from('configuracoes_tabela')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .single()

  // Gerar PDF
  try {
    const buffer = await renderToBuffer(
      React.createElement(TabelaPDF, {
        empreendimento,
        unidades: unidades ?? [],
        configuracao,
      })
    )

    const filename = `tabela-${params.slug}-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
