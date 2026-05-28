// src/app/layout.tsx
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Casa Forte | Tabelas de Vendas',
    template: '%s | Casa Forte',
  },
  description:
    'Plataforma de tabelas de vendas da Casa Forte Construtora e Incorporadora. ' +
    'Consulte disponibilidade, valores e condições dos nossos empreendimentos.',
  keywords: ['Casa Forte', 'imóveis', 'tabela de vendas', 'empreendimentos', 'Maceió', 'Alagoas'],
  authors: [{ name: 'Casa Forte Construtora e Incorporadora' }],
  openGraph: {
    siteName: 'Casa Forte | Tabelas de Vendas',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
