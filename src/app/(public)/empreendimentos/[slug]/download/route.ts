import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import React from 'react'

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#1e3a5f', paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e3a5f' },
  subtitle: { fontSize: 10, color: '#666', marginTop: 4 },
  table: { marginTop: 16 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', paddingVertical: 5 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1e3a5f', paddingVertical: 6, backgroundColor: '#f8fafc' },
  cell: { fontSize: 8, flex: 1, paddingHorizontal: 4, color: '#374151' },
  cellBold: { fontSize: 8, flex: 1, paddingHorizontal: 4, fontWeight: 'bold', color: '#111827' },
  cellHeader: { fontSize: 7, flex: 1, paddingHorizontal: 4, fontWeight: 'bold', color: '#64748b' },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, fontSize: 7, color: '#9ca3af', textAlign: 'center' },
})

function PDFDoc({ empreendimento, unidades }: { empreendimento: any, unidades: any[] }) {
  const hoje = new Date().toLocaleDateString('pt-BR')
  return React.createElement(Document, { title: `Tabela - ${empreendimento.nome}` },
    React.createElement(Page, { size: 'A4', orientation: 'landscape', style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(Text, { style: styles.title }, empreendimento.nome),
        React.createElement(Text, { style: styles.subtitle }, `${empreendimento.cidade}, ${empreendimento.estado} · Atualizado em ${hoje}`)
      ),
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: styles.cellHeader }, 'Unidade'),
          React.createElement(Text, { style: styles.cellHeader }, 'Pavimento'),
          React.createElement(Text, { style: styles.cellHeader }, 'Área'),
          React.createElement(Text, { style: styles.cellHeader }, 'Quartos'),
          React.createElement(Text, { style: styles.cellHeader }, 'Valor'),
          React.createElement(Text, { style: styles.cellHeader }, 'Entrada'),
          React.createElement(Text, { style: styles.cellHeader }, 'Parcelas'),
          React.createElement(Text, { style: styles.cellHeader }, 'Status'),
        ),
        ...unidades.filter(u => u.status !== 'bloqueada' && u.status !== 'indisponivel').map(u =>
          React.createElement(View, { key: u.id, style: styles.tableRow },
            React.createElement(Text, { style: styles.cellBold }, u.unidade ?? ''),
            React.createElement(Text, { style: styles.cell }, u.pavimento ?? ''),
            React.createElement(Text, { style: styles.cell }, u.area_total ? `${u.area_total}m²` : ''),
            React.createElement(Text, { style: styles.cell }, u.quartos ? String(u.quartos) : ''),
            React.createElement(Text, { style: styles.cellBold }, u.valor_imovel ? `R$ ${Number(u.valor_imovel).toLocaleString('pt-BR')}` : ''),
            React.createElement(Text, { style: styles.cell }, u.valor_sinal ? `R$ ${Number(u.valor_sinal).toLocaleString('pt-BR')}` : ''),
            React.createElement(Text, { style: styles.cell }, u.quantidade_parcelas && u.valor_parcela ? `${u.quantidade_parcelas}x R$ ${Number(u.valor_parcela).toLocaleString('pt-BR')}` : ''),
            React.createElement(Text, { style: styles.cell }, u.status ?? ''),
          )
        )
      ),
      React.createElement(Text, { style: styles.footer }, 'Os valores e condições podem sofrer alteração sem aviso prévio. Casa Forte Construtora e Incorporadora.')
    )
  )
}

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  const supabase = await createClient()

  const { data: empreendimento } = await supabase
    .from('empreendimentos')
    .select('*')
    .eq('slug', params.slug)
    .eq('ativo_publico', true)
    .single()

  if (!empreendimento) return new NextResponse('Não encontrado', { status: 404 })

  const { data: unidades } = await supabase
    .from('unidades')
    .select('*')
    .eq('empreendimento_id', empreendimento.id)
    .order('pavimento').order('unidade')

  try {
    const buffer = await renderToBuffer(React.createElement(PDFDoc, { empreendimento, unidades: unidades ?? [] }))
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="tabela-${params.slug}.pdf"`,
      },
    })
  } catch (error) {
    return new NextResponse('Erro ao gerar PDF', { status: 500 })
  }
}
