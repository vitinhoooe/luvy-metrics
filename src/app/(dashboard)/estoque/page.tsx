'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import type { EstoqueItem } from '@/types'

type StatusEstoque = 'ok' | 'baixo' | 'zerado'

function statusItem(item: EstoqueItem): StatusEstoque {
  if (item.quantidade === 0) return 'zerado'
  if (item.quantidade <= item.quantidade_minima) return 'baixo'
  return 'ok'
}

const statusConfig = {
  ok:     { label: '🟢 OK',     cor: 'bg-green-500/10 text-green-400 border-green-500/20' },
  baixo:  { label: '🟡 Baixo',  cor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  zerado: { label: '🔴 Zerado', cor: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

function fmt(v: number, tipo: 'moeda' | 'pct' | 'num' = 'num') {
  if (tipo === 'moeda') return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  if (tipo === 'pct')   return `${v.toFixed(1)}%`
  return v.toLocaleString('pt-BR')
}

function margem(item: EstoqueItem) {
  if (!item.preco_custo || !item.preco_venda || item.preco_venda === 0) return 0
  return ((item.preco_venda - item.preco_custo) / item.preco_venda) * 100
}

// ────────── Modal Produto ──────────
type ModalProdutoProps = {
  item?: EstoqueItem
  onFechar: () => void
  onSalvar: () => void
}

function ModalProduto({ item, onFechar, onSalvar }: ModalProdutoProps) {
  const [nome, setNome] = useState(item?.produto_nome ?? '')
  const [quantidade, setQuantidade] = useState(item?.quantidade ?? 0)
  const [qtdMinima, setQtdMinima] = useState(item?.quantidade_minima ?? 5)
  const [precoCusto, setPrecoCusto] = useState(item?.preco_custo ?? 0)
  const [precoVenda, setPrecoVenda] = useState(item?.preco_venda ?? 0)
  const [categoria, setCategoria] = useState(item?.categoria ?? '')
  const [carregando, setCarregando] = useState(false)

  const isEdicao = !!item

  async function salvar() {
    if (!nome.trim()) { toast.error('Informe o nome do produto'); return }
    setCarregando(true)
    const body = { produto_nome: nome, quantidade, quantidade_minima: qtdMinima, preco_custo: precoCusto, preco_venda: precoVenda, categoria }

    const res = await fetch('/api/estoque', {
      method: isEdicao ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(isEdicao ? { id: item.id, ...body } : body),
    })

    if (res.ok) {
      toast.success(isEdicao ? 'Produto atualizado!' : 'Produto adicionado!')
      onSalvar()
    } else {
      toast.error('Erro ao salvar produto')
    }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0a13] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{isEdicao ? 'Editar Produto' : 'Adicionar Produto'}</h2>
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Nome do produto *</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Vibrador Silicone USB"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Quantidade</label>
              <input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} min={0}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1.5">Quantidade mínima</label>
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
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Categoria</label>
            <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex: Vibradores"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button onClick={salvar} disabled={carregando}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all">
            {carregando ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────── Modal Movimentação ──────────
type ModalMovProps = {
  item: EstoqueItem
  tipo: 'entrada' | 'saida'
  onFechar: () => void
  onSalvar: () => void
}

function ModalMovimentacao({ item, tipo, onFechar, onSalvar }: ModalMovProps) {
  const [quantidade, setQuantidade] = useState(1)
  const [observacao, setObservacao] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function salvar() {
    if (quantidade <= 0) { toast.error('Informe uma quantidade válida'); return }
    setCarregando(true)
    const res = await fetch('/api/estoque', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, tipo, quantidade, observacao }),
    })
    if (res.ok) {
      toast.success(tipo === 'entrada' ? `+${quantidade} unidades adicionadas!` : `${quantidade} unidades registradas como saída!`)
      onSalvar()
    } else {
      toast.error('Erro ao registrar movimentação')
    }
    setCarregando(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0d0a13] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {tipo === 'entrada' ? '+ Entrada' : '- Saída'} de Estoque
          </h2>
          <button onClick={onFechar} className="text-zinc-500 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-white font-medium mb-4">{item.produto_nome}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Quantidade</label>
            <input type="number" value={quantidade} onChange={(e) => setQuantidade(Number(e.target.value))} min={1}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Observação (opcional)</label>
            <input value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Ex: Compra fornecedor X"
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onFechar} className="flex-1 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 transition-all">
            Cancelar
          </button>
          <button onClick={salvar} disabled={carregando}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all ${tipo === 'entrada' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}>
            {carregando ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ────────── Página principal ──────────
export default function EstoquePage() {
  const [itens, setItens] = useState<EstoqueItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [modalAdicionar, setModalAdicionar] = useState(false)
  const [itemEditar, setItemEditar] = useState<EstoqueItem | null>(null)
  const [movimentacao, setMovimentacao] = useState<{ item: EstoqueItem; tipo: 'entrada' | 'saida' } | null>(null)

  const buscar = useCallback(async () => {
    setCarregando(true)
    const res = await fetch('/api/estoque')
    if (res.ok) setItens(await res.json())
    setCarregando(false)
  }, [])

  useEffect(() => { buscar() }, [buscar])

  async function remover(id: string) {
    if (!confirm('Remover este produto do estoque?')) return
    const res = await fetch('/api/estoque', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) { toast.success('Produto removido'); buscar() }
    else toast.error('Erro ao remover produto')
  }

  function exportarCSV() {
    const cabecalho = ['Produto', 'Quantidade', 'Qtd Mínima', 'Preço Custo', 'Preço Venda', 'Margem', 'Categoria', 'Status']
    const linhas = itens.map((i) => [
      i.produto_nome, i.quantidade, i.quantidade_minima,
      i.preco_custo, i.preco_venda,
      `${margem(i).toFixed(1)}%`, i.categoria,
      statusConfig[statusItem(i)].label.replace(/[🟢🟡🔴] /g, ''),
    ])
    const csv = [cabecalho, ...linhas].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'estoque.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const totalProdutos = itens.length
  const baixos = itens.filter((i) => statusItem(i) !== 'ok').length
  const valorTotal = itens.reduce((acc, i) => acc + (i.preco_custo ?? 0) * i.quantidade, 0)

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestão de Estoque</h1>
          <p className="text-zinc-400 text-sm mt-0.5">Controle suas entradas e saídas em tempo real</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportarCSV}
            className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-sm hover:bg-white/5 hover:text-white transition-all">
            Exportar CSV
          </button>
          <button onClick={() => setModalAdicionar(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-[#c840e0] text-white text-sm font-semibold hover:opacity-90 transition-all">
            + Adicionar produto
          </button>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total de produtos', valor: totalProdutos.toString(), emoji: '📦' },
          { label: 'Estoque baixo/zerado', valor: baixos.toString(), emoji: '⚠️', alerta: baixos > 0 },
          { label: 'Valor total em estoque', valor: fmt(valorTotal, 'moeda'), emoji: '💰' },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl border p-5 ${c.alerta ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.03] border-white/10'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400">{c.label}</p>
                <p className={`text-2xl font-bold mt-1 ${c.alerta ? 'text-red-400' : 'text-white'}`}>{c.valor}</p>
              </div>
              <span className="text-2xl">{c.emoji}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold text-white">Produtos em estoque</h2>
        </div>

        {carregando ? (
          <div className="py-16 text-center text-zinc-500 text-sm">Carregando...</div>
        ) : itens.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-3xl mb-3">📦</p>
            <p className="text-zinc-400 text-sm">Nenhum produto cadastrado ainda.</p>
            <button onClick={() => setModalAdicionar(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#c840e0]/15 border border-[#c840e0]/25 text-[#c840e0] text-sm hover:bg-[#c840e0]/25 transition-all">
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['Produto', 'Qtd atual', 'Qtd mínima', 'Preço custo', 'Preço venda', 'Margem', 'Status', 'Ações'].map((col) => (
                    <th key={col} className="text-left text-xs text-zinc-500 font-medium px-5 py-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {itens.map((item) => {
                  const st = statusItem(item)
                  const cfg = statusConfig[st]
                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4 text-white font-medium">{item.produto_nome}</td>
                      <td className={`px-5 py-4 font-semibold ${st === 'zerado' ? 'text-red-400' : st === 'baixo' ? 'text-yellow-400' : 'text-white'}`}>
                        {item.quantidade}
                      </td>
                      <td className="px-5 py-4 text-zinc-400">{item.quantidade_minima}</td>
                      <td className="px-5 py-4 text-zinc-300">{item.preco_custo ? fmt(item.preco_custo, 'moeda') : '—'}</td>
                      <td className="px-5 py-4 text-zinc-300">{item.preco_venda ? fmt(item.preco_venda, 'moeda') : '—'}</td>
                      <td className="px-5 py-4 text-zinc-300">{item.preco_custo && item.preco_venda ? fmt(margem(item), 'pct') : '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.cor}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setMovimentacao({ item, tipo: 'entrada' })}
                            className="px-2.5 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs hover:bg-green-500/20 transition-all">
                            + Entrada
                          </button>
                          <button onClick={() => setMovimentacao({ item, tipo: 'saida' })}
                            className="px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs hover:bg-red-500/20 transition-all">
                            - Saída
                          </button>
                          <button onClick={() => setItemEditar(item)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 transition-all" title="Editar">
                            ✏️
                          </button>
                          <button onClick={() => remover(item.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Remover">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {(modalAdicionar || itemEditar) && (
        <ModalProduto
          item={itemEditar ?? undefined}
          onFechar={() => { setModalAdicionar(false); setItemEditar(null) }}
          onSalvar={() => { setModalAdicionar(false); setItemEditar(null); buscar() }}
        />
      )}
      {movimentacao && (
        <ModalMovimentacao
          item={movimentacao.item}
          tipo={movimentacao.tipo}
          onFechar={() => setMovimentacao(null)}
          onSalvar={() => { setMovimentacao(null); buscar() }}
        />
      )}
    </>
  )
}
