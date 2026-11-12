import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Literata, Inter, Sora, JetBrains_Mono, Geist, Geist_Mono, Silkscreen, Archivo } from 'next/font/google'
import Landing from './_landing/Landing'
import LandingMosaik from './_landing/LandingMosaik'
import LandingPontos from './_landing/LandingPontos'
import LandingNorte from './_landing/LandingNorte'

const literata = Literata({ subsets: ['latin'], weight: ['300', '400'], variable: '--lv-serif' })
const inter = Inter({ subsets: ['latin'], variable: '--lv-sans' })
const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--mk-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--mk-mono' })
const geist = Geist({ subsets: ['latin'], variable: '--pt-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--pt-mono' })
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--nt-sans' })
const pixel = Silkscreen({ subsets: ['latin'], weight: ['400', '700'], variable: '--pt-pixel' })

export const metadata: Metadata = {
  title: 'LuvyMetrics — Inteligência de mercado para sex shops',
  description:
    'Veja os produtos em alta na sua cidade, calcule o preço ideal com todas as taxas e compare com o Mercado Livre e a Shopee. 7 dias grátis, sem cartão.',
}

export default async function Home({ searchParams }: { searchParams: Promise<{ v?: string }> }) {
  let logado = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    logado = !!user
  } catch {}
  if (logado) redirect('/dashboard')

  // Três versões para comparar: / (floresta), /?v=mosaik (monocromática) e /?v=pontos (3D em pontos)
  const { v } = await searchParams
  if (v === 'norte') {
    return <div className={archivo.variable}><LandingNorte /></div>
  }
  if (v === 'pontos') {
    return <div className={`${geist.variable} ${geistMono.variable} ${pixel.variable}`}><LandingPontos /></div>
  }
  if (v === 'mosaik') {
    return <div className={`${sora.variable} ${mono.variable}`}><LandingMosaik /></div>
  }
  return <div className={`${literata.variable} ${inter.variable}`}><Landing /></div>
}
