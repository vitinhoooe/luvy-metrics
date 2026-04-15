'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ProdutoTendencia } from '@/types'

const CATEGORIAS = ['Todas', 'Vibradores', 'Plugs Anais', 'Lubrificantes', 'Acessórios', 'Kits']
const PERIODOS   = ['Hoje', '7 dias', '30 dias']

const SAZONALIDADE = [
  {
    evento: 'Carnaval',
    data: '2026-02-14',
    emoji: '🎭',
    produtos: ['Fantasias sensuais', 'Acessórios de festa', 'Gel corporal'],
    cor: 'from-orange-600/20 to-yellow-600/20',
    borda: 'border-orange-500/20',
  },
  {
    evento: 'Dia dos Namorados',
    data: '2026-06-12',
    emoji: '💑',
    produtos: ['Vibradores premium', 'Kits para casais', 'Lubrificantes especiais'],
    cor: 'from-pink-600/20 to-red-600/20',
    borda: 'border-pink-500/20',
  },
  {
    evento: 'Halloween',
    data: '2026-10-31',
    emoji: '🎃',
    produtos: ['Fantasias adultas', 'Acessórios temáticos', 'Kits surpresa'],
    cor: 'from-orange-700/20 to-purple-700/20',
    borda: 'border-orange-600/20',
  },
  {
    evento: 'Natal / Réveillon',
    data: '2026-12-25',
    emoji: '🎁',
    produtos: ['Kits presentes íntimos', 'Embalagens especiais', 'Combos casal'],
    cor: 'from-red-600/20 to-green-700/20',
    borda: 'border-red-500/20',
  },
]

