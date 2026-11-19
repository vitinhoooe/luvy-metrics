import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { Pdv, type ProdPdv } from './Pdv'

export const metadata: Metadata = { title: 'Vender' }

export default async function Vender() {
  const { supabase, podeEditar } = await exigirLoja()
  const [{ data: produtos }, { data: caixa }] = await Promise.all([
    supabase.from('produtos').select('id, nome, preco, quantidade, codigo_barras, categoria').eq('ativo', true).order('nome').limit(5000),
    supabase.from('caixas').select('id').eq('status', 'aberto').maybeSingle(),
  ])
  const lista = ((produtos ?? []) as ProdPdv[]).map((p) => ({ ...p, preco: Number(p.preco) }))
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Vender no balcão</h1>
          <p>Cada venda baixa o estoque na hora.</p>
        </div>
      </div>
      <Pdv produtos={lista} caixaAberto={!!caixa} podeEditar={podeEditar} />
    </>
  )
}
