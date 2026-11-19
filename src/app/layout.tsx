import type { Metadata, Viewport } from 'next'
import { Sora } from 'next/font/google'
import './globals.css'

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: { default: 'LuvyMetrics', template: '%s · LuvyMetrics' },
  description: 'Estoque, balcão e loja online da sua loja de bem-estar íntimo num controle só.',
  icons: { apple: '/apple-icone.png' },
  appleWebApp: { capable: true, title: 'Luvy', statusBarStyle: 'black-translucent' },
}

export const viewport: Viewport = { themeColor: '#0d0d0f', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={sora.variable}>
      <body>{children}</body>
    </html>
  )
}
