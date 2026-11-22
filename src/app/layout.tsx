import type { Metadata } from 'next'
import './globals.css'
import { WhatsAppConvite } from '@/components/WhatsAppConvite'
import { Splash } from '@/components/Splash'
import { CarregandoEntrePaginas } from '@/components/cf-carregando/entre-paginas'

export const metadata: Metadata = {
  title: {
    default: 'Casa Forte | Tabelas de Vendas',
    template: '%s | Casa Forte',
  },
  description: 'Plataforma de tabelas de vendas da Casa Forte Construtora e Incorporadora.',
  icons: { icon: '/icon.png', apple: '/apple-icon.png' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Splash />
        <CarregandoEntrePaginas />
        {children}
        <WhatsAppConvite />
      </body>
    </html>
  )
}
