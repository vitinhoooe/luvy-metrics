import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { Sora, JetBrains_Mono } from 'next/font/google'
import LandingMosaik from './_landing/LandingMosaik'

const sora = Sora({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--mk-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--mk-mono' })

export const metadata: Metadata = {
  title: 'LuvyMetrics — Loja online e controle de estoque para bem-estar íntimo',
  description:
    'Estoque único para balcão e site, lucro real de cada venda e preço certo para Mercado Livre e Shopee. Planos a partir de R$ 97 por mês. 7 dias grátis, sem cartão.',
}

export default async function Home() {
  // quem já está logado vai direto para o painel
  let logado = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    logado = !!user
  } catch {}
  if (logado) redirect('/painel')

  return <div className={`${sora.variable} ${mono.variable}`}><LandingMosaik /></div>
}
