import type { Metadata } from 'next'
import { exigirLoja } from '@/lib/sessao'
import { Diretorio } from './Diretorio'
import { AbasFornecedores } from './Abas'
import { MeusFornecedores, resumirProdutos, type MeuFornecedor } from './MeusFornecedores'

export const metadata: Metadata = { title: 'Fornecedores' }

export default async function Fornecedores({ searchParams }: { searchParams: Promise<{ aba?: string }> }) {
  const { supabase, loja } = await exigirLoja()
  const { aba: a } = await searchParams
  const [{ data: forn }, { data: prods }] = await Promise.all([
    supabase.from('fornecedores').select('id, nome, contato, whatsapp, email, site, cidade, prazo_dias, pedido_minimo, pagamento, nota, obs, ultimo_pedido, diretorio_id').order('nome'),
    supabase.from('produtos').select('fornecedor, quantidade, custo, estoque_minimo').eq('ativo', true).not('fornecedor', 'is', null).limit(10000),
  ])
  const meus = (forn ?? []).map((f) => ({ ...f, pedido_minimo: f.pedido_minimo == null ? null : Number(f.pedido_minimo) })) as MeuFornecedor[]
  // sem nenhum cadastrado, abre no diretório
  const aba = a === 'diretorio' || (a !== 'meus' && meus.length === 0) ? 'diretorio' : 'meus'
  return (
    <>
      <div className="lv-top">
        <div><h1>Fornecedores</h1><p>De quem você compra, quanto tem de cada um no estoque e o que precisa repor. Um toque para pedir no WhatsApp.</p></div>
      </div>
      <AbasFornecedores base="/fornecedores" aba={aba} meus={meus.length} />
      {aba === 'meus'
        ? <MeusFornecedores fornecedores={meus} resumo={resumirProdutos((prods ?? []) as never)} loja={loja.nome} />
        : <Diretorio loja={loja.nome} salvos={meus.map((f) => f.diretorio_id).filter(Boolean) as string[]} />}
    </>
  )
}
