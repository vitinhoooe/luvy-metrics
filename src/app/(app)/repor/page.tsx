import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { Giro, type ItemGiro } from './Giro'

export const metadata: Metadata = { title: 'O que repor' }

export default async function Repor({ searchParams }: { searchParams: Promise<{ v?: string; d?: string }> }) {
  const { supabase, podeEditar } = await exigirLoja()
  const { v, d } = await searchParams
  const { data } = await supabase.rpc('giro_estoque', { p_dias: 30, p_cobertura: 30 })
  const itens = ((data ?? []) as ItemGiro[]).map((i) => ({ ...i, custo: Number(i.custo), preco: Number(i.preco), valor_parado: Number(i.valor_parado), por_dia: Number(i.por_dia) }))
  const dias = [30, 60, 90].includes(Number(d)) ? Number(d) : 60
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Estoque inteligente</h1>
          <p>O que repor antes de acabar e o dinheiro parado na prateleira, a partir das suas vendas reais.</p>
        </div>
      </div>
      <Giro itens={itens} vista={v === 'parado' ? 'parado' : 'repor'} diasParado={dias} podeEditar={podeEditar} base="/repor" />
    </>
  )
}
