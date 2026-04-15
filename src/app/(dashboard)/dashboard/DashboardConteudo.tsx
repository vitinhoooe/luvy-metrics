'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

type Props = {
  saudacao: string
  nomeUsuario: string
  dataFormatada: string
  diasTrial: number
  produtosEmAlta: number
  estoqueEvitado: number
  lucroMedio: number
  alertasHoje: number
  tendencias: ProdutoTendencia[]
  userId: string
}

function badgeTendencia(crescimento: number) {
  if (crescimento > 50) return { label: '🔥 Urgente', cor: 'bg-red-500/15 text-red-400 border-red-500/25' }
  if (crescimento >= 25) return { label: '↑ Comprar', cor: 'bg-green-500/15 text-green-400 border-green-500/25' }
  return { label: '→ Monitorar', cor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' }
}

function fmt(valor: number, tipo: 'moeda' | 'pct' | 'inteiro' = 'inteiro') {
  if (tipo === 'moeda') return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (tipo === 'pct') return `${valor.toFixed(0)}%`
  return valor.toLocaleString('pt-BR')
}

type ModalEstoqueProps = {
  produto: ProdutoTendencia
  userId: string
  onFechar: () => void
}

function ModalAdicionarEstoque({ produto, userId, onFechar }: ModalEstoqueProps) {
  const [quantidade, setQuantidade] = useState(10)
  const [qtdMinima, setQtdMinima] = useState(5)
  const [precoCusto, setPrecoCusto] = useState(produto.preco_medio * 0.5)
  const [precoVenda, setPrecoVenda] = useState(produto.preco_medio)
  const [carregando, setCarregando] = useState(false)

  async function salvar() {
    setCarregando(true)
    const supabase = createClient()
    const { error } = await supabase.from('estoque_usuario').insert({
      user_id: userId,
      produto_nome: produto.produto_nome,
      quantidade,
      quantidade_minima: qtdMinima,
      preco_custo: precoCusto,
      preco_venda: precoVenda,
      categoria: produto.categoria,
    })

    if (error) {
      toast.error('Erro ao adicionar ao estoque')
    } else {
      toast.success(`${produto.produto_nome} adicionado ao estoque!`)
      onFechar()
    }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0a13] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Adicionar ao Estoque</h2>
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-zinc-400 mb-5 bg-white/5 rounded-xl px-4 py-2.5">
          📦 <span className="text-white font-medium">{produto.produto_nome}</span>
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Quantidade inicial</label>
              <input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} min={1}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Qtd. mínima</label>
              <input type="number" value={qtdMinima} onChange={(e) => setQtdMinima(Number(e.target.value))} min={1}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Preço de custo (R$)</label>
              <input type="number" value={precoCusto} onChange={(e) => setPrecoCusto(Number(e.target.value))} step={0.01} min={0}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Preço de venda (R$)</label>
              <input type="number" value={precoVenda} onChange={(e) => setPrecoVenda(Number(e.target.value))} step={0.01} min={0}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button onClick={salvar} disabled={carregando}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            {carregando ? 'Salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardConteudo({
  saudacao, nomeUsuario, dataFormatada, diasTrial,
  produtosEmAlta, estoqueEvitado, lucroMedio, alertasHoje,
  tendencias, userId,
}: Props) {
  const [modalProduto, setModalProduto] = useState<ProdutoTendencia | null>(null)

  const cards = [
    {
      label: 'Produtos em alta hoje',
      valor: fmt(produtosEmAlta),
      descricao: 'crescimento > 20%',
      emoji: '📊',
      cor: 'from-purple-600/20 to-[#c840e0]/20',
      borda: 'border-purple-500/20',
    },
    {
      label: 'Estoque parado evitado',
      valor: fmt(estoqueEvitado, 'moeda'),
      descricao: 'economia acumulada',
      emoji: '💡',
      cor: 'from-blue-600/20 to-cyan-600/20',
      borda: 'border-blue-500/20',
    },
    {
      label: 'Lucro médio estimado',
      valor: fmt(lucroMedio, 'moeda'),
      descricao: 'por unidade vendida',
      emoji: '💰',
      cor: 'from-green-600/20 to-emerald-600/20',
      borda: 'border-green-500/20',
    },
    {
      label: 'Alertas enviados hoje',
      valor: fmt(alertasHoje),
      descricao: 'oportunidades identificadas',
      emoji: '🔔',
      cor: 'from-orange-600/20 to-red-600/20',
      borda: 'border-orange-500/20',
    },
  ]

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {saudacao}, {nomeUsuario}!
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5 capitalize">{dataFormatada}</p>
        </div>
        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium w-fit">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Trial ativo — {diasTrial} dias restantes
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label}
            className={`bg-gradient-to-br ${card.cor} border ${card.borda} rounded-2xl p-5 hover:scale-[1.01] transition-transform`}>
            <div className="text-2xl mb-3">{card.emoji}</div>
            <p className="text-zinc-400 text-xs mb-1">{card.label}</p>
            <p className="text-2xl font-bold text-white">{card.valor}</p>
            <p className="text-zinc-500 text-xs mt-1">{card.descricao}</p>
          </div>
        ))}
      </div>

      {/* Tabela de tendências */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Produtos em Tendência</h2>
          <span className="text-xs text-zinc-500">{tendencias.length} produtos</span>
        </div>

        {tendencias.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-zinc-400 text-sm">Nenhum produto em tendência hoje.</p>
            <p className="text-zinc-600 text-xs mt-1">Os dados são atualizados diariamente às 6h.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Produto', 'Fonte', 'Crescimento', 'Vendas/dia', 'Preço médio', 'Ação'].map((col) => (
                    <th key={col} className="text-left text-xs text-zinc-500 font-medium px-6 py-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tendencias.map((p) => {
                  const badge = badgeTendencia(p.crescimento_pct)
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-white font-medium max-w-[200px] truncate">{p.produto_nome}</td>
                      <td className="px-6 py-4 text-zinc-400">{p.fonte}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.cor}`}>
                          {badge.label}
                          <span className="font-bold">+{fmt(p.crescimento_pct, 'pct')}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300">{fmt(p.vendas_hoje)}</td>
                      <td className="px-6 py-4 text-zinc-300">{fmt(p.preco_medio, 'moeda')}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setModalProduto(p)}
                          className="px-3 py-1.5 rounded-lg bg-[#c840e0]/15 border border-[#c840e0]/25 text-[#c840e0] text-xs font-medium hover:bg-[#c840e0]/25 transition-all"
                        >
                          + Estoque
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalProduto && (
        <ModalAdicionarEstoque
          produto={modalProduto}
          userId={userId}
          onFechar={() => setModalProduto(null)}
        />
      )}
    </>
  )
}
