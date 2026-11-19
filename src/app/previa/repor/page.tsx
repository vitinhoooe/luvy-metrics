import { Giro, type ItemGiro } from '../../(app)/repor/Giro'

// giro de exemplo: alguns vendem bem e vão acabar, outros estão parados
const ITENS: ItemGiro[] = [
  { id: '1', nome: 'Gel beijável morango 30ml', categoria: 'Cosméticos sensuais', fornecedor: 'Distribuidora Sensual', quantidade: 6, custo: 9.5, preco: 24.9, preco_promocional: null, vendidos: 42, por_dia: 1.4, dias_restantes: 4, sugestao: 36, dias_sem_vender: 0, valor_parado: 57 },
  { id: '2', nome: 'Óleo de massagem ylang-ylang', categoria: 'Óleos de massagem', fornecedor: 'Distribuidora Sensual', quantidade: 0, custo: 15, preco: 39.9, preco_promocional: null, vendidos: 18, por_dia: 0.6, dias_restantes: 0, sugestao: 18, dias_sem_vender: 3, valor_parado: 0 },
  { id: '3', nome: 'Vibrador bullet recarregável', categoria: 'Vibradores', fornecedor: 'Importadora Prazer', quantidade: 5, custo: 38, preco: 89.9, preco_promocional: null, vendidos: 15, por_dia: 0.5, dias_restantes: 10, sugestao: 10, dias_sem_vender: 1, valor_parado: 190 },
  { id: '4', nome: 'Lubrificante à base d’água 60g', categoria: 'Lubrificantes', fornecedor: 'Distribuidora Sensual', quantidade: 22, custo: 8, preco: 21.9, preco_promocional: null, vendidos: 20, por_dia: 0.667, dias_restantes: 33, sugestao: 0, dias_sem_vender: 0, valor_parado: 176 },
  { id: '5', nome: 'Kit fantasia enfermeira', categoria: 'Fantasias', fornecedor: 'Moda Íntima Recife', quantidade: 9, custo: 45, preco: 99.9, preco_promocional: null, vendidos: 0, por_dia: 0, dias_restantes: null, sugestao: 0, dias_sem_vender: 94, valor_parado: 405 },
  { id: '6', nome: 'Body de renda vermelho', categoria: 'Lingerie', fornecedor: 'Moda Íntima Recife', quantidade: 7, custo: 52, preco: 119, preco_promocional: 101.09, vendidos: 0, por_dia: 0, dias_restantes: null, sugestao: 0, dias_sem_vender: 71, valor_parado: 364 },
  { id: '7', nome: 'Jogo de dados eróticos', categoria: 'Jogos e brincadeiras', fornecedor: null, quantidade: 14, custo: 6, preco: 19.9, preco_promocional: null, vendidos: 0, por_dia: 0, dias_restantes: null, sugestao: 0, dias_sem_vender: 66, valor_parado: 84 },
]

export default async function PreviaRepor({ searchParams }: { searchParams: Promise<{ v?: string; d?: string }> }) {
  const { v, d } = await searchParams
  return (
    <>
      <div className="lv-top"><div><h1>Estoque inteligente</h1><p>O que repor antes de acabar e o dinheiro parado na prateleira · dados de exemplo</p></div></div>
      <Giro itens={ITENS} vista={v === 'parado' ? 'parado' : 'repor'} diasParado={[30, 60, 90].includes(Number(d)) ? Number(d) : 60} podeEditar base="/previa/repor" simular />
    </>
  )
}
