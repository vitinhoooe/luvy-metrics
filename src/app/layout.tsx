import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LuvyMetrics — Tendências para Sex Shop',
  description: 'Dados de mercado, gestão de estoque e alertas para lojas de sex shop.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-[--bg] text-[--text]">{children}</body>
    </html>
  )
}
