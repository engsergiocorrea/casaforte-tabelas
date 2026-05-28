import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Casa Forte | Tabelas de Vendas',
    template: '%s | Casa Forte',
  },
  description: 'Plataforma de tabelas de vendas da Casa Forte Construtora e Incorporadora.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