function diasFaltam(dataStr: string) {
  const diff = new Date(dataStr).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

function badgeCrescimento(pct: number) {
  if (pct > 50) return { label: `🔥 +${pct.toFixed(0)}%`, cor: 'bg-red-500/15 text-red-400 border-red-500/25' }
  if (pct >= 25) return { label: `↑ +${pct.toFixed(0)}%`, cor: 'bg-green-500/15 text-green-400 border-green-500/25' }
  return { label: `→ +${pct.toFixed(0)}%`, cor: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' }
}

// Gera dados mockados de sparkline (7 dias) com base no crescimento
function gerarSparkline(produto: ProdutoTendencia) {
  const base = produto.vendas_ontem || 10
  return Array.from({ length: 7 }, (_, i) => ({
    dia: `D-${6 - i}`,
    vendas: Math.max(0, Math.round(base + (Math.random() - 0.3) * base * 0.4 + (i / 6) * (produto.vendas_hoje - base))),
  }))
}

export default function TendenciasPage() {
  const [produtos, setProdutos] = useState<ProdutoTendencia[]>([])
  const [carregando, setCarregando] = useState(true)
  const [categoria, setCategoria] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [periodo, setPeriodo] = useState('Hoje')
  const [aba, setAba] = useState<'tendencias' | 'sazonalidade'>('tendencias')

  useEffect(() => { buscarProdutos() }, [])

  async function buscarProdutos() {
    setCarregando(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('produtos_tendencia')
      .select('*')
      .order('crescimento_pct', { ascending: false })
    setProdutos(data ?? [])
    setCarregando(false)
  }

  async function adicionarAoEstoque(produto: ProdutoTendencia) {
    const res = await fetch('/api/estoque', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        produto_nome: produto.produto_nome,
        quantidade: 0,
        quantidade_minima: 5,
        preco_custo: produto.preco_medio * 0.5,
        preco_venda: produto.preco_medio,
        categoria: produto.categoria,
      }),
    })
    if (res.ok) toast.success('Produto adicionado ao estoque!')
    else toast.error('Erro ao adicionar ao estoque')
  }

  const filtrados = produtos.filter((p) => {
    const matchCat = categoria === 'Todas' || p.categoria === categoria
    const matchBusca = p.produto_nome.toLowerCase().includes(busca.toLowerCase())
    return matchCat && matchBusca
  })

  // Dados para gráfico geral
  const dadosGrafico = CATEGORIAS.slice(1).map((cat) => {
    const prods = produtos.filter((p) => p.categoria === cat)
    return {
      categoria: cat,
      crescimento: prods.length ? prods.reduce((a, p) => a + p.crescimento_pct, 0) / prods.length : 0,
    }
  })

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Radar de Tendências</h1>
        <p className="text-zinc-400 text-sm mt-0.5">Produtos em alta no mercado adulto hoje</p>
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl w-fit mb-6 border border-white/10">
        {(['tendencias', 'sazonalidade'] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              aba === a ? 'bg-[#c840e0] text-white shadow-sm' : 'text-zinc-400 hover:text-white'
            }`}
          >
            {a === 'tendencias' ? '🔥 Tendências' : '📅 Sazonalidade'}
          </button>
        ))}
      </div>

      {aba === 'tendencias' ? (
        <>
          {/* Gráfico geral */}
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-base font-semibold text-white mb-4">Crescimento médio por categoria</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={dadosGrafico}>
                <XAxis dataKey="categoria" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ background: '#0d0a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v: number) => [`${v.toFixed(1)}%`, 'Crescimento']}
                />
                <Line type="monotone" dataKey="crescimento" stroke="#c840e0" strokeWidth={2} dot={{ fill: '#c840e0', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-3 mb-5">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto..."
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40 min-w-[200px]"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#c840e0]/40"
            >
              {CATEGORIAS.map((c) => <option key={c} value={c} className="bg-[#0d0a13]">{c}</option>)}
            </select>
            <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
              {PERIODOS.map((p) => (
                <button key={p} onClick={() => setPeriodo(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${periodo === p ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Grid de cards */}
          {carregando ? (
            <div className="py-16 text-center text-zinc-500 text-sm">Carregando tendências...</div>
          ) : filtrados.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-zinc-400 text-sm">Nenhum produto encontrado com esses filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtrados.map((produto) => {
                const badge = badgeCrescimento(produto.crescimento_pct)
                const sparkline = gerarSparkline(produto)
                return (
                  <div key={produto.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:border-[#c840e0]/30 transition-all group">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{produto.produto_nome}</h3>
                      <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full border ${badge.cor}`}>
                        {badge.label}
                      </span>
                    </div>

                    {/* Sparkline */}
                    <ResponsiveContainer width="100%" height={60}>
                      <LineChart data={sparkline}>
                        <Line type="monotone" dataKey="vendas" stroke="#c840e0" strokeWidth={1.5} dot={false} />
                        <Tooltip
                          contentStyle={{ background: '#0d0a13', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
                          formatter={(v: number) => [v, 'Vendas']}
                        />
                      </LineChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 gap-2 mt-3 mb-4">
                      <div>
                        <p className="text-xs text-zinc-500">Preço médio</p>
                        <p className="text-sm font-semibold text-white">
                          {produto.preco_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500">Vendas/dia</p>
                        <p className="text-sm font-semibold text-white">{produto.vendas_hoje}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => adicionarAoEstoque(produto)}
                        className="flex-1 py-2 rounded-xl bg-[#c840e0]/10 border border-[#c840e0]/20 text-[#c840e0] text-xs font-medium hover:bg-[#c840e0]/20 transition-all"
                      >
                        + Estoque
                      </button>
                      <a
                        href="/calculadora"
                        className="flex-1 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs font-medium hover:bg-white/5 hover:text-white transition-all text-center"
                      >
                        Calcular lucro
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        /* Sazonalidade */
        <div className="space-y-4">
          <p className="text-sm text-zinc-400 mb-2">Planeje seu estoque com antecedência para os grandes eventos do ano.</p>
          {SAZONALIDADE.map((s) => {
            const dias = diasFaltam(s.data)
            return (
              <div key={s.evento} className={`bg-gradient-to-br ${s.cor} border ${s.borda} rounded-2xl p-6`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl">{s.emoji}</span>
                    <div>
                      <h3 className="text-lg font-bold text-white">{s.evento}</h3>
                      <p className="text-sm text-zinc-400">
                        {new Date(s.data).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{dias}</p>
                    <p className="text-xs text-zinc-400">{dias === 1 ? 'dia restante' : 'dias restantes'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Produtos mais vendidos no período</p>
                  <div className="flex flex-wrap gap-2">
                    {s.produtos.map((p) => (
                      <span key={p} className="px-3 py-1 rounded-full bg-white/10 text-white text-xs border border-white/10">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  💡 Recomendação: abasteça o estoque com pelo menos {Math.min(60, dias)} dias de antecedência.
                </p>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
