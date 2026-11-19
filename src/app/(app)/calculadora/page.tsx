import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { Calculadora } from './Calculadora'

export const metadata: Metadata = { title: 'Calculadora de preço' }

export default async function Pagina() {
  const { supabase, podeEditar } = await exigirLoja()
  const { data } = await supabase.from('produtos').select('id, nome, custo, preco').eq('ativo', true).order('nome').limit(3000)
  const produtos = (data ?? []).map((p) => ({ ...p, custo: Number(p.custo), preco: Number(p.preco) }))
  return (
    <>
      <div className="lv-top">
        <div>
          <h1>Calculadora de preço</h1>
          <p>Preço certo com custo, taxa do canal, imposto e o lucro que você quer.</p>
        </div>
      </div>
      <Calculadora produtos={produtos} podeEditar={podeEditar} />
    </>
  )
}
